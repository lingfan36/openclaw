# 手动 E2E 测试案例

## 测试环境准备

```bash
cd E:/openclaw-main/openclaw-main

# 确保依赖已安装
pnpm install

# 启动 OpenClaw Gateway（新终端）
node openclaw.mjs gateway --port 18789 --verbose
```

---

## 测试案例 1: Search Agent - 本地搜索

### 目标
验证 search-agent 能够搜索本地知识库

### 步骤
```bash
# 在另一个终端执行
node openclaw.mjs agent \
  --agent search-agent \
  --message "搜索 OpenClaw 的核心架构"
```

### 预期结果
- ✅ Agent 成功调用 `research` 工具
- ✅ 返回本地文件搜索结果
- ✅ 包含文件路径和相关内容片段

### 实际回复：

````
Config warnings:\n- plugins.entries.deepgram: plugin deepgram: plugin id mismatch (manifest uses "deepgram", entry hints "deepgram-media-understanding")
- plugins.entries.groq: plugin groq: plugin id mismatch (manifest uses "groq", entry hints "groq-media-understanding")
21:37:03 [agents/auth-profiles] inherited auth-profiles from main agent
21:37:04 [agent/embedded] low context window: nvidia/nvidia/nemotron-3-super-120b-a12b ctx=20000 (warn<32000) source=modelsConfig
21:37:04 [tools] agents.search-agent.tools.allow allowlist contains unknown entries (research, search_synthesize). These entries won't match any tool unless the plugin is enabled.
21:37:15 [compaction-safeguard] Compaction safeguard: no real conversation messages to summarize; writing compaction boundary to suppress re-trigger loop.
I’m unable to perform
a web search right now because the Brave Search API key isn’t configured in this OpenClaw instance. To look up information about OpenClaw’s core architecture, you’ll need to either:

1. Add a Brave API key via `openclaw configure --section web` (or set the `BRAVE_API_KEY` environment variable in the Gateway), or
2. Provide the relevant documentation or source files locally so I can read them directly.

Once the search tool is available, I can retrieve up‑to‑date details on OpenClaw’s architecture and share a cited, structured summary. Let me know how you’d like to proceed!
````



### 验证点
- [ ] 命令执行无错误
- [ ] 返回结果包含本地文件信息
- [ ] 响应时间 < 30秒

---

## 测试案例 2: Search Agent - Web 搜索

### 目标
验证 search-agent 能够进行 Web 搜索

### 步骤
```bash
node openclaw.mjs agent --agent search-agent  --message "搜索最新的 Node.js 版本信息"
```

### 预期结果
- ✅ Agent 成功调用 `web_search` 工具
- ✅ 返回 Web 搜索结果
- ✅ 包含 URL 和摘要信息

### 实际回复：

````
Bind: loopback
Config warnings:\n- plugins.entries.deepgram: plugin deepgram: plugin id mismatch (manifest uses "deepgram", entry hints "deepgram-media-understanding")
- plugins.entries.groq: plugin groq: plugin id mismatch (manifest uses "groq", entry hints "groq-media-understanding")
21:39:02 [agent/embedded] low context window: nvidia/nvidia/nemotron-3-super-120b-a12b ctx=20000 (warn<32000) source=modelsConfig
21:39:02 [tools] agents.search-agent.tools.allow allowlist contains unknown entries (research, search_synthesize). These entries won't match any tool unless the plugin is enabled.
21:39:17 [compaction-safeguard] Compaction safeguard: no real conversation messages to summarize; writing compaction boundary to suppress re-trigger loop.
I’m unable to perform a web search right now because the Brave Search API key isn’t configured in this OpenClaw instance. To look up the latest Node.js version information, you’ll need to either:

1. Add a Brave API key via `openclaw configure --section web` (or set the `BRAVE_API_KEY` environment variable in the Gateway), or
2. Provide the version information you’d like me to work with (e.g., paste the relevant release notes or a URL).

Once the search tool is available, I can retrieve the current Node.js release details and share a cited, structured summary. Let me know how you’d like to proceed!
````



### 验证点
- [ ] 命令执行无错误
- [ ] 返回结果包含 URL
- [ ] 信息是最新的

---

## 测试案例 3: Writer Agent - 创建文档

### 目标
验证 writer-agent 能够创建结构化文档

### 步骤
```bash
node openclaw.mjs agent --agent writer-agent  --message "创建一个关于 OpenClaw Agent 架构的技术文档"
```

### 预期结果
- ✅ Agent 成功调用 `writer_doc` 工具
- ✅ 创建文档并返回 docId
- ✅ 文档包含章节结构

### 实际回复：

```
Config warnings:\n- plugins.entries.deepgram: plugin deepgram: plugin id mismatch (manifest uses "deepgram", entry hints "deepgram-media-understanding")
- plugins.entries.groq: plugin groq: plugin id mismatch (manifest uses "groq", entry hints "groq-media-understanding")
21:41:05 [agents/auth-profiles] inherited auth-profiles from main agent
21:41:05 [agent/embedded] low context window: nvidia/nvidia/nemotron-3-super-120b-a12b ctx=20000 (warn<32000) source=modelsConfig
21:41:05 [tools] agents.writer-agent.tools.allow allowlist contains unknown entries (writer_doc, writer_draft, writer_export, writer_rewrite, writer_check). Ignoring allowlist so core tools remain available. These entries won't match any tool unless the plugin is enabled.
后面没有输出了，卡住
```



### 验证点
- [ ] 命令执行无错误
- [ ] 返回 docId
- [ ] 文档结构合理

---

## 测试总结

### 为什么 E2E 测试慢？

1. **启动完整环境**: 需要启动 Gateway、加载所有插件
2. **单线程执行**: 配置为 maxWorkers: 1
3. **测试文件多**: 20+ 个 E2E 测试文件
4. **真实网络请求**: Web 搜索等需要实际网络调用

### 建议

**开发阶段**:
- ✅ 使用 `openclaw doctor` 验证配置
- ✅ 手动测试关键功能

**发布前**:
- 运行完整 E2E 测试套件
- 预计时间: 10-30 分钟

### 快速验证

```bash
# 验证配置
node openclaw.mjs doctor

# 手动测试
node openclaw.mjs agent --agent search-agent --message "测试"
```
