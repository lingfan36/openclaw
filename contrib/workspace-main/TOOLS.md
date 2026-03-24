# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

### Writer (MCP)

写作相关任务**必须**使用 writer_* 工具，不要直接回答：

- `writer_check` — 任何文本润色/检查请求，先用这个分析质量（可读性、套话、风格）
- `writer_rewrite` — 改写文本（prepare 模式获取上下文，replace 模式执行替换）
- `writer_doc` — 长文写作时创建文档（支持 article/email/report 等模板）
- `writer_draft` — 向文档中写入/追加/插入内容
- `writer_export` — 导出文档（markdown/html/json）或定稿

工作流示例：
- 短文本润色：writer_check 分析 → writer_rewrite prepare → 返回改写结果
- 长文写作：writer_doc create → writer_draft 写入各章节 → writer_check 检查 → writer_export 导出
