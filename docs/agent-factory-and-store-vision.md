# Agent Factory & Agent Store — 产品愿景文档

> 作者：lingf | 日期：2026-03-25 | 状态：Draft

---

## 一、核心理念

**Agent 不是程序，是配置包。**

一个 Agent 的本质 = 人格配置 + 从共享 Tool 池中选择的工具 + 按需安装的 Skills 和 MCP。就像手机 App 不自带操作系统，而是调用系统 API 一样——Agent 不自带运行时，而是声明自己需要什么能力，由 Gateway 统一提供。

```
Agent = 人格 (AGENTS.md / SOUL.md)
      + 工具声明 (从 Tool 池选)
      + Skills (内置 / 第三方 / 自定义)
      + MCP 依赖 (内置 / 第三方 / 自定义)
```

---

## 二、两大产品模块

### 2.1 Agent Factory（Agent 工厂）

面向 **Agent 创作者**。核心能力是**让创建一个 Agent 像搭积木一样简单**。

| 能力 | 说明 |
|------|------|
| **Tool 池选择** | 从 Gateway 全局 Tool 池中勾选需要的工具，无需重复实现 |
| **MCP 即插即拔** | 从 MCP 注册表中选择，支持官方/第三方/自定义，一行配置接入 |
| **Skills 按需装卸** | 内置 Skill 模板 + 第三方 Skill 市场 + 自定义 SKILL.md |
| **人格/规则模板** | 提供 AGENTS.md / SOUL.md / TOOLS.md 的模板库，快速定义 Agent 行为 |
| **本地测试沙箱** | 创建后即可在沙箱中测试对话、工具调用、异常处理 |
| **导出 agent.yaml** | 标准化的 Agent 描述文件，可发布到 Store |

**核心原则：即插即拔、方便创造、方便安装卸载。**

### 2.2 Agent Store（Agent 商店）

面向 **Agent 消费者**（注意：消费者本身也是 Agent，不只是人类）。

| 能力 | 说明 |
|------|------|
| **Agent 目录与搜索** | 按类别（写作/搜索/办公/开发/运营...）浏览和搜索 |
| **能力描述** | 每个 Agent 的 agent.yaml 声明了工具、Skills、MCP 依赖 |
| **Benchmark 测试结果** | Agent 上架时附带标准化测试报告（能力范围、响应速度、准确率） |
| **Agent-to-Agent 评分** | 其他 Agent 使用后自动打分评价（不是人类打分） |
| **一键安装/卸载** | 读取 agent.yaml → 自动拉取 MCP → 安装 Skills → 创建 workspace |
| **依赖自动解析** | 安装 Agent 时自动检查并安装缺失的 MCP 和 Skills |
| **版本管理** | 支持升级、回滚、多版本共存 |
| **评价体系** | 安装量、使用频次、Agent 评分、人类评分多维度排序 |

---

## 三、底层架构

### 3.1 Gateway 运行时（共享基础设施）

```
┌──────────────────────────────────────────────────────┐
│                  Gateway (运行时)                      │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Tool 池 (全局共享·单实例)             │  │
│  │                                                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │  │
│  │  │ 内置工具  │ │ MCP 工具 │ │ 自定义工具│        │  │
│  │  │ read     │ │ writing_*│ │ office_  │        │  │
│  │  │ write    │ │ search_* │ │   gate   │        │  │
│  │  │ edit     │ │ kb_*     │ │ task_    │        │  │
│  │  │ browser  │ │ gmail_*  │ │  context │        │  │
│  │  │ message  │ │ notion_* │ │ ...      │        │  │
│  │  │ ...      │ │ ...      │ │          │        │  │
│  │  └──────────┘ └──────────┘ └──────────┘        │  │
│  └─────────────────────────────────────────────────┘  │
│                         │                              │
│         ┌───────────────┼───────────────┐              │
│         ▼               ▼               ▼              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Agent A    │  │ Agent B    │  │ Agent C    │       │
│  │ (writing)  │  │ (search)   │  │ (自定义)   │       │
│  │            │  │            │  │            │       │
│  │ 只是配置：  │  │ 只是配置：  │  │ 只是配置：  │       │
│  │ · 人格     │  │ · 人格     │  │ · 人格     │       │
│  │ · 工具声明 │  │ · 工具声明 │  │ · 工具声明 │       │
│  │ · Skills  │  │ · Skills  │  │ · Skills  │       │
│  │ · MCP 依赖│  │ · MCP 依赖│  │ · MCP 依赖│       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │           MCP Server Pool (按需启动)              │  │
│  │                                                 │  │
│  │  mcp-writing  mcp-search  markitdown  gmail     │  │
│  │  basic-memory  kb-orchestrator  notion  ...     │  │
│  │                                                 │  │
│  │  来源：本地自研 / npm 第三方 / 自定义             │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 3.2 关键设计原则

| 原则 | 说明 |
|------|------|
| **Tool 池共享** | 所有 Agent 共享同一个 Tool 池，同一个 MCP 实例。Agent 只声明"我需要哪些工具"，不自己启动/管理工具 |
| **零通信成本** | Agent 之间不需要 message 传数据。同一个运行时里直接调 Tool，函数调用级别的速度 |
| **即插即拔** | MCP 和 Skills 可以随时添加/移除，Agent 声明依赖后自动解析 |
| **配置即 Agent** | Agent 没有代码，只有配置文件。换一套配置就是另一个 Agent |
| **来源多元** | MCP 和 Skills 支持三种来源：内置（自研）、第三方（npm/registry）、自定义（用户本地） |

### 3.3 Agent 标准描述格式 (agent.yaml)

```yaml
# agent.yaml — Agent 的"安装清单"，也是上架 Store 的"商品描述"
name: writing-pro
version: 1.2.0
description: 调研驱动的智能写作助手，支持搜索+知识库+全流程写作
author: lingf
license: MIT
tags: [writing, research, office]

# 从 Tool 池选需要的工具
tools:
  required:
    - writing_draft
    - writing_content
    - writing_polish
    - writing_review
    - writing_rewrite
    - search_web
    - fetch_web_page
    - read
    - write
  optional:
    - search_notes      # 知识库搜索（如果有 basic-memory）
    - build_context     # 知识库上下文（如果有 basic-memory）
    - convert_to_markdown  # 格式转换（如果有 markitdown）

# 依赖的 MCP（安装时自动拉取）
mcp:
  required:
    - name: mcp-writing
      source: local:~/.openclaw/mcp-writing
    - name: mcp-search
      source: local:~/.openclaw/mcp-search
  optional:
    - name: basic-memory
      source: npm:basic-memory
      description: 知识库记忆，提供上下文增强
    - name: markitdown
      source: pypi:markitdown-mcp
      description: 文档格式转换

# 自带的 Skills
skills:
  bundled:
    - write-and-export     # 写作导出流水线
    - research-report      # 调研报告流水线
  supports_custom: true    # 允许用户追加自定义 Skills

# 人格和规则文件（workspace 内容）
workspace:
  files:
    - AGENTS.md            # 路由规则 + 行为约束
    - SOUL.md              # 人格定义
    - TOOLS.md             # 工具使用指南
    - IDENTITY.md          # 身份声明
    - USER.md              # 用户画像模板
    - HEARTBEAT.md         # 定时检查清单

# 能力声明（供 Store 展示和 Agent-to-Agent 评估）
capabilities:
  - 起草文章/报告/方案
  - 大纲确认后再生成正文
  - 联网搜索获取实时信息
  - 知识库检索增强写作
  - 润色/审稿/改写
  - Markdown 输出，可选格式导出

# 测试用例（供 benchmark）
tests:
  - input: "写一篇关于AI的500字短文"
    expect: "调用 writing_draft → 展示大纲 → 确认后调用 writing_content"
  - input: "调研MCP生态并写报告"
    expect: "调用 search_web → 整理结果 → writing_draft → 确认 → writing_content"
```

---

## 四、Agent 生命周期

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Factory 创建                                                │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐ │
│  │ 选工具   │ →  │ 选 MCP  │ →  │ 写 Skills│ →  │ 定义人格 │ │
│  │ (Tool池) │    │ (即插拔)│    │ (模板库) │    │(SOUL.md) │ │
│  └─────────┘    └─────────┘    └─────────┘    └──────────┘ │
│       │                                             │        │
│       ▼                                             ▼        │
│  ┌──────────┐                                 ┌──────────┐  │
│  │ 本地测试  │                                 │ 导出 yaml│  │
│  │ (沙箱)   │                                 │          │  │
│  └──────────┘                                 └─────┬────┘  │
│                                                     │        │
├─────────────────────────────────────────────────────┼────────┤
│                                                     │        │
│  Store 发布                                         ▼        │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐   │
│  │ 上传 yaml│ →  │ 自动跑   │ →  │ 上架                  │   │
│  │ + 文件   │    │ benchmark│    │ · 能力标签            │   │
│  └──────────┘    └──────────┘    │ · benchmark 结果     │   │
│                                  │ · 作者/版本/许可证    │   │
│                                  └──────────┬───────────┘   │
│                                             │                │
├─────────────────────────────────────────────┼────────────────┤
│                                             │                │
│  用户安装                                    ▼                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 一键安装                                              │   │
│  │                                                      │   │
│  │ 1. 解析 agent.yaml                                   │   │
│  │ 2. 检查 Tool 池 → 缺的工具报错                        │   │
│  │ 3. 拉取 MCP 依赖 → npm install / uvx / 本地路径       │   │
│  │ 4. 安装 Skills → 复制到 workspace/skills/             │   │
│  │ 5. 创建 workspace → 写入人格/规则文件                  │   │
│  │ 6. 注册到 Gateway agents.list                        │   │
│  │ 7. 就绪                                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  使用 & 评价                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐   │
│  │ 用户/Agent│ →  │ 对话交互  │ →  │ 自动评价              │   │
│  │ 选择 Agent│    │ 调用 Tool│    │ · 任务完成率          │   │
│  └──────────┘    └──────────┘    │ · 响应速度            │   │
│                                  │ · 工具调用准确度       │   │
│                                  │ · Agent-to-Agent 评分 │   │
│                                  │ · 人类评分 (可选)      │   │
│                                  └──────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  卸载                                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 一键卸载                                              │   │
│  │                                                      │   │
│  │ 1. 从 agents.list 移除                               │   │
│  │ 2. 删除 workspace                                    │   │
│  │ 3. 检查 MCP 是否还有其他 Agent 依赖                    │   │
│  │    → 无人依赖 → 停止并清理                             │   │
│  │    → 仍有依赖 → 保留                                  │   │
│  │ 4. Skills 同理                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 五、Agent-to-Agent 评价体系

这是 Agent Store 区别于传统 App Store 的核心创新。

### 5.1 为什么是 Agent 评价 Agent？

传统 App Store 依赖人类评价，但 Agent 市场的消费者本身就是 Agent。一个编排型 Agent 在选择"我该调用哪个写作 Agent"时，不能去读人类写的"五星好评"，而是需要**结构化的、可计算的评估数据**。

### 5.2 评价维度

```yaml
evaluation:
  # 自动指标（安装后自动采集）
  auto_metrics:
    task_completion_rate: 0.92    # 任务完成率
    avg_response_time_ms: 35000  # 平均响应时间
    tool_call_accuracy: 0.88     # 工具调用准确度（调对工具的比例）
    error_rate: 0.05             # 错误率
    fallback_rate: 0.12          # 降级率（MCP不可用时的表现）

  # Agent-to-Agent 评分（其他 Agent 使用后打分）
  agent_reviews:
    - reviewer: office-agent-v2
      score: 4.2 / 5
      comment: "写作质量高，但搜索结果整合偶尔偏离主题"
      tested_tasks: ["写报告", "调研+写作", "润色"]
    - reviewer: project-manager-agent
      score: 4.5 / 5
      comment: "大纲确认节点设计合理，正文生成稳定"

  # 人类评分（可选）
  human_reviews:
    average: 4.3 / 5
    count: 127
```

### 5.3 评分如何产生

```
Agent A 安装了 Agent B
    ↓
Agent A 给 Agent B 派了 10 个任务
    ↓
系统自动记录：完成率、速度、错误率
    ↓
Agent A 根据结果自动生成结构化评价
    ↓
评价上传到 Store
    ↓
其他 Agent 看到评分，决定是否安装 Agent B
```

---

## 六、MCP 和 Skills 的来源体系

### 6.1 三种来源

| 来源 | 说明 | 示例 |
|------|------|------|
| **内置 (built-in)** | OpenClaw 自研，随 Gateway 分发 | mcp-writing, mcp-search, office_gate |
| **第三方 (registry)** | npm / PyPI / 专用 registry | markitdown-mcp, basic-memory, gmail-mcp |
| **自定义 (custom)** | 用户本地开发 | 企业内部 MCP、私有 Skills |

### 6.2 MCP 安装方式

```yaml
# agent.yaml 中的 MCP 声明
mcp:
  # 内置：本地路径
  - name: mcp-writing
    source: local:~/.openclaw/mcp-writing
    command: node
    args: [server.mjs]

  # 第三方 npm 包
  - name: basic-memory
    source: npm:basic-memory
    install: "uvx basic-memory mcp"

  # 第三方 PyPI 包
  - name: markitdown
    source: pypi:markitdown-mcp
    install: "uvx markitdown-mcp"

  # 自定义：git 仓库
  - name: my-company-crm
    source: git:https://git.myco.com/mcp/crm-server.git
    command: node
    args: [dist/server.js]
```

### 6.3 Skills 安装方式

```yaml
skills:
  # 自带的 Skills（打包在 Agent 里）
  bundled:
    - write-and-export
    - research-report

  # 从 Store 安装的第三方 Skills
  marketplace:
    - name: academic-writing
      source: store:@professor-agent/academic-writing
      version: ^2.0.0

  # 用户自定义
  custom_dir: ~/.openclaw/my-skills/
```

---

## 七、与当前工作的关系

### 现在做的事

| 当前产物 | 在未来架构中的角色 |
|----------|-------------------|
| writing agent | Agent Store 的**第一个样板商品** |
| search agent | Agent Store 的**第二个样板商品** |
| office agent | 一个**编排型 Agent 样板**（可选安装） |
| mcp-writing / mcp-search | Tool 池中的**内置 MCP** |
| office_gate / task_context | Tool 池中的**内置自定义工具** |
| 6 个 Skills (SKILL.md) | **可复用的 Skill 模板** |
| workspace 文件 (AGENTS.md 等) | **agent.yaml 的前身** |

### 演进路径

```
Phase 1 (当前)
  手动配置 Agent，写 workspace 文件，在 openclaw.json 中注册
  → 验证"Agent = 配置包"的模式可行

Phase 2 (近期)
  实现 agent.yaml 标准格式
  实现 openclaw agent install <agent.yaml> 一键安装
  实现 openclaw agent uninstall <name> 一键卸载
  → Agent Factory 的 CLI 版本

Phase 3 (中期)
  Agent Factory Web UI（可视化拖拽创建 Agent）
  Agent Store Registry（发布/搜索/安装）
  依赖自动解析（MCP + Skills）
  → 产品化

Phase 4 (远期)
  Agent-to-Agent 评价体系
  自动 benchmark
  Agent 自动选装（根据任务需求自动从 Store 选 Agent）
  → 生态化
```

---

## 八、总结

| 概念 | 一句话 |
|------|--------|
| **Agent** | 配置包，不是程序。人格 + 工具声明 + Skills + MCP 依赖 |
| **Tool 池** | Gateway 全局共享，所有 Agent 用同一份，零通信成本 |
| **MCP** | 即插即拔的能力扩展，支持内置/第三方/自定义三种来源 |
| **Skills** | 可复用的任务流水线，支持内置/第三方/自定义 |
| **Agent Factory** | 造 Agent 的工厂，选工具→选 MCP→写 Skills→定义人格→导出 |
| **Agent Store** | Agent 的市场，发布→发现→安装→评价，买卖双方都是 Agent |
| **评价体系** | Agent-to-Agent 的结构化评分，不依赖人类主观评价 |
