# Agent 测试问题修复

## 发现的问题

### 问题 1: 工具未识别
**错误信息**:
```
tools.allow allowlist contains unknown entries (research, search_synthesize)
tools.allow allowlist contains unknown entries (writer_doc, writer_draft, ...)
```

**原因**: 插件未启用

### 问题 2: Web 搜索失败
**错误信息**:
```
Brave Search API key isn't configured
```

**原因**: 缺少 API key 配置

---

## 修复方案

### 1. 启用 search-agent 插件 ✅

**文件**: `~/.openclaw/openclaw.json`

```json
"plugins": {
  "entries": {
    "search-agent": {
      "enabled": true
    }
  }
}
```

### 2. 配置 MCP Writer Server ✅

```json
"mcpServers": {
  "mcp-writer": {
    "command": "node",
    "args": ["E:/openclaw-main/openclaw-main/packages/mcp-writer/index.js"]
  }
}
```

### 3. 配置 Web 搜索 API (可选)

```bash
openclaw configure --section web
# 或设置环境变量
export BRAVE_API_KEY=your_key
```

---

## 验证结果

```bash
node openclaw.mjs doctor
```

**输出**:
- Loaded: 38 (增加了 1 个)
- Errors: 0 ✅

---

## 下一步测试

重新运行手动测试验证工具是否可用。
