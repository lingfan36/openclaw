**前提：**

- 不通过 OpenClaw 聊天命令创建。
- 不通过 `openclaw setup / onboard / configure` 创建。
- 你就是自己在磁盘上建目录、写文件、改 `openclaw.json`。
  OpenClaw 的主配置文件是 `~/.openclaw/openclaw.json`，格式是 **JSON5**；workspace 是 agent 的“家目录”，默认是 `~/.openclaw/workspace`，而 `~/.openclaw/` 本身用于存配置、凭证、sessions 等状态。([OpenClaw](https://docs.openclaw.ai/gateway/configuration))

------

# 一、先把三类位置分清

你手动配置时，几乎所有东西都落在这三类位置里：

## 1）全局控制面：`~/.openclaw/`

这里放：

- `openclaw.json`：总配置文件。([OpenClaw](https://docs.openclaw.ai/gateway/configuration))
- `skills/`：全局共享 skills。([OpenClaw](https://docs.openclaw.ai/tools/skills?utm_source=chatgpt.com))
- `hooks/`：全局共享 hooks。([OpenClaw](https://docs.openclaw.ai/automation/hooks))
- `agents/<agentId>/...`：每个 agent 的状态目录，比如 auth、sessions、models。([OpenClaw](https://docs.openclaw.ai/concepts/multi-agent))

## 2）项目 / agent 工作区：`<workspace>/`

这里放：

- `AGENTS.md`
- `SOUL.md`
- `USER.md`
- `IDENTITY.md`
- `TOOLS.md`
- `HEARTBEAT.md`
- `BOOT.md`
- `BOOTSTRAP.md`
- `MEMORY.md`
- `memory/`
- `skills/`
- `hooks/`
  这些属于 agent 自己的人设、规则、局部能力和局部记忆。([OpenClaw](https://docs.openclaw.ai/concepts/agent))

## 3）每个 agent 的状态目录：`~/.openclaw/agents/<agentId>/`

这里不是你写提示词的地方，而是 OpenClaw 给 agent 存运行状态的地方，典型有：

- `agent/auth-profiles.json`
- `agent/models.json`
- `sessions/`
  多 agent 模式下，每个 agent 都有自己独立的 `agentDir` 和 session store。([OpenClaw](https://docs.openclaw.ai/concepts/multi-agent))

------

# 二、最推荐的手动目录结构

先给你一个最稳的结构。你完全可以照着手建。

```text
~/.openclaw/
├── openclaw.json
├── skills/
│   ├── web-search/
│   │   └── SKILL.md
│   └── summarize/
│       └── SKILL.md
├── hooks/
│   └── session-memory/
│       ├── HOOK.md
│       └── handler.ts
├── agents/
│   ├── main/
│   │   ├── agent/
│   │   │   ├── auth-profiles.json
│   │   │   └── models.json
│   │   └── sessions/
│   └── web-search/
│       ├── agent/
│       │   ├── auth-profiles.json
│       │   └── models.json
│       └── sessions/
├── workspace-main/
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── USER.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   ├── HEARTBEAT.md
│   ├── BOOTSTRAP.md
│   ├── MEMORY.md
│   ├── memory/
│   ├── skills/
│   │   └── local-only-skill/
│   │       └── SKILL.md
│   └── hooks/
│       └── local-hook/
│           ├── HOOK.md
│           └── handler.ts
└── workspace-web-search/
    ├── AGENTS.md
    ├── TOOLS.md
    ├── skills/
    └── hooks/
```

这套结构符合 OpenClaw 对 workspace、全局 skills、全局 hooks、多 agent 状态目录的官方定义。([OpenClaw](https://docs.openclaw.ai/concepts/agent-workspace))

------

# 三、你手动配置时，哪些文件必须建

如果你完全不用 CLI 自动创建，最少建议你自己准备这些。

## A. 全局必须有

### `~/.openclaw/openclaw.json`

这是总控文件。OpenClaw 从这里读配置。([OpenClaw](https://docs.openclaw.ai/gateway/configuration))

## B. 每个 workspace 建议有

OpenClaw 会在新 session 的第一轮把这些 bootstrap 文件注入上下文；缺失时会注入 “missing file” 标记，空文件会跳过，大文件会截断。([OpenClaw](https://docs.openclaw.ai/concepts/agent))

建议至少建：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`

可选但常用：

- `HEARTBEAT.md`
- `BOOTSTRAP.md`
- `MEMORY.md`
- `BOOT.md`
  workspace 文件的含义官方也给了说明。([OpenClaw](https://docs.openclaw.ai/concepts/agent))

------

# 四、每个文件到底是干什么的

## 1）`AGENTS.md` —— 规则中枢

这里写：

- agent 的职责
- 工作边界
- 回答风格规则
- 工作流程
- 何时调用工具
- 何时调用子 agent
- 何时写入记忆

它是每个 session 都会加载的主规则文件，非常适合放“长期稳定规则”。([OpenClaw](https://docs.openclaw.ai/concepts/agent-workspace))

**建议你放在这里的内容：**

- 角色定位
- 一级流程
- 输出结构
- 升级/失败/降级策略
- 调用 MCP / skill / 子 agent 的时机
- 不要放太多易变化的琐事

## 2）`SOUL.md` —— 人格与语气

这里写：

- 语气
- 性格
- 边界
- 风格
- 价值观

它每个 session 也会加载。([OpenClaw](https://docs.openclaw.ai/concepts/agent-workspace))

## 3）`USER.md` —— 用户画像

这里写：

- 用户叫法
- 用户偏好
- 用户背景
- 长期稳定信息

它每个 session 也会加载。([OpenClaw](https://docs.openclaw.ai/concepts/agent-workspace))

## 4）`IDENTITY.md` —— agent 名字与 vibe

这里写：

- agent 名字
- 简介
- emoji
- 对外自我介绍风格
  它也是 bootstrap 文件之一。([OpenClaw](https://docs.openclaw.ai/concepts/agent))

## 5）`TOOLS.md` —— 工具说明书，不是权限表

这里写：

- 本地工具怎么用
- 命令习惯
- 哪些命令危险
- 哪些工具用于什么场景

但它**不控制工具是否存在或可用**，只是提示与指导。真正的工具权限在配置里。([GitHub](https://github.com/openclaw/openclaw/blob/main/docs/reference/templates/TOOLS.dev.md?utm_source=chatgpt.com))

## 6）`HEARTBEAT.md`

适合放：

- 定时巡检的小 checklist
- 简短的后台任务提示
  官方建议保持很短，避免 token 浪费。([OpenClaw](https://docs.openclaw.ai/concepts/agent-workspace))

## 7）`BOOTSTRAP.md`

这是首次启动的一次性引导文件，只在 brand-new workspace 下才会自动创建。你手动模式下也可以自己写。([OpenClaw](https://docs.openclaw.ai/concepts/agent))

## 8）`BOOT.md`

这是启动清单，官方说明在内部 hooks 启用时，可在 gateway 重启时执行。([OpenClaw](https://docs.openclaw.ai/concepts/agent-workspace))

## 9）`MEMORY.md` 和 `memory/`

适合放长期记忆与按天积累的笔记。官方也提到 session-memory hook 默认会把上下文存到 workspace 的 `memory/`。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

------

# 五、什么时候改全局，什么时候改项目

这是最关键的判断标准。

## 改项目 / workspace 的情况

当你要改的是：

- 这个 agent 的人格
- 这个 agent 的规则
- 这个 agent 的局部 skills
- 这个 agent 的局部 hooks
- 这个 agent 的记忆

就改 `<workspace>/...`。
因为 workspace 是 agent 的 home，也是 file tools 和 workspace context 的唯一默认工作目录。([OpenClaw](https://docs.openclaw.ai/concepts/agent-workspace))

## 改全局 `~/.openclaw/` 的情况

当你要改的是：

- 总模型配置
- 多 agent 列表
- 路由 bindings
- MCP servers
- 全局共享 skills
- 全局共享 hooks
- 全局 sandbox / tools / channels / plugins

就改 `~/.openclaw/openclaw.json` 或 `~/.openclaw/skills` / `~/.openclaw/hooks`。([OpenClaw](https://docs.openclaw.ai/gateway/configuration))

------

# 六、纯手动配置一个普通 agent：完整做法

下面是不依赖命令创建的手动步骤。

## 第 1 步：建 workspace

例如：

```text
~/.openclaw/workspace-main/
```

然后手建这些文件：

```text
AGENTS.md
SOUL.md
USER.md
IDENTITY.md
TOOLS.md
HEARTBEAT.md
BOOTSTRAP.md
MEMORY.md
memory/
```

这些都是 OpenClaw 预期的 bootstrap/workspace 文件。([OpenClaw](https://docs.openclaw.ai/concepts/agent))

## 第 2 步：写 `~/.openclaw/openclaw.json`

最小示例：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace-main",
      skipBootstrap: true,
      model: {
        primary: "openai/gpt-5.4"
      }
    }
  }
}
```

`skipBootstrap: true` 的作用，是你既然已经手动管理这些 bootstrap 文件，就别让 OpenClaw 再替你自动创建。([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

## 第 3 步：把 agent 的长期规则写进 `AGENTS.md`

因为 `AGENTS.md` 每个 session 都会注入，非常适合做主规则载体。([OpenClaw](https://docs.openclaw.ai/concepts/agent))

------

# 七、纯手动配置一个复杂 agent：多 agent / 路由 / 权限

复杂 agent 一定会动到 `openclaw.json`。

## 1）多 agent 定义：`agents.list`

官方支持在一个 Gateway 里挂多个隔离 agent，每个 agent 有自己的 workspace、agentDir、sessions。([OpenClaw](https://docs.openclaw.ai/concepts/multi-agent))

手动示例：

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true
    },
    list: [
      {
        id: "main",
        default: true,
        name: "Main Assistant",
        workspace: "~/.openclaw/workspace-main",
        sandbox: { mode: "off" }
      },
      {
        id: "web-search",
        name: "Web Search Agent",
        workspace: "~/.openclaw/workspace-web-search",
        sandbox: {
          mode: "all",
          scope: "agent"
        },
        tools: {
          allow: ["web_search", "browser", "read", "write", "message"],
          deny: ["exec", "apply_patch", "process"]
        }
      }
    ]
  }
}
```

每个 agent 可以覆盖全局 sandbox 和 tool policy。([OpenClaw](https://docs.openclaw.ai/tools/multi-agent-sandbox-tools))

## 2）路由：`bindings`

如果你想把不同入口路由给不同 agent，要手改 `bindings`。([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

示例：

```json5
{
  bindings: [
    { agentId: "main", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "web-search", match: { channel: "discord", accountId: "research" } }
  ]
}
```

`bindings` 决定 inbound 消息进哪个 agent。([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

------

# 八、纯手动加 skills：到底放哪

Skills 是最适合手动加的扩展。

## 技术本质

Skill 是一个目录，核心文件是 `SKILL.md`；它会以 markdown 说明的形式教 agent 怎么使用工具。([OpenClaw](https://docs.openclaw.ai/tools/creating-skills))

## 1）项目专用 skill

放：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

这种只对当前 agent 生效。官方写得很清楚，per-agent skills live in `<workspace>/skills`。([OpenClaw](https://docs.openclaw.ai/tools/skills?utm_source=chatgpt.com))

## 2）全局共享 skill

放：

```text
~/.openclaw/skills/<skill-name>/SKILL.md
```

这种对这台机器上的多个 agent 都可见。([OpenClaw](https://docs.openclaw.ai/tools/skills?utm_source=chatgpt.com))

## 3）额外共享目录

如果你有一个独立 skill 仓库，不想复制到 `~/.openclaw/skills/`，可以在 `openclaw.json` 里配：

```json5
{
  skills: {
    load: {
      extraDirs: [
        "~/Projects/shared-openclaw-skills"
      ]
    }
  }
}
```

官方支持 `skills.load.extraDirs`。([OpenClaw](https://docs.openclaw.ai/tools/skills-config))

## 4）手写一个 skill 的标准结构

```text
~/.openclaw/skills/web-search/
└── SKILL.md
```

`SKILL.md` 示例：

```md
---
name: web_search
description: Search the web, read pages, extract evidence, and return structured results.
---

# Web Search Skill

Use this skill when:
- the user asks for recent information
- the task requires source verification
- the answer needs citations

Preferred process:
1. break the question into search queries
2. retrieve candidate pages
3. read the most relevant pages
4. extract evidence
5. compare multiple sources
6. return a structured summary with citations
```

技能目录 + `SKILL.md` 是官方定义的基本形式。([OpenClaw](https://docs.openclaw.ai/tools/creating-skills))

## 5）skill 的启用配置

所有 skills 相关配置在 `skills` 下。你可以手动配置：

- `allowBundled`
- `load.extraDirs`
- `load.watch`
- `entries.<skill>.enabled`
- `entries.<skill>.env`
- `entries.<skill>.apiKey` ([OpenClaw](https://docs.openclaw.ai/tools/skills-config))

示例：

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/shared-openclaw-skills"],
      watch: true,
      watchDebounceMs: 250
    },
    entries: {
      "web-search": {
        enabled: true
      },
      "image-lab": {
        enabled: true,
        env: {
          GEMINI_API_KEY: "YOUR_KEY"
        }
      }
    }
  }
}
```

------

# 九、自定义 Tool 工具

如果 OpenClaw 内置工具和 MCP 都不满足需求，可以自己写 Tool。

## 技术本质

Tool 是 TypeScript 函数，定义在 `src/agents/tools/` 目录，返回 `AnyAgentTool` 对象。

## 创建步骤

### 第 1 步：创建工具文件

在 `src/agents/tools/` 创建 `my-tool.ts`：

```typescript
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

export function createMyTool(): AnyAgentTool {
  return {
    label: "My Tool",
    name: "my_tool",
    description: "工具描述",
    parameters: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "输入参数",
        },
      },
      required: ["input"],
    },
    execute: async (_toolCallId, args) => {
      const { input } = args;
      // 工具逻辑
      const result = { output: `处理: ${input}` };
      return jsonResult(result);
    },
  };
}
```

### 第 2 步：注册工具

在 `src/agents/openclaw-tools.ts` 导入并注册：

```typescript
// 1. 导入
import { createMyTool } from "./tools/my-tool.js";

// 2. 创建实例
const myTool = createMyTool();

// 3. 添加到工具数组
const tools = [
  // ... 其他工具
  myTool,
];
```

### 第 3 步：配置 Agent 权限

在 `~/.openclaw/openclaw.json` 的 agent 配置中添加：

```json5
{
  agents: {
    list: [
      {
        id: "my-agent",
        tools: {
          allow: ["my_tool", "read", "message"]
        }
      }
    ]
  }
}
```

### 第 4 步：重新构建

```bash
pnpm build
```

工具在 TypeScript 编译后才生效，每次修改工具代码都要重新构建。

## 实战示例：`local_find` 和 `local_grep`

OpenClaw 默认**没有**本地文件搜索工具。以下是两个只读搜索工具的完整实现。

### `local_find`：按 glob 模式查找文件

```typescript
// src/agents/tools/local-find.ts
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
        root: { type: "string", description: "Root directory to search from" },
        pattern: { type: "string", description: "Glob pattern (e.g., **/*.ts)" },
        exclude: { type: "array", items: { type: "string" }, description: "Patterns to exclude" },
        max_results: { type: "number", description: "Maximum number of results", default: 100 },
      },
      required: ["root", "pattern"],
    },
    execute: async (_toolCallId, args) => {
      const { root, pattern, exclude = [], max_results = 100 } = args;
      const files = await glob(pattern, { cwd: root, ignore: exclude, nodir: true, absolute: true });
      const results = files.slice(0, max_results).map(f => ({
        path: f,
        relative: path.relative(root, f),
      }));
      return jsonResult({ root, pattern, count: results.length, total: files.length, files: results });
    },
  };
}
```

### `local_grep`：按关键词搜索文件内容

```typescript
// src/agents/tools/local-grep.ts
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
        root: { type: "string", description: "Root directory to search" },
        query: { type: "string", description: "Search keyword or regex pattern" },
        extensions: { type: "array", items: { type: "string" }, description: "File extensions (e.g., ['.ts', '.md'])" },
        case_sensitive: { type: "boolean", description: "Case sensitive search", default: false },
        context_lines: { type: "number", description: "Context lines before/after match", default: 2 },
        max_matches: { type: "number", description: "Maximum number of matches", default: 50 },
      },
      required: ["root", "query"],
    },
    execute: async (_toolCallId, args) => {
      const { root, query, extensions = [], case_sensitive = false, context_lines = 2, max_matches = 50 } = args;
      const pattern = extensions.length > 0 ? `**/*{${extensions.join(",")}}` : "**/*";
      const files = await glob(pattern, { cwd: root, nodir: true, absolute: true });
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
      return jsonResult({ root, query, count: matches.length, matches });
    },
  };
}
```

### 注册到 `openclaw-tools.ts`

```typescript
// src/agents/openclaw-tools.ts

// 1. 导入
import { createLocalFindTool } from "./tools/local-find.js";
import { createLocalGrepTool } from "./tools/local-grep.js";

// 2. 在 createOpenClawTools() 函数内创建实例
const localFindTool = createLocalFindTool();
const localGrepTool = createLocalGrepTool();

// 3. 添加到工具数组
const tools = [
  // ... 其他工具
  localFindTool,
  localGrepTool,
];
```

### 配置 Agent 使用

```json5
{
  agents: {
    list: [
      {
        id: "search",
        name: "Search Agent",
        workspace: "~/.openclaw/workspace-search",
        tools: {
          allow: ["local_find", "local_grep", "read", "web_search", "browser", "message"]
        }
      }
    ]
  }
}
```

## 注意事项

### 1）`AnyAgentTool` 结构

每个工具必须包含 5 个字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | string | 显示名称 |
| `name` | string | 唯一标识符，用于配置权限 |
| `description` | string | 工具描述，agent 据此判断何时调用 |
| `parameters` | object | JSON Schema 格式的参数定义 |
| `execute` | function | 执行函数，返回 `jsonResult(...)` |

### 2）只读工具 vs 读写工具

- 搜索类工具应当设计为**只读**，不修改文件
- 通过 `agents.list[].tools.allow` 控制 agent 可用哪些工具
- 不给 agent 不必要的权限（如 `write`、`exec`）

### 3）关键文件路径

| 文件 | 用途 |
|------|------|
| `src/agents/tools/*.ts` | 工具实现 |
| `src/agents/openclaw-tools.ts` | 工具注册 |
| `src/agents/tools/common.ts` | `AnyAgentTool` 类型和 `jsonResult` 工具函数 |
| `~/.openclaw/openclaw.json` | agent 权限配置 |

------

# 十、纯手动加 MCP：真正放在哪里

这个最容易弄错。

## 结论先说

**MCP 主要不是放在 workspace 目录里。它的主接入点是 `~/.openclaw/openclaw.json` 的 `mcp.servers`。** `/mcp` 命令本质上也是在写这个位置。([OpenClaw](https://docs.openclaw.ai/tools/slash-commands?utm_source=chatgpt.com))

官方还明确说，**per-session MCP servers 不支持**，要把 MCP 配在 gateway 或 agent 上，而不是临时会话里。([OpenClaw](https://docs.openclaw.ai/cli/acp?utm_source=chatgpt.com))

## 1）你手动该改哪里

改：

```text
~/.openclaw/openclaw.json
```

加：

```json5
{
  mcp: {
    servers: {
      context7: {
        command: "uvx",
        args: ["context7-mcp"]
      }
    }
  }
}
```

上面这个结构来自官方 `/mcp set context7=...` 的例子，本质对应 `mcp.servers.context7`。([OpenClaw](https://docs.openclaw.ai/tools/slash-commands?utm_source=chatgpt.com))

## 2）项目里需要放什么

通常**不需要**在项目里建一个 `mcp/` 目录来让 OpenClaw 原生识别。
项目里的 `AGENTS.md` 和 `TOOLS.md` 只是告诉 agent：

- 什么时候该调用 MCP 工具
- 这些工具适合解决什么问题
- 调用顺序是什么

但**真正把 MCP server 接进系统**，还是 `openclaw.json`。([OpenClaw](https://docs.openclaw.ai/tools/slash-commands?utm_source=chatgpt.com))

## 3）如果是多 agent

MCP 仍然是控制面配置；再通过 agent 的工具权限与 sandbox 去限制谁能用。
也就是说你还要同时检查：

- `agents.list[].tools.allow / deny`
- `agents.list[].sandbox` ([OpenClaw](https://docs.openclaw.ai/tools/multi-agent-sandbox-tools))

------

# 十一、纯手动加 hooks：目录、文件、启用方式

Hooks 是第二个最容易搞错的地方。

## 技术本质

Hooks 是 Gateway 内部的事件驱动脚本，能在 `/new`、`/reset`、`/stop`、生命周期事件等时机运行。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 1）全局共享 hooks

放：

```text
~/.openclaw/hooks/<hook-name>/
  HOOK.md
  handler.ts
```

这类是 managed hooks，可以覆盖 bundled/plugin hooks。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 2）项目 / workspace hooks

放：

```text
<workspace>/hooks/<hook-name>/
  HOOK.md
  handler.ts
```

这类是 per-agent hooks。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 3）注意：workspace hooks 默认禁用

这点非常关键。官方写得很明确：workspace hooks 会被发现，但**默认不会加载，除非你显式启用**。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 4）hook 的标准目录结构

```text
~/.openclaw/hooks/my-hook/
├── HOOK.md
└── handler.ts
```

官方定义每个 hook 目录就是这样。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 5）`HOOK.md` 格式

官方格式示例：

```md
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🪝", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here...
```

`HOOK.md` 里带 YAML frontmatter 和 markdown 文档。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 6）手动启用 hook

你不用 CLI 的话，直接改 `openclaw.json`：

```json5
{
  hooks: {
    internal: {
      enabled: true,
      entries: {
        "my-hook": {
          enabled: true,
          env: {
            MY_CUSTOM_VAR: "value"
          }
        }
      }
    }
  }
}
```

这是官方给出的 per-hook config 结构。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 7）额外 hook 目录

也可以：

```json5
{
  hooks: {
    internal: {
      enabled: true,
      load: {
        extraDirs: ["/path/to/more/hooks"]
      }
    }
  }
}
```

额外目录会按 managed hooks 对待。([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 8）hook 适合做什么

官方举的典型用途有：

- reset 时保存 memory snapshot
- 命令审计日志
- session 开始/结束时触发自动化
- 往 workspace 写文件
- 调外部 API ([OpenClaw](https://docs.openclaw.ai/automation/hooks))

------

# 十二、模型配置：手动改哪几个位置

模型配置分两层。

## 1）全局模型控制

在 `~/.openclaw/openclaw.json` 里配：

- `agents.defaults.model`
- `models.providers`

官方配置参考写了，custom providers 可以放在 `models.providers`。([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

示例：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "openai/gpt-5.4"
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      openai: {
        api: "openai-responses",
        apiKey: "sk-xxxx",
        baseUrl: "https://api.openai.com/v1"
      },
      cerebras: {
        api: "openai-completions",
        apiKey: "sk-xxxx",
        baseUrl: "https://api.cerebras.ai/v1"
      }
    }
  }
}
```

## 2）某个 agent 自己的模型目录

官方还支持在：

```text
~/.openclaw/agents/<agentId>/agent/models.json
```

里放 agent 级别的 provider/model 定义。([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

## 3）认证优先级

provider auth 的标准顺序是：
`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

## 4）每个 agent 的凭证位置

per-agent profiles 存在：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

不同 agent 之间凭证不自动共享。([OpenClaw](https://docs.openclaw.ai/concepts/multi-agent))

------

# 十三、子 agent / 复杂 agent 一个特别重要的坑

在 sub-agent 场景下，官方说明：
**sub-agent session 默认只注入 `AGENTS.md` 和 `TOOLS.md`，其他 bootstrap 文件不会自动带进去。** ([OpenClaw](https://docs.openclaw.ai/concepts/system-prompt?utm_source=chatgpt.com))

这意味着：

## 你如果做复杂子 agent

真正决定执行行为的内容，优先放：

- `AGENTS.md`
- `TOOLS.md`

而不是只写在：

- `SOUL.md`
- `USER.md`
- `IDENTITY.md`

否则主 agent 跳到子 agent 时，你可能发现子 agent “像失忆了一样”。这不是没生效，而是因为注入文件范围变小了。([OpenClaw](https://docs.openclaw.ai/concepts/system-prompt?utm_source=chatgpt.com))

------

# 十四、你现在这种”手动维护文件”的最佳实践

## 1）在 `openclaw.json` 里显式写 workspace

不要依赖默认推断，直接写死：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace-main",
      skipBootstrap: true
    }
  }
}
```

因为默认 workspace 会受 profile 影响；若设置 `OPENCLAW_PROFILE`，默认路径会变成 `~/.openclaw/workspace-<profile>`。([OpenClaw](https://docs.openclaw.ai/concepts/agent-workspace))

## 2）既然你手动管理文件，就开 `skipBootstrap`

这样避免 OpenClaw 替你自动补模板。([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

## 3）把长期规则放 `AGENTS.md`

因为它每 session 注入，而且 standing orders 官方也建议优先放这里。([OpenClaw](https://docs.openclaw.ai/automation/standing-orders?utm_source=chatgpt.com))

## 4）共享能力放全局，局部能力放 workspace

- 多 agent 共用 skill → `~/.openclaw/skills`
- 仅某 agent 使用 → `<workspace>/skills`
- 多 agent 共用 hook → `~/.openclaw/hooks`
- 仅某 agent 使用 → `<workspace>/hooks`，再到 config 显式启用。([OpenClaw](https://docs.openclaw.ai/tools/skills?utm_source=chatgpt.com))

## 5）MCP 不要误放在项目目录里

MCP 的核心接入点是 `mcp.servers`，不是 `<workspace>/mcp`。([OpenClaw](https://docs.openclaw.ai/tools/slash-commands?utm_source=chatgpt.com))

------

# 十五、一份可直接手改的完整示例

这个示例适合你这种：
**主 agent + 搜索子 agent + 全局 skills + 全局 hooks + MCP server + 手动 workspace。**

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    defaults: {
      skipBootstrap: true,
      bootstrapMaxChars: 20000,
      workspace: "~/.openclaw/workspace-main",
      model: {
        primary: "openai/gpt-5.4"
      }
    },

    list: [
      {
        id: "main",
        default: true,
        name: "Main Assistant",
        workspace: "~/.openclaw/workspace-main",
        sandbox: { mode: "off" }
      },
      {
        id: "web-search",
        name: "Web Search Agent",
        workspace: "~/.openclaw/workspace-web-search",
        sandbox: {
          mode: "all",
          scope: "agent"
        },
        tools: {
          allow: ["browser", "web_search", "read", "write", "message"],
          deny: ["exec", "apply_patch", "process"]
        }
      }
    ]
  },

  bindings: [
    { agentId: "main", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "web-search", match: { channel: "discord", accountId: "research" } }
  ],

  models: {
    mode: "merge",
    providers: {
      openai: {
        api: "openai-responses",
        apiKey: "sk-xxxxx",
        baseUrl: "https://api.openai.com/v1"
      }
    }
  },

  mcp: {
    servers: {
      context7: {
        command: "uvx",
        args: ["context7-mcp"]
      }
    }
  },

  skills: {
    load: {
      extraDirs: ["~/Projects/shared-openclaw-skills"],
      watch: true,
      watchDebounceMs: 250
    },
    entries: {
      "web-search": { enabled: true },
      "summarize": { enabled: true }
    }
  },

  hooks: {
    internal: {
      enabled: true,
      entries: {
        "session-memory": { enabled: true },
        "boot-md": { enabled: true },
        "my-hook": {
          enabled: true,
          env: {
            MY_CUSTOM_VAR: "value"
          }
        }
      },
      load: {
        extraDirs: ["~/Projects/shared-openclaw-hooks"]
      }
    }
  }
}
```

这里用到的字段都来自官方配置体系：`agents.defaults.workspace`、`skipBootstrap`、`bootstrapMaxChars`、`agents.list`、`bindings`、`models.providers`、`skills.*`、`hooks.internal.*`，以及 `/mcp` 对应的 `mcp.servers`。([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

------

# 十六、最后给你一个”改文件时的速查结论”

## 只改普通 agent

改：

- `<workspace>/AGENTS.md`
- `<workspace>/SOUL.md`
- `<workspace>/USER.md`
- `<workspace>/IDENTITY.md`
- `<workspace>/TOOLS.md`
- `~/.openclaw/openclaw.json` 里的 `agents.defaults.workspace` / `model` / `skipBootstrap` ([OpenClaw](https://docs.openclaw.ai/concepts/agent))

## 加 skill

- 项目专用：`<workspace>/skills/<name>/SKILL.md`
- 全局共享：`~/.openclaw/skills/<name>/SKILL.md`
- 额外目录：`skills.load.extraDirs` ([OpenClaw](https://docs.openclaw.ai/tools/skills?utm_source=chatgpt.com))

## 加 MCP

- 主要改 `~/.openclaw/openclaw.json` 的 `mcp.servers`
- 项目文件只负责写“如何使用”，不负责真正接入 ([OpenClaw](https://docs.openclaw.ai/tools/slash-commands?utm_source=chatgpt.com))

## 加 hook

- 项目专用：`<workspace>/hooks/<name>/{HOOK.md, handler.ts}`
- 全局共享：`~/.openclaw/hooks/<name>/{HOOK.md, handler.ts}`
- 启用：`hooks.internal.enabled` + `hooks.internal.entries.<name>.enabled`
- workspace hooks 默认禁用，要显式启用 ([OpenClaw](https://docs.openclaw.ai/automation/hooks))

## 多 agent

- `agents.list`
- `bindings`
- 每个 agent 自己的 workspace
- 每个 agent 自己的 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 可选自己的 `models.json` 和 `sessions/` ([OpenClaw](https://docs.openclaw.ai/gateway/configuration-reference))

------

补一个小提醒：官方文档里 hooks CLI 页面有一处还写 `~/.openclaw/config.json`，但主配置文档和主参考页都写的是 `~/.openclaw/openclaw.json`；按当前主文档体系，应以 `openclaw.json` 为准。([OpenClaw](https://docs.openclaw.ai/gateway/configuration))

下一步最合适的是，我直接按你的场景给你写一份：**“OpenClaw 搜索 agent 的纯手动文件落地方案”**，把 `AGENTS.md / TOOLS.md / SKILL.md / openclaw.json` 四部分直接写成可用草稿。
