import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

// ── 常量 ──
const SEARCH_TIMEOUT = 8000;
const FETCH_TIMEOUT = 10000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_CONTENT_CHARS = 20000;
const ADVANCED_TOP_K = 3;

// ── Provider 接口 ──
// 当前：bing | 预留：searxng, brave, exa, custom

async function bingSearch(query, maxResults) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${maxResults}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await resp.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const results = [];
  doc.querySelectorAll("li.b_algo").forEach((el, i) => {
    if (i >= maxResults) return;
    const a = el.querySelector("h2 a");
    const snippet = el.querySelector(".b_caption p, .b_algoSlug");
    if (a) {
      results.push({
        title: a.textContent?.trim() || "",
        url: a.href || "",
        snippet: snippet?.textContent?.trim() || "",
        position: i,
      });
    }
  });
  return results;
}

const providers = [
  { name: "bing", search: bingSearch },
  // 预留: { name: "searxng", search: searxngSearch },
];

async function searchWithProviders(query, maxResults) {
  for (const provider of providers) {
    try {
      const results = await Promise.race([
        provider.search(query, maxResults),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), SEARCH_TIMEOUT)),
      ]);
      if (results?.length) return { provider: provider.name, results };
    } catch (_) {
      // try next provider
    }
  }
  return null;
}

// ── Score 计算 ──

function computeScore(result, query, totalResults) {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const title = (result.title || "").toLowerCase();
  const snippet = (result.snippet || "").toLowerCase();
  const url = (result.url || "").toLowerCase();

  // 位置分：第1名0.5，逐步递减
  let score = Math.max(0, 0.5 - (result.position / totalResults) * 0.5);

  // 标题命中
  if (keywords.some(k => title.includes(k))) score += 0.1;
  // snippet 命中
  if (keywords.some(k => snippet.includes(k))) score += 0.1;
  // URL 命中
  if (keywords.some(k => url.includes(k))) score += 0.05;

  return Math.min(1, Math.round(score * 100) / 100);
}

// ── 正文提取（三级降级）──

function extractContent(html, url) {
  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    // 第一级：Readability
    try {
      const reader = new Readability(doc.cloneNode(true));
      const article = reader.parse();
      if (article?.textContent?.trim().length > 100) {
        return {
          content: article.textContent.trim().slice(0, MAX_CONTENT_CHARS),
          title: article.title || doc.title || "",
          method: "readability",
        };
      }
    } catch (_) {}

    // 第二级：粗清洗
    try {
      for (const sel of ["script", "style", "nav", "header", "footer", "aside", "iframe"]) {
        doc.querySelectorAll(sel).forEach(el => el.remove());
      }
      const bodyText = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
      if (bodyText.length > 100) {
        return {
          content: bodyText.slice(0, MAX_CONTENT_CHARS),
          title: doc.title || "",
          method: "clean",
        };
      }
    } catch (_) {}

    // 第三级：原始可见文本截断
    const raw = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      content: raw.slice(0, MAX_CONTENT_CHARS),
      title: doc.title || "",
      method: "truncated",
    };
  } catch (err) {
    return { content: "", title: "", method: "error", error: err.message };
  }
}

// ── 日期提取 ──

function extractPublishedAt(html) {
  const patterns = [
    /"datePublished"\s*:\s*"([^"]+)"/,
    /"dateModified"\s*:\s*"([^"]+)"/,
    /published.*?(\d{4}-\d{2}-\d{2})/i,
    /datetime="(\d{4}-\d{2}-\d{2})/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].slice(0, 10);
  }
  return null;
}

// ── fetch 页面 ──

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SearchBot/1.0)" },
      redirect: "follow",
    });

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return { error: { code: "UNSUPPORTED_CONTENT_TYPE", message: contentType } };
    }

    const buffer = await resp.arrayBuffer();
    if (buffer.byteLength > MAX_BODY_BYTES) {
      return { error: { code: "BODY_TOO_LARGE", message: `${buffer.byteLength} bytes` } };
    }

    const html = new TextDecoder().decode(buffer);
    const extracted = extractContent(html, url);
    const publishedAt = extractPublishedAt(html);

    return {
      url,
      final_url: resp.url,
      title: extracted.title,
      content: extracted.content,
      extraction_method: extracted.method,
      word_count: extracted.content.split(/\s+/).length,
      status_code: resp.status,
      content_type: contentType.split(";")[0].trim(),
      published_at: publishedAt,
      retrieved_at: new Date().toISOString(),
    };
  } catch (err) {
    const code = err.name === "AbortError" ? "TIMEOUT" : "FETCH_FAILED";
    return { error: { code, message: err.message } };
  } finally {
    clearTimeout(timer);
  }
}

// ── MCP Server ──

const server = new McpServer({
  name: "search",
  version: "1.0.0",
});

// ── search_web ──
server.tool(
  "search_web",
  "Search the web. basic: returns snippets. advanced: also fetches top 3 pages.",
  {
    query: z.string().describe("Search query"),
    max_results: z.number().optional().describe("Max results (default 10)"),
    search_depth: z.enum(["basic", "advanced"]).optional().describe("basic or advanced"),
  },
  async ({ query, max_results, search_depth }) => {
    const maxResults = max_results || 10;
    const depth = search_depth || "basic";

    const searched = await searchWithProviders(query, maxResults);
    if (!searched) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "error",
            query,
            depth,
            results: [],
            error: { code: "ALL_PROVIDERS_FAILED", message: "No search provider returned results" },
          }),
        }],
      };
    }

    let results = searched.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      score: computeScore(r, query, searched.results.length),
      fetched: false,
      content_excerpt: null,
    }));

    // advanced: fetch Top K
    if (depth === "advanced") {
      const topK = results.slice(0, ADVANCED_TOP_K);
      await Promise.all(topK.map(async (r) => {
        const page = await fetchPage(r.url);
        if (!page.error && page.content) {
          r.fetched = true;
          r.content_excerpt = page.content.slice(0, 500);
          // 正文命中加分
          const keywords = query.toLowerCase().split(/\s+/);
          const content = page.content.toLowerCase();
          if (keywords.some(k => content.includes(k))) {
            r.score = Math.min(1, r.score + 0.15);
          }
        }
      }));
    }

    // 按 score 排序
    results.sort((a, b) => b.score - a.score);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "ok",
          query,
          depth,
          results,
          error: null,
        }),
      }],
    };
  }
);

// ── fetch_web_page ──
server.tool(
  "fetch_web_page",
  "Fetch and extract content from a web page (read-only, with 3-level fallback).",
  {
    url: z.string().describe("URL to fetch"),
  },
  async ({ url }) => {
    const result = await fetchPage(url);

    if (result.error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "error",
            url,
            error: result.error,
          }),
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "ok",
          ...result,
          error: null,
        }),
      }],
    };
  }
);

// ── 启动 ──
const transport = new StdioServerTransport();
await server.connect(transport);
