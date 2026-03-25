import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

/**
 * Agent Tool Guard — per-agent tool access control.
 *
 * Uses before_tool_call hook to hard-block tools that an agent should not call.
 * Rules are configured in openclaw.json under plugins.entries.agent-tool-guard.
 *
 * Config example:
 * ```json
 * {
 *   "plugins": {
 *     "entries": {
 *       "agent-tool-guard": {
 *         "enabled": true,
 *         "rules": {
 *           "search": ["writing_*", "write", "edit"],
 *           "writing": ["local_find", "local_grep"]
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 */

type GuardRules = Record<string, string[]>;

/** Simple glob matcher: supports trailing * only (e.g. "writing_*" matches "writing_draft"). */
function matchPattern(name: string, pattern: string): boolean {
  if (pattern.endsWith("*")) {
    return name.startsWith(pattern.slice(0, -1));
  }
  return name === pattern;
}

function isBlocked(agentId: string, toolName: string, rules: GuardRules): string | null {
  const patterns = rules[agentId];
  if (!patterns || patterns.length === 0) {
    return null;
  }
  for (const pattern of patterns) {
    if (matchPattern(toolName, pattern)) {
      return pattern;
    }
  }
  return null;
}

export default definePluginEntry({
  id: "agent-tool-guard",
  name: "Agent Tool Guard",
  description: "Per-agent tool access control via before_tool_call hook",
  register(api) {
    const config = api.pluginConfig as { rules?: GuardRules } | undefined;
    const rules: GuardRules = config?.rules ?? {};

    if (Object.keys(rules).length === 0) {
      api.logger.info("agent-tool-guard: no rules configured, hook not registered");
      return;
    }

    api.logger.info(
      `agent-tool-guard: loaded rules for ${Object.keys(rules).length} agent(s): ${Object.keys(rules).join(", ")}`,
    );

    api.on("before_tool_call", (event, ctx) => {
      const agentId = ctx.agentId;
      api.logger.info(
        `agent-tool-guard: check agentId="${agentId ?? "undefined"}" tool="${ctx.toolName}"`,
      );
      if (!agentId) {
        return;
      }
      const matchedPattern = isBlocked(agentId, ctx.toolName, rules);
      if (matchedPattern) {
        api.logger.info(
          `agent-tool-guard: BLOCKED agent="${agentId}" tool="${ctx.toolName}" rule="${matchedPattern}"`,
        );
        return {
          block: true,
          blockReason: `Tool "${ctx.toolName}" is not allowed for agent "${agentId}" (matched deny rule: "${matchedPattern}"). This tool is outside your authorized scope.`,
        };
      }
    });
  },
});
