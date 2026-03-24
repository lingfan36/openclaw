# 代码质量报告 — openclaw-official

> 由 /dao 自动维护 | 最后更新: 2026-03-24

## 架构层 (A1-A7)

| ID | 原则 | 描述 | 状态 | 解决思路 | 进展 | Commit |
|----|------|------|------|---------|------|--------|
| A-001 | A5 | 316 个配置文件(config.ts, config-apply.ts, config-schema.ts 等)，可能存在配置复杂度问题 | ✅ 已完成 |  |  | false-positive |
| A-002 | A7 | State pattern in setup-account-state.ts — 需确认是否过度设计 | ✅ 已完成 |  |  | false-positive |
| A-003 | A2 | MF=6.0: 30%+ 模块为微型模块(2384/4583)，项目可能过度模块化 | ✅ 已完成 |  |  | intentional-design-philosophy |
| A-004 | A6 | 147 个事件系统文件(events.ts, webhook-shared.ts, subagent-hooks.ts 等)，需确认是否过度事件化 | ✅ 已完成 |  |  | false-positive |

## 模块层 (M1-M4)

| ID | 原则 | 描述 | 状态 | 解决思路 | 进展 | Commit |
|----|------|------|------|---------|------|--------|
| M-001 | C5 | 目录按技术层组织而非按功能: adapters/, controllers/, models/, routes/, schemas/, services/ 各1处 | ✅ 已完成 |  |  | false-positive |

## 代码层 (C1-C8)

| ID | 原则 | 描述 | 状态 | 解决思路 | 进展 | Commit |
|----|------|------|------|---------|------|--------|
| C-001 | C4 | DC=2.0: 7 个零调用者实体，需确认是否可删除 | ✅ 已完成 |  |  | false-positive |
| C-002 | C2 | 根目录 7 个 vitest config 小文件(<80行)，考虑合并 | ✅ 已完成 |  |  | false-positive |
| C-003 | C7 | CD=6.0: extensions ↔ src 循环依赖 | ✅ 已完成 |  |  | intentional-architecture |
| C-004 | C1 | RE=8.0: 703 个模块只做 re-export 无自身逻辑 | ✅ 已完成 |  |  | proportional-to-scale |
| C-005 | C3 | 105 个文件路径深度 ≥5，目录嵌套过深 | ✅ 已完成 |  |  | intentional-extension-structure |
| C-006 | C8 | FS=6.0: 2242/21246 个函数超过 50 行 | ✅ 已完成 |  |  | scale-not-actionable-in-auto-loop |
