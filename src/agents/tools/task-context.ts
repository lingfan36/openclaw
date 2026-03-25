import fs from "node:fs/promises";
import path from "node:path";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, ToolInputError } from "./common.js";

const VALID_STATUSES = [
	"PENDING",
	"RUNNING",
	"AWAITING",
	"RETRYING",
	"PAUSED",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
] as const;

const VALID_TRANSITIONS: Record<string, readonly string[]> = {
	PENDING: ["RUNNING"],
	RUNNING: ["AWAITING", "COMPLETED", "RETRYING", "PAUSED", "FAILED"],
	AWAITING: ["RUNNING", "CANCELLED"],
	RETRYING: ["RUNNING", "PAUSED"],
	PAUSED: ["RUNNING", "CANCELLED"],
	COMPLETED: [],
	FAILED: [],
	CANCELLED: [],
};

type TaskStatus = (typeof VALID_STATUSES)[number];

type PipelineStep = {
	pipeline: string;
	action: string;
	status: string;
};

type TaskContext = {
	task_id: string;
	title: string;
	status: TaskStatus;
	created_at: string;
	updated_at: string;
	pipeline_chain: PipelineStep[];
	current_step_index: number;
	artifacts: Record<string, unknown>;
	step_log: unknown[];
	progress: string;
};

/** Atomic write: tmp file → rename. */
async function atomicWrite(filePath: string, data: string): Promise<void> {
	const tmp = filePath + ".tmp";
	await fs.writeFile(tmp, data);
	await fs.rename(tmp, filePath);
}

async function readCtx(ctxPath: string): Promise<TaskContext> {
	const raw = await fs.readFile(ctxPath, "utf-8");
	return JSON.parse(raw) as TaskContext;
}

function updateProgress(ctx: TaskContext): void {
	const total = ctx.pipeline_chain.length;
	const done = ctx.pipeline_chain.filter(
		(s) => s.status === "COMPLETED",
	).length;
	ctx.progress = `${done}/${total}`;
}

export function createTaskContextTool(workspaceRoot: string): AnyAgentTool {
	const tasksDir = path.join(workspaceRoot, "memory", "tasks");

	return {
		label: "Task Context",
		name: "task_context",
		description:
			"Manage composite task state machine. " +
			"Actions: create, transition, log, read, list, set_artifact, advance_step.",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					enum: [
						"create",
						"transition",
						"log",
						"read",
						"list",
						"set_artifact",
						"advance_step",
					],
					description: "Operation to perform on the task context",
				},
				task_id: {
					type: "string",
					description: "Task identifier (required for all actions except create and list)",
				},
				title: {
					type: "string",
					description: "Task title (for create)",
				},
				pipeline_chain: {
					type: "array",
					items: {
						type: "object",
						properties: {
							pipeline: { type: "string" },
							action: { type: "string" },
						},
					},
					description: "Ordered list of pipeline steps (for create)",
				},
				new_status: {
					type: "string",
					description: "Target status (for transition)",
				},
				step_log_entry: {
					type: "object",
					description: "Structured log entry to append (for log)",
				},
				artifact_key: {
					type: "string",
					description: "Artifact key (for set_artifact)",
				},
				artifact_value: {
					type: "object",
					description: "Artifact data (for set_artifact)",
				},
			},
			required: ["action"],
		},
		execute: async (_toolCallId, args) => {
			const { action, task_id } = args;

			// ── create ──
			if (action === "create") {
				const id =
					task_id || `${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`;
				const taskDir = path.join(tasksDir, id);
				await fs.mkdir(taskDir, { recursive: true });

				const chain: PipelineStep[] = (args.pipeline_chain || []).map(
					(s: { pipeline?: string; action?: string }) => ({
						pipeline: s.pipeline || "",
						action: s.action || "",
						status: "PENDING",
					}),
				);

				const ctx: TaskContext = {
					task_id: id,
					title: args.title || "",
					status: "PENDING",
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					pipeline_chain: chain,
					current_step_index: 0,
					artifacts: {},
					step_log: [],
					progress: `0/${chain.length}`,
				};

				await atomicWrite(
					path.join(taskDir, "context.json"),
					JSON.stringify(ctx, null, 2),
				);
				return jsonResult(ctx);
			}

			// ── list ──
			if (action === "list") {
				try {
					const dirs = await fs.readdir(tasksDir);
					const tasks: Array<{
						task_id: string;
						title: string;
						status: string;
						progress: string;
					}> = [];
					for (const d of dirs) {
						try {
							const ctx = await readCtx(
								path.join(tasksDir, d, "context.json"),
							);
							tasks.push({
								task_id: ctx.task_id,
								title: ctx.title,
								status: ctx.status,
								progress: ctx.progress,
							});
						} catch {
							/* skip broken tasks */
						}
					}
					return jsonResult({ tasks, count: tasks.length });
				} catch {
					return jsonResult({ tasks: [], count: 0 });
				}
			}

			// All remaining actions require task_id
			if (!task_id) throw new ToolInputError("task_id is required");
			const ctxPath = path.join(tasksDir, task_id, "context.json");

			// ── read ──
			if (action === "read") {
				const ctx = await readCtx(ctxPath);
				return jsonResult(ctx);
			}

			// ── transition ──
			if (action === "transition") {
				const ctx = await readCtx(ctxPath);
				const newStatus = args.new_status as TaskStatus;
				if (!VALID_STATUSES.includes(newStatus)) {
					throw new ToolInputError(
						`Invalid status: ${newStatus}. Valid: ${VALID_STATUSES.join(", ")}`,
					);
				}
				const allowed = VALID_TRANSITIONS[ctx.status] || [];
				if (!allowed.includes(newStatus)) {
					throw new ToolInputError(
						`Cannot transition ${ctx.status} → ${newStatus}. Allowed: ${allowed.join(", ") || "none"}`,
					);
				}
				ctx.status = newStatus;
				ctx.updated_at = new Date().toISOString();

				// Sync current step status
				const step = ctx.pipeline_chain[ctx.current_step_index];
				if (step) {
					if (newStatus === "RUNNING") step.status = "RUNNING";
					if (newStatus === "COMPLETED") step.status = "COMPLETED";
					if (newStatus === "FAILED") step.status = "FAILED";
					if (newStatus === "AWAITING") step.status = "AWAITING";
					if (newStatus === "PAUSED") step.status = "PAUSED";
				}
				updateProgress(ctx);

				await atomicWrite(ctxPath, JSON.stringify(ctx, null, 2));
				return jsonResult(ctx);
			}

			// ── advance_step ──
			if (action === "advance_step") {
				const ctx = await readCtx(ctxPath);
				const step = ctx.pipeline_chain[ctx.current_step_index];
				if (step) step.status = "COMPLETED";
				ctx.current_step_index += 1;
				const nextStep = ctx.pipeline_chain[ctx.current_step_index];
				if (nextStep) {
					nextStep.status = "RUNNING";
					ctx.status = "RUNNING";
				} else {
					ctx.status = "COMPLETED";
				}
				ctx.updated_at = new Date().toISOString();
				updateProgress(ctx);

				await atomicWrite(ctxPath, JSON.stringify(ctx, null, 2));
				return jsonResult(ctx);
			}

			// ── log ──
			if (action === "log") {
				const ctx = await readCtx(ctxPath);
				ctx.step_log.push({
					...(args.step_log_entry || {}),
					logged_at: new Date().toISOString(),
				});
				ctx.updated_at = new Date().toISOString();

				await atomicWrite(ctxPath, JSON.stringify(ctx, null, 2));
				return jsonResult({
					logged: true,
					total_logs: ctx.step_log.length,
				});
			}

			// ── set_artifact ──
			if (action === "set_artifact") {
				if (!args.artifact_key) {
					throw new ToolInputError("artifact_key is required");
				}
				const ctx = await readCtx(ctxPath);
				ctx.artifacts[args.artifact_key] = args.artifact_value;
				ctx.updated_at = new Date().toISOString();

				await atomicWrite(ctxPath, JSON.stringify(ctx, null, 2));
				return jsonResult({ set: true, key: args.artifact_key });
			}

			throw new ToolInputError(`Unknown action: ${action}`);
		},
	};
}
