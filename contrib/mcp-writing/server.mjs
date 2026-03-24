import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const sessions = new Map();

const server = new McpServer({
  name: "writing",
  version: "1.0.0",
});

// ── 起草：第一步只返回大纲要求 ──
server.tool(
  "writing_draft",
  "起草文章。必须先调用此工具获取大纲，用户确认后再调用 writing_content 生成正文。禁止不调用此工具直接写文章。",
  {
    topic: { type: "string", description: "文章主题" },
    requirements: { type: "string", description: "额外要求（可选）" },
  },
  async ({ topic, requirements }) => {
    const id = Date.now().toString(36);
    sessions.set(id, { topic, requirements, step: "outline" });
    return {
      content: [
        {
          type: "text",
          text: [
            `【写作任务 #${id}】`,
            `主题：${topic}`,
            requirements ? `要求：${requirements}` : "",
            "",
            "── 请你现在只输出大纲 ──",
            "",
            "格式要求：",
            "### 大纲",
            "1. **章节标题** — 一句话说明",
            "2. **章节标题** — 一句话说明",
            "",
            "> 输出大纲后停止，告诉用户「请确认大纲，确认后我调用 writing_content 生成正文」",
            "",
            "⚠️ 禁止在本轮输出任何正文内容。",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    };
  }
);

// ── 起草：第二步生成正文 ──
server.tool(
  "writing_content",
  "用户确认大纲后调用此工具生成正文。必须在 writing_draft 之后、用户确认大纲之后才能调用。",
  {
    outline: { type: "string", description: "已确认的大纲内容" },
    topic: { type: "string", description: "文章主题" },
  },
  async ({ outline, topic }) => {
    return {
      content: [
        {
          type: "text",
          text: [
            "── 现在按章节批量输出正文 ──",
            "",
            `主题：${topic}`,
            `大纲：`,
            outline,
            "",
            "请按以上大纲逐章输出完整正文。每章用 ## 标题 分隔。",
          ].join("\n"),
        },
      ],
    };
  }
);

// ── 润色 ──
server.tool(
  "writing_polish",
  "润色文本。必须调用此工具，禁止不调用直接润色。",
  {
    text: { type: "string", description: "需要润色的原文" },
  },
  async ({ text }) => {
    return {
      content: [
        {
          type: "text",
          text: [
            "── 请严格按以下格式输出，缺一不可 ──",
            "",
            "### 原文",
            `> ${text}`,
            "",
            "### 修改版",
            "[在此写改进后的文本]",
            "",
            "### 修改说明",
            "| 原文片段 | 修改后 | 理由 |",
            "|----------|--------|------|",
            "| [原文] | [改后] | [理由] |",
            "",
            "⚠️ 红线：不改变原意，不删除核心观点。每处修改必须说明理由。",
          ].join("\n"),
        },
      ],
    };
  }
);

// ── 审稿 ──
server.tool(
  "writing_review",
  "审稿检查。必须调用此工具，禁止不调用直接审稿。",
  {
    text: { type: "string", description: "需要审稿的文本" },
  },
  async ({ text }) => {
    return {
      content: [
        {
          type: "text",
          text: [
            "── 请严格按以下格式输出 ──",
            "",
            "### 整体评价",
            "[1-2句总评]",
            "",
            "### 问题清单",
            "**严重问题：**",
            "| # | 位置 | 问题 | 建议 |",
            "|---|------|------|------|",
            "",
            "**轻微问题：**",
            "| # | 位置 | 问题 | 建议 |",
            "|---|------|------|------|",
            "",
            "⚠️ 必须标注具体位置（第X段/第X句），必须区分严重/轻微。",
          ].join("\n"),
        },
      ],
    };
  }
);

// ── 改写 ──
server.tool(
  "writing_rewrite",
  "改写文本。必须调用此工具，禁止不调用直接改写。",
  {
    text: { type: "string", description: "原文" },
    instruction: { type: "string", description: "改写要求（如：改成正式语气）" },
  },
  async ({ text, instruction }) => {
    return {
      content: [
        {
          type: "text",
          text: [
            "── 请严格按以下格式输出 ──",
            "",
            `改写要求：${instruction}`,
            "",
            "### 改写版",
            "[改写后的完整文本]",
            "",
            "### 变化说明",
            "| 原文 | 改写后 | 理由 |",
            "|------|--------|------|",
            "| [原文片段] | [改后] | [理由] |",
          ].join("\n"),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
