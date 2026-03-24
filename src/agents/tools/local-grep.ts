import { readFile } from "node:fs/promises";
import { glob } from "glob";
import path from "node:path";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

export function createLocalGrepTool(): AnyAgentTool {
  return {
    label: "Local Grep",
    name: "local_grep",
    description: "Search file contents by keyword or regex (read-only)",
    parameters: {
      type: "object",
      properties: {
        root: {
          type: "string",
          description: "Root directory to search",
        },
        query: {
          type: "string",
          description: "Search keyword or regex pattern",
        },
        extensions: {
          type: "array",
          items: { type: "string" },
          description: "File extensions to search (e.g., ['.ts', '.md'])",
        },
        case_sensitive: {
          type: "boolean",
          description: "Case sensitive search",
          default: false,
        },
        context_lines: {
          type: "number",
          description: "Number of context lines before/after match",
          default: 2,
        },
        max_matches: {
          type: "number",
          description: "Maximum number of matches",
          default: 50,
        },
      },
      required: ["root", "query"],
    },
    execute: async (_toolCallId, args) => {
      const {
        root,
        query,
        extensions = [],
        case_sensitive = false,
        context_lines = 2,
        max_matches = 50,
      } = args;

      const pattern = extensions.length > 0
        ? `**/*{${extensions.join(",")}}`
        : "**/*";

      const files = await glob(pattern, {
        cwd: root,
        nodir: true,
        absolute: true,
      });

      const regex = new RegExp(query, case_sensitive ? "g" : "gi");
      const matches: any[] = [];

      for (const file of files) {
        if (matches.length >= max_matches) break;

        try {
          const content = await readFile(file, "utf-8");
          const lines = content.split("\n");

          for (let i = 0; i < lines.length; i++) {
            if (matches.length >= max_matches) break;
            if (regex.test(lines[i])) {
              const start = Math.max(0, i - context_lines);
              const end = Math.min(lines.length, i + context_lines + 1);

              matches.push({
                file: path.relative(root, file),
                line: i + 1,
                snippet: lines.slice(start, end).join("\n"),
                match: lines[i].trim(),
              });
            }
          }
        } catch (err) {
          // Skip binary or unreadable files
        }
      }

      return jsonResult({
        root,
        query,
        count: matches.length,
        matches,
      });
    },
  };
}


