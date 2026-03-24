import { glob } from "glob";
import path from "node:path";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

export function createLocalFindTool(): AnyAgentTool {
  return {
    label: "Local Find",
    name: "local_find",
    description: "Find files by glob pattern or path pattern (read-only)",
    parameters: {
      type: "object",
      properties: {
        root: {
          type: "string",
          description: "Root directory to search from",
        },
        pattern: {
          type: "string",
          description: "Glob pattern (e.g., **/*.ts, src/**/*.md)",
        },
        exclude: {
          type: "array",
          items: { type: "string" },
          description: "Patterns to exclude",
        },
        max_results: {
          type: "number",
          description: "Maximum number of results",
          default: 100,
        },
      },
      required: ["root", "pattern"],
    },
    execute: async (_toolCallId, args) => {
      const { root, pattern, exclude = [], max_results = 100 } = args;

      const files = await glob(pattern, {
        cwd: root,
        ignore: exclude,
        nodir: true,
        absolute: true,
      });

      const results = files.slice(0, max_results).map(f => ({
        path: f,
        relative: path.relative(root, f),
      }));

      return jsonResult({
        root,
        pattern,
        count: results.length,
        total: files.length,
        files: results,
      });
    },
  };
}
