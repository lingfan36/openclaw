# 通用办公执行 Agent — 架构与流程文档

## 一、系统总架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OpenClaw Gateway (ws://127.0.0.1:18789)         │
│                     evol/claude-opus-4-6                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              office (主 Agent · default)                      │   │
│  │              workspace-office/                                │   │
│  │                                                              │   │
│  │  Bootstrap:  AGENTS.md  SOUL.md  TOOLS.md  IDENTITY.md      │   │
│  │              USER.md  HEARTBEAT.md  MEMORY.md                │   │
│  │                                                              │   │
│  │  Skills:     write-and-export   research-report              │   │
│  │              email-workflow     doc-convert                   │   │
│  │              office-doc-edit    composite-task                │   │
│  │                                                              │   │
│  │  职责:  任务识别 → 流水线编排 → 子Agent调度 → 确认节点管理    │   │
│  └──────┬───────────────┬───────────────┬───────────────────────┘   │
│         │               │               │                           │
│    ┌────▼─────┐   ┌─────▼──────┐  ┌─────▼──────────┐               │
│    │ writing  │   │  search    │  │  knowledge     │               │
│    │ 子Agent  │   │  子Agent   │  │  子Agent       │               │
│    │ 写作执行 │   │  信息检索  │  │  知识管理      │               │
│    └────┬─────┘   └─────┬──────┘  └─────┬──────────┘               │
│         │               │               │                           │
├─────────┴───────────────┴───────────────┴───────────────────────────┤
│                                                                     │
│  ┌─────────────────── 自定义 Tools (系统层) ──────────────────────┐ │
│  │                                                                │ │
│  │  office_gate          task_context                             │ │
│  │  ┌──────────────┐    ┌──────────────────────────────────┐     │ │
│  │  │ 动态授权闸门 │    │ 任务状态机                        │     │ │
│  │  │              │    │                                    │     │ │
│  │  │ request →    │    │ PENDING → RUNNING → AWAITING      │     │ │
│  │  │ 返回确认摘要 │    │    → COMPLETED / FAILED / PAUSED  │     │ │
│  │  │              │    │                                    │     │ │
│  │  │ execute →    │    │ 原子写入: tmp → rename             │     │ │
│  │  │ 授权5min TTL │    │ 状态转移校验: VALID_TRANSITIONS    │     │ │
│  │  │              │    │ artifacts / step_log / progress    │     │ │
│  │  │ status →     │    │                                    │     │ │
│  │  │ 列出活跃授权 │    │ 持久化: memory/tasks/{id}/         │     │ │
│  │  └──────────────┘    └──────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────── MCP Server Pool ────────────────────────────┐ │
│  │                                                                │ │
│  │  writing MCP         search MCP         markitdown MCP        │ │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │ │
│  │  │writing_draft │   │search_web    │   │convert_to_   │      │ │
│  │  │writing_content│  │fetch_web_page│   │  markdown     │      │ │
│  │  │writing_polish│   └──────────────┘   └──────────────┘      │ │
│  │  │writing_review│                                              │ │
│  │  │writing_rewrite│  kb-orchestrator     basic-memory          │ │
│  │  └──────────────┘   ┌──────────────┐   ┌──────────────┐      │ │
│  │                     │kb_clean_hash │   │search_notes  │      │ │
│  │                     │kb_extract_pdf│   │write_note    │      │ │
│  │                     │kb_batch_scan │   │read_note     │      │ │
│  │                     │kb_rank_trim  │   │build_context │      │ │
│  │                     └──────────────┘   └──────────────┘      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────── Hook (事件驱动) ────────────────────────────┐ │
│  │  office-audit → tool:after → append memory/audit.jsonl         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、操作安全分级架构

```
┌─────────────────────────────────────────────────────────────┐
│                    三层安全防护体系                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  第1层 · 系统层 (不可绕过)                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  openclaw.json → ToolPolicy                            │ │
│  │                                                        │ │
│  │  tools.allow: [read, write, edit, message, ...]        │ │
│  │  tools.deny:  [RunPython]                              │ │
│  │                                                        │ │
│  │  → 不在 allow 中的工具 = 系统层无法调用                  │ │
│  │  → deny 中的工具 = 硬性禁止                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  第2层 · Tool 层 (代码级, 不可绕过)                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  office_gate Tool                                      │ │
│  │                                                        │ │
│  │  ownerOnly: true  → 非 owner 直接 403                  │ │
│  │  ToolAuthorizationError → 未知 action 直接 403         │ │
│  │  ToolInputError → 缺少参数直接 400                     │ │
│  │                                                        │ │
│  │  → 高危操作必须经过 request → 用户确认 → execute       │ │
│  │  → 授权有 5min TTL，过期自动失效                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  第3层 · Skill/Prompt 层 (规则级, 前两层兜底)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AGENTS.md + SKILL.md 确认节点规则                      │ │
│  │                                                        │ │
│  │  ⏸️ [邮件发送] 需要确认                                │ │
│  │  收件人: xxx  主题: xxx  正文摘要: xxx                  │ │
│  │  回复 "确认" / "修改" / "取消"                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
├──────────────── 操作分级对照 ────────────────────────────────┤
│                                                             │
│  L0 只读    自动执行      search_web, read, convert_to_md   │
│  L1 本地写  自动+审计     write, edit, task_context          │
│  L2 外部    必须确认      message, gmail_send, office_gate   │
│  L3 禁止    拒绝执行      RunPython, 删邮件规则              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、六大流水线 (Pipeline) 流程

### Pipeline 1: write-and-export — 写作导出

```
用户: "写一篇关于 AI 的文章，导出 DOCX"
           │
           ▼
  ┌─────────────────┐
  │  需求解析        │  确认主题/长度/语气/目标格式
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  writing_draft   │  → 生成大纲
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  ⏸️ 确认节点     │  展示大纲 → 等待用户
  │                 │  "确认" → 继续
  │                 │  "修改" → 回到 writing_draft
  │                 │  "取消" → 终止
  └────────┬────────┘
           ▼ (用户确认)
  ┌─────────────────┐
  │  writing_content │  → 按大纲生成正文
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  writing_polish  │  (可选) 润色 + 修改对照表
  └────────┬────────┘
           ▼
  ┌─────────────────┐     失败回退
  │  格式导出        │ ──────────────→ 保留 .md + 提示
  │  markitdown/     │
  │  pandoc          │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  write 保存文件  │  → 返回文件路径
  └─────────────────┘
```

### Pipeline 2: research-and-report — 调研报告

```
用户: "调研 MCP 生态现状，写一份报告"
           │
           ▼
  ┌─────────────────┐
  │  解析调研范围    │  主题/深度/关键词
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  search_web      │  basic → 获取候选
  │  (8s timeout)    │
  └────────┬────────┘
           ▼
  ┌─────────────────┐     信息不足
  │  评估充分性      │ ──────────────→ search_web(advanced)
  └────────┬────────┘                  深度抓取 Top 3
           ▼
  ┌─────────────────┐
  │  整理 findings   │  归一化 + 标注来源 + 可信度
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  writing_draft   │  基于 findings 生成大纲
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  ⏸️ 确认节点     │  大纲确认
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  writing_content │  正文 + 引用 sources
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  (可选) 导出     │
  └─────────────────┘
```

### Pipeline 3: email-workflow — 邮件处理

```
用户: "帮我发邮件给 boss@co.com"
           │
           ▼
  ┌─────────────────┐
  │  分类请求        │  读取 / 发送 / 回复 / 批量
  └────────┬────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
  读取类        发送类
  (L0自动)      (L2需确认)
     │            │
     ▼            ▼
  ┌────────┐  ┌──────────────────┐
  │ Gmail  │  │  office_gate     │
  │ read   │  │  action=request  │
  └───┬────┘  │  summary=        │
      │       │  "收件人: boss   │
      ▼       │   主题: xxx      │
  ┌────────┐  │   正文: xxx"     │
  │ 有附件?│  └────────┬─────────┘
  │ → Yes  │           ▼
  └───┬────┘  ┌──────────────────┐
      ▼       │  ⏸️ 确认节点      │  展示摘要 → 等用户
  ┌────────┐  └────────┬─────────┘
  │convert │           ▼ (用户: "确认")
  │to_md   │  ┌──────────────────┐
  │(附件)  │  │  office_gate     │
  └────────┘  │  action=execute  │  → 授权 5min TTL
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  Gmail send      │  实际发送
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  审计日志记录     │  L2, gmail_send, ...
              └──────────────────┘
```

### Pipeline 4: doc-convert — 文档格式转换

```
用户: "把这个 PDF 转成 Markdown"
           │
           ▼
  ┌──────────────────────┐
  │  识别 源格式→目标格式 │
  └─────────┬────────────┘
            │
    ┌───────┴───────┐
    ▼               ▼
  任意→MD         MD→其他
    │               │
    ▼               ▼
  ┌────────┐    ┌────────────┐
  │convert │    │ pandoc /   │
  │to_md   │    │ OfficeMCP  │
  │(markit │    └─────┬──────┘
  │ down)  │          │
  └───┬────┘          ▼
      │          ┌────────────┐     失败
      ▼          │ write 保存 │ ─────────→ 保留 MD + 提示
  ┌────────┐     └────────────┘
  │ write  │
  │ 保存.md│
  └────────┘
```

### Pipeline 5: office-doc-edit — Office 文档编辑

```
用户: "编辑这个 Word 文档，添加一段总结"
           │
           ▼
  ┌──────────────────┐
  │  识别文档类型     │  .docx → Word / .xlsx → Excel / .pptx → PPT
  └────────┬─────────┘
           ▼
  ┌──────────────────┐     不可用
  │  OfficeMCP 检查  │ ──────────→ 提示 "需安装 OfficeMCP + Office"
  └────────┬─────────┘
           ▼
  ┌──────────────────┐
  │  OfficeMCP 打开  │  Officer.Word / Officer.Excel
  └────────┬─────────┘
           ▼
  ┌──────────────────┐
  │  执行编辑操作    │  ⚠️ RunPython = L3 禁止
  └────────┬─────────┘
           ▼
  ┌──────────────────┐
  │  OfficeMCP 保存  │  → 返回确认
  └──────────────────┘
```

### Pipeline 6: composite-task — 跨流水线编排

```
用户: "读邮件附件报告，整理要点，写回复"
           │
           ▼
  ┌──────────────────────────────────────────────────┐
  │  task_context(action=create)                      │
  │  title="邮件附件分析+回复"                          │
  │  pipeline_chain=[                                 │
  │    {pipeline:email, action:read},                 │
  │    {pipeline:doc-convert, action:pdf-to-md},      │
  │    {pipeline:research, action:summarize},          │
  │    {pipeline:email, action:reply}                  │
  │  ]                                                │
  └─────────────────────┬────────────────────────────┘
                        ▼
  ┌─────────── 循环执行每一步 ───────────────────────┐
  │                                                   │
  │   task_context(transition → RUNNING)              │
  │           │                                       │
  │           ▼                                       │
  │   ┌─────────────┐                                │
  │   │ 执行当前步骤 │ ← 调用对应 Pipeline Skill      │
  │   └──────┬──────┘                                │
  │          │                                        │
  │    ┌─────┼──────┐                                │
  │    ▼     ▼      ▼                                │
  │  成功  失败   确认节点                             │
  │    │     │      │                                 │
  │    ▼     ▼      ▼                                │
  │  set_   transition  transition                    │
  │  artifact → PAUSED  → AWAITING                    │
  │    +        │          │                          │
  │  advance   用户选择   用户确认                     │
  │  _step     跳过/重试  → RUNNING                    │
  │    │       /取消                                   │
  │    ▼                                              │
  │  下一步? ──Yes──→ 回到循环顶部                     │
  │    │                                              │
  │   No                                              │
  │    ▼                                              │
  │  task_context(transition → COMPLETED)             │
  │                                                   │
  └───────────────────────────────────────────────────┘
                        │
                        ▼
            ┌─────────────────────┐
            │  汇总输出            │
            │  · 每步状态          │
            │  · 产出文件列表      │
            │  · 耗时统计          │
            └─────────────────────┘
```

---

## 四、task_context 状态机

```
                    ┌──────────┐
                    │ PENDING  │
                    └────┬─────┘
                         │ transition("RUNNING")
                         ▼
               ┌─────────────────────┐
               │      RUNNING        │◄─────────────────┐
               └──┬──┬──┬──┬──┬─────┘                   │
                  │  │  │  │  │                          │
    ┌─────────────┘  │  │  │  └──────────┐               │
    ▼                │  │  │             ▼               │
┌────────┐           │  │  │     ┌──────────┐            │
│COMPLETED│          │  │  │     │  FAILED  │            │
└────────┘           │  │  │     └──────────┘            │
                     │  │  │                              │
              ┌──────┘  │  └──────┐                      │
              ▼         ▼         ▼                      │
        ┌──────────┐ ┌────────┐ ┌──────────┐             │
        │ AWAITING │ │RETRYING│ │  PAUSED  │             │
        └──┬───┬───┘ └──┬──┬──┘ └──┬───┬───┘            │
           │   │        │  │       │   │                 │
      确认 │   │取消  成功│  │耗尽 继续│   │取消            │
           ▼   ▼        ▼  ▼       ▼   ▼                │
        RUNNING CANCEL  │ PAUSED RUNNING CANCELLED       │
           │    LED     │          │                      │
           └────────────┼──────────┘                      │
                        │         (回到 RUNNING)           │
                        └─────────────────────────────────┘


合法状态转移表:

  PENDING   → [RUNNING]
  RUNNING   → [AWAITING, COMPLETED, RETRYING, PAUSED, FAILED]
  AWAITING  → [RUNNING, CANCELLED]
  RETRYING  → [RUNNING, PAUSED]
  PAUSED    → [RUNNING, CANCELLED]
  COMPLETED → (终态)
  FAILED    → (终态)
  CANCELLED → (终态)
```

---

## 五、数据流与文件布局

```
~/.openclaw/
├── openclaw.json                          ← 全局配置中枢
│
├── workspace-office/                      ← office 主 Agent 家目录
│   ├── AGENTS.md                          ← 路由 + 分级 + 确认规则
│   ├── SOUL.md                            ← 人格
│   ├── TOOLS.md                           ← 工具权限矩阵
│   ├── IDENTITY.md / USER.md / HEARTBEAT.md / MEMORY.md
│   ├── memory/
│   │   ├── tasks/                         ← task_context 持久化
│   │   │   └── {task_id}/
│   │   │       └── context.json           ← 原子写入 (tmp→rename)
│   │   └── audit.jsonl                    ← 审计日志 (append-only)
│   └── skills/
│       ├── write-and-export/SKILL.md
│       ├── research-report/SKILL.md
│       ├── email-workflow/SKILL.md
│       ├── doc-convert/SKILL.md
│       ├── office-doc-edit/SKILL.md
│       └── composite-task/SKILL.md
│
├── workspace-writing/                     ← writing 子 Agent
├── workspace-search/                      ← search 子 Agent
├── workspace-knowledge/                   ← knowledge 子 Agent
│
├── mcp-writing/server.mjs                 ← writing MCP (自研)
├── mcp-search/server.mjs                  ← search MCP (自研)
├── mcp-kb-orchestrator/server.mjs         ← 知识库 MCP
│
├── hooks/
│   └── office-audit/                      ← 审计 Hook
│       ├── HOOK.md
│       └── handler.ts
│
└── agents/{id}/                           ← 各 agent 运行时状态
    ├── agent/auth-profiles.json
    └── sessions/


源码 (src/agents/tools/):

  office-gate.ts       (2.9KB)  动态授权闸门    6 tests PASS
  task-context.ts      (7.9KB)  任务状态机      10 tests PASS
  注册于 openclaw-tools.ts:251-252
```

---

## 六、Agent 工具权限矩阵

| 工具 | office (主) | writing (子) | search (子) | knowledge (子) |
|------|:-----------:|:------------:|:-----------:|:--------------:|
| read | ✅ | ✅ | ✅ | ✅ |
| write | ✅ | ✅ | - | ✅ |
| edit | ✅ | ✅ | - | ✅ |
| message | ✅ | - | ✅ | ✅ |
| web_search | ✅ | ✅ | ✅ | ✅ |
| browser | ✅ | ✅ | ✅ | ✅ |
| local_find | ✅ | - | ✅ | ✅ |
| local_grep | ✅ | - | ✅ | ✅ |
| office_gate | ✅ | - | - | - |
| task_context | ✅ | - | - | - |
| writing_* (MCP) | ✅(via MCP) | ✅(via MCP) | - | - |
| search_* (MCP) | ✅(via MCP) | - | ✅(via MCP) | - |
| convert_to_markdown | ✅(via MCP) | - | - | - |
| RunPython | **DENY** | - | - | - |

---

## 七、MCP 筛选与部署分级

### 当前已接入 (Phase 1)

| MCP | 类型 | 工具 | 维护状态 |
|-----|------|------|----------|
| mcp-writing | 自研 | writing_draft/content/polish/review/rewrite | 完全可控 |
| mcp-search | 自研 | search_web, fetch_web_page | 完全可控 |
| markitdown-mcp | 微软官方 | convert_to_markdown | 82k+ stars, 活跃维护 |
| kb-orchestrator | 自研 | kb_clean_hash, kb_extract_pdf, ... | 完全可控 |
| basic-memory | 第三方 | search_notes, write_note, read_note, ... | 社区维护 |

### 待接入 (Phase 2)

| MCP | 用途 | 前置条件 |
|-----|------|----------|
| Gmail MCP (ArtyMcLabin fork) | 邮件收发 | Google OAuth 配置 |
| Notion MCP (官方) | Notion 读写 | Notion API Token |

### 未来扩展 (Phase 3)

| MCP | 用途 | 状态 |
|-----|------|------|
| Google Workspace MCP | Docs/Sheets/Calendar | OAuth 复杂, 观望 |
| ms-365-mcp-server | Outlook/Excel/Teams | Azure AD 注册, 观望 |
| OfficeMCP | 本地 Office COM 自动化 | 需 Windows + Office |

---

## 八、E2E 验证结果

| 测试项 | 结果 | 证据 |
|--------|:----:|------|
| Gateway 启动 | ✅ | ws://127.0.0.1:18789, 4 agents loaded |
| Agent 注册 | ✅ | office=default, writing, search, knowledge |
| Bootstrap 文件注入 | ✅ | 7/7 workspace 文件 + 6/6 Skills 全部注入 |
| Tools 注册 | ✅ | office_gate + task_context 在 tools 列表 |
| task_context create | ✅ | context.json 写入磁盘, status=PENDING |
| office_gate request | ✅ | 返回 awaiting_confirmation + 确认摘要 |
| office_gate execute | ✅ | 返回 authorized, TTL=300s |
| office_gate status | ✅ | 显示 1 条活跃授权 |
| 写作大纲 | ✅ | 4 章节大纲 + 确认节点正确拦截 |
| 写作正文 | ✅ | 用户确认后生成 836 字完整文章 |
| 单元测试 | ✅ | 16/16 pass |
| 编译 | ✅ | 1840 files, 3.5s, 0 新增错误 |
| 回归测试 | ✅ | 0 新增失败 |
| 审计 Hook | ⚠️ | 注册成功, tool:after 事件类型待对齐 |
