---
name: writer
description: Structured writing assistant for creating, editing, and managing documents with version control. Supports multi-section documents, content drafting, and export to multiple formats.
---

# Writer Skill

Use this skill for structured document creation and management.

## Core Capabilities

1. **Document Management** - Create, list, and manage documents
2. **Content Editing** - Write, append, and organize sections
3. **Version Control** - Snapshots, rollback, and history
4. **Export** - Multiple formats (Markdown, Text, HTML, JSON)

## Document Structure

```
Document
├── id: string (auto-generated)
├── title: string
├── brief: Brief (writing guidelines)
├── sections: Section[]
└── versions: Version[]
```

## Workflow

### 1. Create Document

Use `writer_doc create` with:
- `title` - Document title
- `brief` (optional) - Writing guidelines
  - `language` - Target language
  - `audience` - Target readers
  - `tone` - Writing style
  - `format` - Format requirements
  - `length` - Length requirements

### 2. Edit Content

Use `writer_draft` to:
- Write section content
- Append to existing sections
- Insert new sections
- Batch update multiple sections

### 3. Export

Use `writer_export` with format:
- `markdown` - Markdown with headers
- `text` - Plain text
- `html` - HTML with semantic tags
- `json` - Full document object
- `toc` - Table of contents
- `finalize` - Mark as final version

## Important Notes

- All documents stored in memory (not persisted to disk)
- Export returns strings only (no file writes)
- Version snapshots created automatically on rewrite
- Section status: empty → draft → final
