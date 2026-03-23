# OpenClaw Agent 创建模板

## 快速参考

创建一个新 Agent 需要修改/创建以下文件：

```
1. ~/.openclaw/openclaw.json                    # 全局配置（必需）
2. .agents/<agent-name>/AGENTS.md               # Agent 身份定义（必需）
3. .agents/<agent-name>/IDENTITY.md             # 详细身份描述（可选）
4. .agents/skills/<skill-name>/SKILL.md         # Skill 定义（如果需要）
5. extensions/<plugin-id>/                      # Plugin 实现（如果需要）
6. packages/mcp-<name>/                         # MCP Server（如果需要）
```

---

## 步骤 1: 全局配置

**文件路径**: `~/.openclaw/openclaw.json`

在 `agents.list` 数组中添加新 agent：

```json
{
  "agents": {
    "list": [
      {
        "id": "my-agent",
        "name": "My Agent",
        "workspace": "E:/openclaw-main/openclaw-main/.agents/my-agent",
        "agentDir": "E:/openclaw-main/openclaw-main/.agents/my-agent",
        "model": "nvidia/nvidia/nemotron-3-super-120b-a12b",

        // 可选：绑定 Skills
        "skills": ["my-skill"],

        // 可选：允许的工具
        "tools": {
          "allow": ["tool1", "tool2", "tool3"]
        },

        // 可选：记忆搜索配置
        "memorySearch": {
          "enabled": true,
          "sources": ["memory", "sessions"],
          "provider": "auto"
        }
      }
    ]
  }
}
```

**配置项说明**:
- `id`: Agent 唯一标识（必需）
- `name`: 显示名称（必需）
- `workspace`: 工作目录路径（必需）
- `agentDir`: Agent 配置目录路径（必需）
- `model`: 使用的模型（必需）
- `skills`: 绑定的技能列表（可选）
- `tools.allow`: 允许使用的工具列表（可选）
- `memorySearch`: 记忆搜索配置（可选）

---

## 步骤 2: Agent 身份文件

**文件路径**: `.agents/<agent-name>/AGENTS.md`

```markdown
# My Agent

You are a [agent purpose description].

## Core Purpose
[Describe the main purpose of this agent]

## Capabilities
- Capability 1
- Capability 2
- Capability 3

## Tools Available
- `tool1` - Description
- `tool2` - Description
- `tool3` - Description

## Response Style
- Style guideline 1
- Style guideline 2
- Style guideline 3
```

---

## 步骤 3: 详细身份描述（可选）

**文件路径**: `.agents/<agent-name>/IDENTITY.md`

```markdown
# My Agent Identity

## Background
[Detailed background information]

## Expertise
[Areas of expertise]

## Workflow
[Typical workflow patterns]

## Examples
[Usage examples]
```

---

## 步骤 4: 创建 Skill（如果需要）

**文件路径**: `.agents/skills/<skill-name>/SKILL.md`

```markdown
---
name: my-skill
description: Brief description of what this skill does
---

# My Skill

## Purpose
[Detailed purpose]

## Usage
[How to use this skill]

## Examples
[Usage examples]
```

---

## 步骤 5: 创建 Plugin（如果需要新工具）

**文件路径**: `extensions/<plugin-id>/index.ts`

```typescript
import { definePluginEntry, OpenClawPluginApi } from '@openclaw/core';

export default definePluginEntry({
  id: 'my-plugin',
  name: 'My Plugin',
  description: 'Plugin description',

  register(api: OpenClawPluginApi) {
    // 注册工具
    api.registerTool({
      name: 'my_tool',
      description: 'Tool description',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'Parameter 1' },
          param2: { type: 'number', description: 'Parameter 2' }
        },
        required: ['param1']
      },
      handler: async (input) => {
        // 工具实现
        return { result: 'success' };
      }
    });
  }
});
```

**Plugin 配置**: `extensions/<plugin-id>/openclaw.plugin.json`

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "main": "index.ts"
}
```

---

## 步骤 6: 创建 MCP Server（如果需要）

**文件路径**: `packages/mcp-<name>/`

```
packages/mcp-<name>/
├── package.json
├── index.ts              # MCP Server 入口
└── src/
    ├── tools/            # 工具实现
    └── core/             # 核心逻辑
```

**MCP Server 入口**: `packages/mcp-<name>/index.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'mcp-my-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// 注册工具
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'my_tool',
      description: 'Tool description',
      inputSchema: {
        type: 'object',
        properties: {
          param: { type: 'string' }
        }
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  // 工具调用实现
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## 完整示例：创建一个翻译 Agent

### 1. 全局配置
```json
{
  "id": "translator-agent",
  "name": "Translator Agent",
  "workspace": "E:/openclaw-main/openclaw-main/.agents/translator-agent",
  "agentDir": "E:/openclaw-main/openclaw-main/.agents/translator-agent",
  "model": "nvidia/nvidia/nemotron-3-super-120b-a12b",
  "skills": ["translator"],
  "tools": {
    "allow": ["translate", "detect_language"]
  }
}
```

### 2. Agent 身份
`.agents/translator-agent/AGENTS.md`:
```markdown
# Translator Agent

You are a professional translation assistant.

## Core Purpose
Provide accurate translations between multiple languages.

## Capabilities
- Translate text between languages
- Detect source language automatically
- Maintain context and tone

## Tools Available
- `translate` - Translate text
- `detect_language` - Detect language

## Response Style
- Accurate and natural
- Preserve original meaning
- Explain cultural nuances when needed
```

### 3. Skill 定义
`.agents/skills/translator/SKILL.md`:
```markdown
---
name: translator
description: Professional translation between multiple languages
---

# Translator Skill

Provides translation capabilities with context awareness.
```

---

## 检查清单

创建 Agent 后，确认以下内容：

- [ ] `~/.openclaw/openclaw.json` 中添加了 agent 配置
- [ ] `.agents/<agent-name>/AGENTS.md` 文件已创建
- [ ] 如果使用 skill，`.agents/skills/<skill-name>/SKILL.md` 已创建
- [ ] 如果使用 plugin，`extensions/<plugin-id>/` 已实现
- [ ] 如果使用 MCP，`packages/mcp-<name>/` 已实现
- [ ] 工具名称在配置和实现中保持一致
- [ ] 路径使用正确的分隔符（Windows: `\` 或 `/`）

---

## 常见问题

**Q: Agent 配置修改后不生效？**
A: 需要重启 OpenClaw 进程或清理 session 缓存。

**Q: 工具找不到？**
A: 检查 `tools.allow` 配置和 plugin 注册是否一致。

**Q: Skill 提示词未加载？**
A: 删除 session 缓存目录，重新启动。

**Q: 路径应该用绝对路径还是相对路径？**
A: `workspace` 和 `agentDir` 使用绝对路径。

---

## Agent 架构公式

```
Agent = Prompt/Identity + Tools/Skills/MCP + Session/Memory + Router/Trigger
```

- **Prompt/Identity**: AGENTS.md, IDENTITY.md
- **Tools/Skills/MCP**: 工具绑定和实现
- **Session/Memory**: workspace 隔离，memorySearch 配置
- **Router/Trigger**: 通过配置路由到特定 agent
