# 可用工具

## 本地搜索
- Grep: 内容搜索
- Glob: 文件名匹配
- Read: 读取文件

## Web 搜索 (MCP)
- **search_pipeline**: 全流程搜索管线（推荐）
  - 输入: `queries`(1-3 个查询), `top_k`(默认 15), `read_top`(默认 3)
  - 输出: 排序结果，top 页面含正文内容
  - 自动处理: 多引擎搜索(Bing+DDG) → 去重 → 4 信号排序 → 路由 → 阅读
  - 路由: HTML 自动读取 / PDF 返回 pdf_hint / SPA 返回 browser_hint
- search_web: 基础搜索（向后兼容，basic/advanced 模式）
- fetch_web_page: 获取单页内容（自动路由 HTML/PDF/SPA）

## 后备
- Tavily: AI 优化搜索
- Playwright: 网页抓取（用于 browser_hint 跟进）

## 权限
只读，无 write/exec 权限
