import { describe, expect, it } from "vitest";

// Test the matching logic directly
type GuardRules = Record<string, string[]>;

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

const RULES: GuardRules = {
  search: ["writing_*", "write", "edit"],
  writing: ["local_find", "local_grep"],
};

describe("agent-tool-guard", () => {
  describe("matchPattern", () => {
    it("matches exact tool name", () => {
      expect(matchPattern("write", "write")).toBe(true);
      expect(matchPattern("write", "edit")).toBe(false);
    });

    it("matches wildcard prefix", () => {
      expect(matchPattern("writing_draft", "writing_*")).toBe(true);
      expect(matchPattern("writing_content", "writing_*")).toBe(true);
      expect(matchPattern("writing_polish", "writing_*")).toBe(true);
      expect(matchPattern("search_web", "writing_*")).toBe(false);
    });

    it("does not partial match without wildcard", () => {
      expect(matchPattern("writing_draft", "writing")).toBe(false);
    });
  });

  describe("isBlocked", () => {
    it("blocks search agent from writing tools", () => {
      expect(isBlocked("search", "writing_draft", RULES)).toBe("writing_*");
      expect(isBlocked("search", "writing_content", RULES)).toBe("writing_*");
      expect(isBlocked("search", "writing_polish", RULES)).toBe("writing_*");
      expect(isBlocked("search", "writing_review", RULES)).toBe("writing_*");
      expect(isBlocked("search", "writing_rewrite", RULES)).toBe("writing_*");
      expect(isBlocked("search", "write", RULES)).toBe("write");
      expect(isBlocked("search", "edit", RULES)).toBe("edit");
    });

    it("allows search agent to use search tools", () => {
      expect(isBlocked("search", "search_web", RULES)).toBeNull();
      expect(isBlocked("search", "fetch_web_page", RULES)).toBeNull();
      expect(isBlocked("search", "local_find", RULES)).toBeNull();
      expect(isBlocked("search", "read", RULES)).toBeNull();
    });

    it("blocks writing agent from local search tools", () => {
      expect(isBlocked("writing", "local_find", RULES)).toBe("local_find");
      expect(isBlocked("writing", "local_grep", RULES)).toBe("local_grep");
    });

    it("allows writing agent to use writing tools", () => {
      expect(isBlocked("writing", "writing_draft", RULES)).toBeNull();
      expect(isBlocked("writing", "writing_content", RULES)).toBeNull();
      expect(isBlocked("writing", "search_web", RULES)).toBeNull();
    });

    it("ignores agents not in rules", () => {
      expect(isBlocked("office", "writing_draft", RULES)).toBeNull();
      expect(isBlocked("unknown", "write", RULES)).toBeNull();
    });

    it("handles empty rules", () => {
      expect(isBlocked("search", "writing_draft", {})).toBeNull();
    });

    it("handles agent with empty deny list", () => {
      expect(isBlocked("search", "writing_draft", { search: [] })).toBeNull();
    });
  });
});
