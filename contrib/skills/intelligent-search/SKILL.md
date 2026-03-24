---
name: intelligent-search
description: 搜索决策树：本地文件（Grep/Glob）或 Web（Tavily/Playwright）
user-invocable: true
---

# Intelligent Search Skill

## 决策树
1. 本地文件/代码 → Grep（内容）/Glob（文件名）
2. 实时信息/文档 → Tavily
3. 深度网页内容 → Playwright（仅当 Tavily 摘要不足或用户明确要求时）

## 调用模板
- Grep: `grep -r "pattern" path/` → kind=grep
- Glob: `**/*.ts` → 候选文件，需 Read/Grep 补 snippet
- Tavily: 快速搜索 + 自动引用 → kind=tavily
- Playwright: 抓取特定 URL → kind=playwright

## Glob 处理规则
Glob 结果作为候选文件，必须经过 Read/Grep 补充内容后才进入 findings

## Playwright 触发条件
- Tavily 返回摘要不足
- 用户明确要求读取指定页面
- 避免普通搜索变成高成本流程

## 混合搜索策略
- 查询既包含本地上下文，又依赖实时外部信息时 → type=hybrid
- 执行顺序：先 local 后 web，再统一归一化

## 结果归一化
所有结果转换为统一 schema（见 AGENTS.md）
