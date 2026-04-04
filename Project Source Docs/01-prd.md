# LAB — Product Requirements Document
**DOC-01 · PRD · Revision 0.2**
Status: DRAFT | Platform: Electron (macOS · Windows · Linux) | Author: David

---

## 1. Problem Statement

Engineering portfolio work is scattered across folders, Notion, phone photos, and spreadsheets. When it's time to show someone your work, you're assembling fragments on the fly. There is no single tool that lets a hardware/software engineer manage a project deeply *and* produce a polished, interactive public-facing page from the same source of truth.

**Core insight:** LAB separates the *workspace* (private, rich, messy — for you) from the *public page* (curated, beautiful — for everyone else). They stay in sync because they share the same underlying project data.

---

## 2. Goals & Success Metrics

| Goal | Metric | Priority |
|------|--------|----------|
| Single source of truth per project | All resources, guides, media in one place | P1 |
| Generate a public-facing page in <5 min | From blank project to exportable HTML | P1 |
| Structured content entry (BOM, guides) | Form-based input, not free-text | P1 |
| Markdown import & rendering | Drop a .md file → rendered block in canvas | P1 |
| Notion-style grid canvas | Any block can be dragged to any cell in a grid | P1 |
| Export to standalone HTML | Self-contained, no-dependency single file | P1 |
| Git-backed versioning | Auto-commit on save with clean history | P2 |
| GitHub Pages publish | One-click deploy to free public URL | P2 |

---

## 3. User Stories

| Role | I want to… | So that… |
|------|-----------|----------|
| David (owner) | Create a project and dump all resources into it | I never lose track of where things are |
| David (owner) | Fill in structured forms (BOM, build guide, case study) | My knowledge is captured consistently |
| David (owner) | Import a .md file I wrote or generated externally | I can bring in AI-generated content without it being in the app |
| David (owner) | Drag blocks into a grid layout freely | My canvas reflects how I think, not a fixed list |
| David (owner) | Toggle which blocks appear on the public page | I control what the world sees |
| David (owner) | Click any element in the public page preview | I'm taken straight to that block's editor |
| Visitor | View an interactive project page in a browser | I can explore project depth without the app |
| David (owner) | Export a self-contained HTML file | I can share it without any infrastructure |

---

## 4. Feature Inventory — P1 (MVP)

### 4.1 Project Dashboard
- Grid/list view of all projects
- Create, rename, archive, delete
- Filter by type: Hero / Build / Design / Concept
- Project card shows: cover image, name, subtitle, type badge, last-updated

### 4.2 Workspace Canvas (Notion-style)
- Grid-based layout: blocks occupy cells in a responsive grid
- Drag-and-drop reordering: drag any block to any position (using dnd-kit)
- "Add block" button: appears on hover between/beside blocks; opens block picker
- Block toolbar on hover: move handle, visibility toggle, delete, expand/collapse
- Column resizing: drag divider between columns to resize

### 4.3 Block Types (see Data Schema DOC-03)
- `how_it_works` — rich text section
- `bom` — inline-editable table (item / detail / qty / cost)
- `build_guide` — numbered step list with optional image per step
- `case_study` — structured paragraphs (challenge / approach / outcome scaffold)
- `image_gallery` — drag-in images, lightbox on public page
- `markdown` — import a .md file or paste markdown; rendered in canvas and on public page
- `link` — URL card with label and description
- `spec_table` — custom headers + rows
- `embed` — YouTube, PDF, Figma iframe
- `text` — freeform rich text (headings, bold, italic, lists)
- `note` — internal scratchpad (never appears on public page)
- `todo` — internal checklist (never appears on public page)

### 4.4 Markdown Import
- Drag a .md file onto the canvas → creates a `markdown` block
- Or: "Import .md" button in block picker
- Frontmatter parsed for metadata (title, tags, date)
- Rendered in canvas using marked.js + custom CSS matching LAB design tokens
- Content editable after import (raw markdown editable in a code pane, preview pane shown side-by-side)

### 4.5 Public Page Preview
- Right panel (or detachable window) shows the live rendered public page
- Updates when: blocks are saved, visibility toggled, page config changed
- Refresh is triggered on block save (debounced 1s) — not on every keystroke
- Click any element in preview → canvas scrolls to and highlights that block

### 4.6 Public Page Customiser
- Toggle section visibility
- Drag to reorder sections
- Set accent colour, background colour
- Choose layout variant: Default / Minimal / Magazine
- Override section heading labels

### 4.7 Export
- Export as self-contained single .html file (assets base64-embedded)
- Export as .zip (HTML + /assets folder with relative paths) — cleaner for large projects

---

## 5. Feature Inventory — P2 (Post-MVP)

| Feature | Description |
|---------|-------------|
| Git sync | Auto-commit on save; push to GitHub remote |
| GitHub Pages publish | Deploy public page to gh-pages branch; show live URL |
| Project history | View commit log; restore to any previous state |
| Render gallery | Lightbox viewer with CAD render tags and annotations |
| Public URL share | Copy shareable link button when GitHub Pages deployed |

---

## 6. Explicitly Out of Scope (v1)

- In-app AI content generation (content is created externally and imported)
- Multi-user collaboration
- Cloud storage backend
- Mobile app
- Custom domain hosting
- Real-time sync between devices
- CMS-style blog posts
- Payment / subscription gating

---

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Cold launch time | <3s on modern hardware |
| Canvas render (50 blocks) | <200ms |
| Public page render | <500ms |
| Export (with images) | <5s for projects up to 50MB |
| Offline-first | All features work without internet (except GitHub push in P2) |
| Data safety | No data loss on crash; SQLite WAL mode; auto-save on every block change |
