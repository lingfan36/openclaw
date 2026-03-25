import type { AnyAgentTool } from "./common.js";
import { jsonResult, ToolAuthorizationError, ToolInputError } from "./common.js";

/**
 * In-memory authorization store.
 * Session-scoped: clears on gateway restart.
 */
const authorizedActions = new Map<string, { expiresAt: number }>();
const GATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function pruneExpired(): void {
	const now = Date.now();
	for (const [k, v] of authorizedActions) {
		if (v.expiresAt < now) authorizedActions.delete(k);
	}
}

export function createOfficeGateTool(): AnyAgentTool {
	return {
		label: "Office Gate",
		name: "office_gate",
		ownerOnly: true,
		description:
			"Dynamic authorization gate for sensitive office operations. " +
			"Use action=request to submit for approval (returns a confirmation summary for the user). " +
			"Use action=execute after user confirms. Use action=status to list active authorizations.",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					enum: ["request", "execute", "status"],
					description: "request=ask for approval, execute=run after confirmation, status=list active",
				},
				operation: {
					type: "string",
					description: "Operation identifier, e.g. gmail_send, gmail_reply, file_delete",
				},
				payload: {
					type: "object",
					description: "Operation arguments to forward when executing",
				},
				confirmation_summary: {
					type: "string",
					description: "Human-readable summary shown to user for confirmation",
				},
			},
			required: ["action"],
		},
		execute: async (_toolCallId, args) => {
			const { action, operation, payload, confirmation_summary } = args;

			if (action === "request") {
				if (!operation) throw new ToolInputError("operation is required for request");
				return jsonResult({
					status: "awaiting_confirmation",
					operation,
					summary: confirmation_summary || `Requesting approval for: ${operation}`,
					instruction: "Present the summary to the user and wait for explicit confirmation before calling office_gate(action='execute').",
				});
			}

			if (action === "execute") {
				if (!operation) throw new ToolInputError("operation is required for execute");
				const key = `${operation}:${Date.now()}`;
				authorizedActions.set(key, { expiresAt: Date.now() + GATE_TTL_MS });
				return jsonResult({
					status: "authorized",
					operation,
					expires_in_seconds: GATE_TTL_MS / 1000,
					payload_echo: payload,
					next: `Authorization granted. You may now call the ${operation} tool with the provided payload.`,
				});
			}

			if (action === "status") {
				pruneExpired();
				const active = [...authorizedActions.entries()].map(([k, v]) => ({
					key: k,
					expires_at: new Date(v.expiresAt).toISOString(),
				}));
				return jsonResult({
					active_authorizations: active,
					count: active.length,
				});
			}

			throw new ToolAuthorizationError(`Unknown action: ${action}`);
		},
	};
}
