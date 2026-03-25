import { describe, expect, test } from "vitest";
import { createOfficeGateTool } from "./office-gate.js";

function parse(result: { content: Array<{ text: string }> }) {
	return JSON.parse(result.content[0].text);
}

describe("office_gate", () => {
	const tool = createOfficeGateTool();

	test("has correct metadata", () => {
		expect(tool.name).toBe("office_gate");
		expect(tool.ownerOnly).toBe(true);
		expect(tool.parameters.required).toContain("action");
	});

	test("request returns awaiting_confirmation", async () => {
		const result = await tool.execute("t1", {
			action: "request",
			operation: "gmail_send",
			confirmation_summary: "Send email to boss",
		});
		const data = parse(result);
		expect(data.status).toBe("awaiting_confirmation");
		expect(data.operation).toBe("gmail_send");
	});

	test("request without operation throws ToolInputError", async () => {
		await expect(tool.execute("t2", { action: "request" })).rejects.toThrow(
			"operation is required",
		);
	});

	test("execute returns authorized", async () => {
		const result = await tool.execute("t3", {
			action: "execute",
			operation: "gmail_send",
			payload: { to: "boss@co.com" },
		});
		const data = parse(result);
		expect(data.status).toBe("authorized");
		expect(data.expires_in_seconds).toBe(300);
	});

	test("status shows active authorizations", async () => {
		// execute first to populate
		await tool.execute("t4", { action: "execute", operation: "test_op" });
		const result = await tool.execute("t5", { action: "status" });
		const data = parse(result);
		expect(data.count).toBeGreaterThan(0);
	});

	test("unknown action throws ToolAuthorizationError", async () => {
		await expect(
			tool.execute("t6", { action: "bad", operation: "x" }),
		).rejects.toThrow("Unknown action");
	});
});
