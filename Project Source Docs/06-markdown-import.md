# LAB — Markdown Import & Rendering Specification
**DOC-06 · MARKDOWN · Revision 0.2**
This is a P1 feature. All AI content generation happens outside the app; markdown is the import format.

---

## 1. Philosophy

LAB does not generate content. You generate content — using Claude, GPT, or your own brain — and save it as `.md` files. LAB's job is to **receive, render, and organise** that content. Markdown is the universal exchange format.

This means:
- Your BOM, build guide, case study, or any freeform notes can all be written externally as `.md` and dropped into LAB
- LAB renders them beautifully in the canvas and on the public page
- You can edit the raw markdown in-app after import
- Frontmatter metadata (title, type, tags) is extracted and used to pre-fill block fields

---

## 2. Import Entry Points

### 2.1 Drag and Drop onto Canvas
Drag a `.md` file from Finder/Explorer directly onto the canvas area.

On drop:
1. Electron's `will-navigate` event is suppressed (prevents accidental navigation)
2. The drop event fires in the renderer; the file path is extracted from `e.dataTransfer.files`
3. The renderer calls `window.lab.asset.import({ projectId, srcPath })` via the IPC bridge
4. Main process copies the file to the project's assets dir, creates an asset record
5. Main process reads and parses the file (frontmatter + body)
6. Returns parsed content to renderer
7. Renderer creates a `markdown` block pre-populated with the parsed data

### 2.2 Block Picker → "Import .md"
In the block picker, selecting the "Markdown" block type offers two options:
- **Paste / type** — opens an empty markdown block with CodeMirror editor
- **Import .md file** — triggers `showOpenDialog({ filters: [{ name: 'Markdown', extensions: ['md'] }] })`

### 2.3 Asset Library → Drag onto Canvas
Markdown files previously imported to the asset library can be dragged from the sidebar's Assets tab directly onto the canvas. This creates a `markdown` block referencing that asset.

---

## 3. Frontmatter Parsing

LAB uses `gray-matter` to parse YAML frontmatter.

```typescript
import matter from 'gray-matter';

interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;           // markdown content without frontmatter
  excerpt?: string;       // first paragraph, auto-extracted
}

function parseMarkdownFile(content: string): ParsedMarkdown {
  const { data, content: body, excerpt } = matter(content, {
    excerpt: true,
    excerpt_separator: '<!-- more -->',
  });
  return { frontmatter: data, body, excerpt };
}
```

### Recognised Frontmatter Keys

| Key | Type | Used as |
|-----|------|---------|
| `title` | string | Block subtitle / section heading override |
| `date` | string | Shown in block header (informational) |
| `tags` | string[] | Asset tags |
| `type` | string | Hint for block placement (e.g. "bom", "build-guide") |
| `visible` | boolean | Sets `visible_on_page` default (defaults to true) |
| `layout` | string | Hint for public page rendering variant |

All other frontmatter keys are stored in `block.data.frontmatter` and available for future use.

### Example Frontmatter

```yaml
---
title: "FDL-8 Bill of Materials — v5"
date: 2026-04-01
tags: [bom, fdl-8, hardware]
type: bom
visible: true
---

| Item | Detail | Qty | Cost |
|------|--------|-----|------|
| Nordic nRF52840 SoC | BLE 5.3, 64MHz | 1 | €4.50 |
...
```

---

## 4. Markdown Rendering (Canvas)

The canvas renders the `markdown` block in a **split pane**:

```
┌ Markdown Block ──────────────────────────────────────────────────────────┐
│  "FDL-8 Bill of Materials" (from frontmatter.title)    [Raw] [Preview]  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─── CodeMirror (raw) ──────────┐ ┌─── Preview ─────────────────────┐ │
│  │ # FDL-8 BOM                  │ │                                  │ │
│  │                               │ │  FDL-8 BOM                      │ │
│  │ | Item | Detail | ...        │ │  ─────────────────               │ │
│  │ |------|--------|             │ │  Item    │ Detail │ Qty │ Cost   │ │
│  │ | nRF52840 | BLE | ...       │ │  nRF52840│ BLE... │  1  │ €4.50 │ │
│  └───────────────────────────────┘ └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**Toggle states:**
- `[Raw | Preview]` — toggle in block toolbar
- Default: split view
- On small canvas widths (<500px): tabs instead of split

**Live preview update:** CodeMirror → `onChange` → debounce 300ms → re-render preview via `marked.parse()`

---

## 5. Rendering Implementation

```typescript
// src/renderer/components/blocks/MarkdownBlock.tsx (outline)

import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked once at app init
marked.setOptions({
  gfm: true,          // GitHub Flavoured Markdown (tables, strikethrough)
  breaks: false,
  pedantic: false,
});

// Custom renderer for syntax highlighting (optional — use highlight.js)
const renderer = new marked.Renderer();
// Override renderer.code() to wrap with <pre><code class="language-...">

function renderMarkdown(raw: string): string {
  const dirty = marked.parse(raw) as string;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1','h2','h3','h4','h5','h6','p','strong','em','a','ul','ol','li',
      'blockquote','code','pre','table','thead','tbody','tr','th','td',
      'img','hr','br','del','figure','figcaption'
    ],
    ALLOWED_ATTR: ['href','src','alt','class','id','target'],
  });
}
```

---

## 6. Rendering on the Public Page

The `renderMarkdown` block renderer in the main process uses the same `marked` + `DOMPurify` approach:

```typescript
// src/main/renderer/block-renderers/markdown.ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom'; // DOMPurify needs a DOM in Node.js

const { window: jsdomWindow } = new JSDOM('');
const purify = DOMPurify(jsdomWindow as unknown as Window);

export function renderMarkdown(
  data: MarkdownData,
  _assets: Map<string, string>,
  blockId: string,
  customTitle?: string
): string {
  const html = purify.sanitize(marked.parse(data.raw) as string);
  const title = customTitle ?? data.frontmatter?.title as string ?? 'Notes';

  return `<section class="lab-section markdown-section" data-block-id="${blockId}">
    <h2 class="section-heading">${escapeHtml(title)}</h2>
    <div class="prose markdown-body">${html}</div>
  </section>`;
}
```

The `markdown-body` class applies GitHub-style typography (defined in `BASE_CSS`).

---

## 7. Editing After Import

After import, the raw markdown is fully editable in the CodeMirror pane. Changes are saved to `block.data.raw` on every auto-save (debounced 500ms).

The original imported file in the assets dir is **not modified** — it's a snapshot of the import. The live `data.raw` in the DB is the source of truth after import.

---

## 8. Structured Block Auto-detection (Optional Enhancement)

When a `.md` file is imported, LAB can optionally detect structured patterns and offer to convert them to typed blocks instead of a raw markdown block:

| Detected pattern | Offered conversion |
|-----------------|-------------------|
| Markdown table with columns matching Item/Detail/Qty | "Convert to BOM block?" |
| Numbered list with `##` headings per step | "Convert to Build Guide block?" |
| Frontmatter `type: bom` | Auto-convert without prompting |
| Frontmatter `type: build-guide` | Auto-convert without prompting |

This is a UX enhancement — always offer the user a choice. Never silently convert. Conversion maps markdown structure to the block's typed `data` schema.

---

## 9. Dependencies

| Package | Purpose |
|---------|---------|
| `marked` | Markdown → HTML conversion |
| `dompurify` | Sanitise HTML output (renderer process) |
| `jsdom` | DOM environment for DOMPurify in Node.js (main process) |
| `gray-matter` | YAML frontmatter parsing |
| `@codemirror/lang-markdown` | Markdown syntax highlighting in CodeMirror editor |
| `@codemirror/view` | CodeMirror core editor component |
