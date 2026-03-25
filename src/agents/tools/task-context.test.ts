import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createTaskContextTool } from "./task-context.js";

function parse(result: { content: Array<{ text: string }> }) {
	return JSON.parse(result.content[0].text);
}

describe("task_context", () => {
	let tmpDir: string;
	let tool: ReturnType<typeof createTaskContextTool>;

	beforeEach(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tc-test-"));
		tool = createTaskContextTool(tmpDir);
	});

	afterEach(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	test("has correct metadata", () => {
		expect(tool.name).toBe("task_context");
		expect(tool.parameters.required).toContain("action");
	});

	test("create initializes task with PENDING status", async () => {
		const result = await tool.execute("t1", {
			action: "create",
			title: "Test task",
			pipeline_chain: [
				{ pipeline: "search", action: "web" },
				{ pipeline: "writing", action: "draft" },
			],
		});
		const data = parse(result);
		expect(data.status).toBe("PENDING");
		expect(data.title).toBe("Test task");
		expect(data.pipeline_chain).toHaveLength(2);
		expect(data.progress).toBe("0/2");
	});

	test("read returns created task", async () => {
		const r1 = await tool.execute("t1", {
			action: "create",
			task_id: "test-read",
			title: "Read test",
		});
		const created = parse(r1);

		const r2 = await tool.execute("t2", {
			action: "read",
			task_id: created.task_id,
		});
		const data = parse(r2);
		expect(data.title).toBe("Read test");
	});

	test("transition enforces valid state changes", async () => {
		const r1 = await tool.execute("t1", {
			action: "create",
			task_id: "test-trans",
			pipeline_chain: [{ pipeline: "a", action: "x" }],
		});
		const created = parse(r1);

		// PENDING → RUNNING (valid)
		const r2 = await tool.execute("t2", {
			action: "transition",
			task_id: created.task_id,
			new_status: "RUNNING",
		});
		const d2 = parse(r2);
		expect(d2.status).toBe("RUNNING");

		// RUNNING → AWAITING (valid)
		const r3 = await tool.execute("t3", {
			action: "transition",
			task_id: created.task_id,
			new_status: "AWAITING",
		});
		const d3 = parse(r3);
		expect(d3.status).toBe("AWAITING");

		// AWAITING → COMPLETED (invalid)
		await expect(
			tool.execute("t4", {
				action: "transition",
				task_id: created.task_id,
				new_status: "COMPLETED",
			}),
		).rejects.toThrow("Cannot transition");
	});

	test("advance_step moves to next pipeline step", async () => {
		const r1 = await tool.execute("t1", {
			action: "create",
			task_id: "test-adv",
			pipeline_chain: [
				{ pipeline: "a", action: "x" },
				{ pipeline: "b", action: "y" },
			],
		});
		const created = parse(r1);

		// Start
		await tool.execute("t2", {
			action: "transition",
			task_id: created.task_id,
			new_status: "RUNNING",
		});

		// Advance step 0 → step 1
		const r3 = await tool.execute("t3", {
			action: "advance_step",
			task_id: created.task_id,
		});
		const d3 = parse(r3);
		expect(d3.current_step_index).toBe(1);
		expect(d3.pipeline_chain[0].status).toBe("COMPLETED");
		expect(d3.pipeline_chain[1].status).toBe("RUNNING");
		expect(d3.progress).toBe("1/2");

		// Advance step 1 → completed
		const r4 = await tool.execute("t4", {
			action: "advance_step",
			task_id: created.task_id,
		});
		const d4 = parse(r4);
		expect(d4.status).toBe("COMPLETED");
		expect(d4.progress).toBe("2/2");
	});

	test("log appends step_log entries", async () => {
		await tool.execute("t1", {
			action: "create",
			task_id: "test-log",
		});

		const r2 = await tool.execute("t2", {
			action: "log",
			task_id: "test-log",
			step_log_entry: { step: 0, tool: "search_web", status: "ok" },
		});
		const d2 = parse(r2);
		expect(d2.logged).toBe(true);
		expect(d2.total_logs).toBe(1);
	});

	test("set_artifact stores data", async () => {
		await tool.execute("t1", {
			action: "create",
			task_id: "test-art",
		});

		await tool.execute("t2", {
			action: "set_artifact",
			task_id: "test-art",
			artifact_key: "step_0",
			artifact_value: { type: "text", content: "hello" },
		});

		const r3 = await tool.execute("t3", {
			action: "read",
			task_id: "test-art",
		});
		const d3 = parse(r3);
		expect(d3.artifacts.step_0.content).toBe("hello");
	});

	test("list returns all tasks", async () => {
		await tool.execute("t1", { action: "create", task_id: "list-a", title: "A" });
		await tool.execute("t2", { action: "create", task_id: "list-b", title: "B" });

		const r3 = await tool.execute("t3", { action: "list" });
		const d3 = parse(r3);
		expect(d3.count).toBe(2);
	});

	test("missing task_id throws error", async () => {
		await expect(
			tool.execute("t1", { action: "read" }),
		).rejects.toThrow("task_id is required");
	});

	test("invalid status throws error", async () => {
		await tool.execute("t1", { action: "create", task_id: "test-inv" });
		await expect(
			tool.execute("t2", {
				action: "transition",
				task_id: "test-inv",
				new_status: "BOGUS",
			}),
		).rejects.toThrow("Invalid status");
	});
});
