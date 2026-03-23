# OpenClaw 测试指南

## 测试类型对比

### 增量测试 (Incremental Test)
**命令**: `pnpm test`

**特点**:
- 运行单元测试
- 测试单个函数/模块
- 执行速度快（秒级）
- 不需要启动完整服务
- 适合开发时快速验证

**使用场景**:
- 修改了某个函数
- 添加了新的工具
- 重构代码逻辑
- CI/CD 快速检查

**示例**:
```bash
# 运行所有单元测试
pnpm test

# 运行特定目录的测试
pnpm test -- src/agents

# 运行特定文件的测试
pnpm test -- src/agents/tools/web-search.test.ts
```

---

### 端到端测试 (E2E Test)
**命令**: `pnpm test:e2e`

**特点**:
- 测试完整用户流程
- 模拟真实使用场景
- 执行速度慢（分钟级）
- 需要启动完整服务
- 确保整体功能正常

**使用场景**:
- 发布前验证
- 测试完整工作流
- 验证多个组件协作
- 回归测试

**示例**:
```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 运行完整测试套件
pnpm test:all
```

---

## 针对 Agent 的测试

### 1. 增量测试 Agent 功能
```bash
# 测试 agent 核心逻辑
pnpm test -- src/agents

# 测试工具系统
pnpm test -- src/agents/tools

# 测试记忆搜索
pnpm test -- src/memory
```

### 2. E2E 测试 Agent 流程
```bash
# 完整的 agent 交互测试
pnpm test:e2e
```

---

## 测试覆盖率

```bash
# 生成测试覆盖率报告
pnpm test:coverage
```

---

## 对比总结

| 维度 | 增量测试 | 端到端测试 |
|------|---------|-----------|
| 速度 | 快 (秒) | 慢 (分钟) |
| 范围 | 单个模块 | 完整流程 |
| 依赖 | 最小 | 完整环境 |
| 适用 | 开发阶段 | 发布前 |
| 反馈 | 精确定位 | 整体验证 |

---

## 针对本次 Agent 重构的测试建议

### 增量测试
```bash
# 测试 search-agent 相关
pnpm test -- src/agents/tools/web-search
pnpm test -- src/memory/search-manager

# 测试 writer-agent 相关
pnpm test -- packages/mcp-writer
```

### E2E 测试
```bash
# 完整流程测试
pnpm test:e2e
```
