# LAB — Data Schema Specification
**DOC-03 · DATA · Revision 0.2**
Store: SQLite (better-sqlite3) | ORM: Drizzle | Serialisation: JSON columns for flexible block data

---

## 1. Schema Overview

```
projects ──< blocks
projects ──< assets
blocks >── assets  (via JSON data.asset_ids or data.img_asset_id fields)
```

All primary keys use **ULID** strings (universally unique, lexicographically sortable, URL-safe). Generated in main process using the `ulidx` package.

---

## 2. Table: `projects`

```typescript
// src/main/db/schema.ts
export const projects = sqliteTable('projects', {
  id:             text('id').primaryKey(),
  name:           text('name').notNull(),
  slug:           text('slug').notNull().unique(),
  type:           text('type').notNull(),          // 'hero' | 'build' | 'design' | 'concept'
  subtitle:       text('subtitle'),
  core_value:     text('core_value'),
  status:         text('status').notNull().default('active'), // 'active' | 'archived' | 'draft'
  page_config:    text('page_config'),             // JSON: PublicPageConfig
  cover_asset_id: text('cover_asset_id'),          // FK → assets.id
  created_at:     integer('created_at').notNull(),
  updated_at:     integer('updated_at').notNull(),
});
```

### `page_config` JSON shape (`PublicPageConfig`)

```typescript
interface PublicPageConfig {
  theme: {
    accent:         string;   // CSS colour e.g. "#00e5ff"
    bg:             string;   // e.g. "#0d0f12"
    surface:        string;   // e.g. "#1a1d24"
    fontHeading:    string;   // Google Font name e.g. "Space Grotesk"
    fontBody:       string;
    layoutVariant:  'default' | 'minimal' | 'magazine';
  };
  sections: Array<{
    blockId:        string;   // references blocks.id, or built-in key like 'hero'
    visible:        boolean;
    sortOrder:      number;   // fractional indexing
    customTitle?:   string;   // override the section heading on the public page
  }>;
  hero: {
    showCoverImage: boolean;
    tagline?:       string;
  };
  footer: {
    links: Array<{ label: string; url: string }>;
  };
}
```

**Default `page_config`** (applied on project create):
```json
{
  "theme": {
    "accent": "#00e5ff",
    "bg": "#0d0f12",
    "surface": "#1a1d24",
    "fontHeading": "Syne",
    "fontBody": "Space Mono",
    "layoutVariant": "default"
  },
  "sections": [],
  "hero": { "showCoverImage": true },
  "footer": { "links": [] }
}
```

---

## 3. Table: `blocks`

```typescript
export const blocks = sqliteTable('blocks', {
  id:              text('id').primaryKey(),
  project_id:      text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type:            text('type').notNull(),
  sort_order:      real('sort_order').notNull(),    // fractional index for ordering
  grid_col:        integer('grid_col').default(0), // 0-based column in grid layout
  grid_col_span:   integer('grid_col_span').default(1), // 1 = half width, 2 = full width
  visible_on_page: integer('visible_on_page').notNull().default(1), // boolean 0|1
  data:            text('data').notNull(),          // JSON: block-type-specific payload
  created_at:      integer('created_at').notNull(),
  updated_at:      integer('updated_at').notNull(),
});
```

### Grid Layout Model
The canvas uses a **2-column grid** by default. Each block has:
- `grid_col`: which column (0 or 1). Full-width blocks: col=0, span=2.
- `grid_col_span`: 1 (half) or 2 (full width).
- `sort_order`: fractional index within the overall block list. dnd-kit updates these on drop.

---

## 4. Block Type Registry

### `how_it_works`
```typescript
interface HowItWorksData {
  body: string;   // HTML from Tiptap rich text editor
}
```
Public page: Rendered as a section with a left accent bar.

---

### `bom` (Bill of Materials)
```typescript
interface BomData {
  items: Array<{
    item:   string;
    detail: string;
    qty:    number;
    cost?:  string;   // e.g. "€12.50"
  }>;
}
```
Public page: Styled `<table>` with monospace cells. Sortable columns via JS.

---

### `build_guide`
```typescript
interface BuildGuideData {
  steps: Array<{
    id:            string;    // ULID for stable key
    title:         string;
    body:          string;    // HTML from Tiptap
    img_asset_id?: string;    // optional image per step
  }>;
}
```
Public page: Numbered `<ol>` with collapsible steps. Click to expand body + image.

---

### `case_study`
```typescript
interface CaseStudyData {
  mode:   'free' | 'structured';
  // free mode:
  paragraphs?: string[];           // HTML strings
  // structured mode:
  challenge?:  string;             // HTML
  approach?:   string;             // HTML
  outcome?:    string;             // HTML
}
```
Public page: Prose section. Structured mode renders with sub-headings Challenge / Approach / Outcome.

---

### `image_gallery`
```typescript
interface ImageGalleryData {
  asset_ids:    string[];         // ordered list of asset IDs
  captions:     Record<string, string>;  // assetId → caption string
  layout:       'grid' | 'carousel' | 'fullwidth';
}
```
Public page: CSS grid of thumbnails. Click → lightbox modal with inline JS.

---

### `markdown`
```typescript
interface MarkdownData {
  raw:       string;    // raw markdown source
  filename?: string;    // original filename if imported from .md file
  frontmatter?: Record<string, unknown>;  // parsed from YAML frontmatter
}
```
Public page: Rendered via marked.js → sanitised HTML. Styled with typography CSS class.
Canvas: Split pane — CodeMirror editor (left) + rendered preview (right).

---

### `link`
```typescript
interface LinkData {
  url:          string;
  label:        string;
  description?: string;
  favicon?:     string;   // data URI of fetched favicon
}
```
Public page: Styled link card. Opens in new tab.

---

### `text`
```typescript
interface TextData {
  html: string;   // HTML from Tiptap (headings, bold, italic, lists, links)
}
```
Public page: Rendered as prose block.

---

### `spec_table`
```typescript
interface SpecTableData {
  headers: string[];
  rows:    string[][];
}
```
Public page: Responsive `<table>` with sticky header.

---

### `embed`
```typescript
interface EmbedData {
  url:  string;
  type: 'youtube' | 'pdf' | 'figma' | 'generic';
}
```
Public page: `<iframe>` with aspect-ratio container. YouTube: converted to embed URL.

---

### `note` *(workspace only — never on public page)*
```typescript
interface NoteData {
  body:   string;
  colour: 'yellow' | 'blue' | 'red' | 'green';
}
```

---

### `todo` *(workspace only)*
```typescript
interface TodoData {
  items: Array<{ id: string; done: boolean; label: string }>;
}
```

---

## 5. Table: `assets`

```typescript
export const assets = sqliteTable('assets', {
  id:           text('id').primaryKey(),
  project_id:   text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  filename:     text('filename').notNull(),        // original filename
  stored_path:  text('stored_path').notNull(),     // relative path inside project assets/
  mime_type:    text('mime_type').notNull(),
  size_bytes:   integer('size_bytes').notNull(),
  tags:         text('tags'),                      // JSON: string[] e.g. ["render","cad","photo"]
  created_at:   integer('created_at').notNull(),
});
```

Asset files are physically stored at:
`{appDataDir}/projects/{projectId}/assets/{assetId}-{filename}`

The `stored_path` column holds the full absolute path at import time. On export, `asset-manager.getDataURI(id)` reads the file and returns a base64 data URI.

---

## 6. TypeScript Shared Types (Preload Bridge)

These types live in `src/preload/types.ts` and are imported by both the preload script and the renderer.

```typescript
export interface Project {
  id:             string;
  name:           string;
  slug:           string;
  type:           'hero' | 'build' | 'design' | 'concept';
  subtitle:       string | null;
  core_value:     string | null;
  status:         'active' | 'archived' | 'draft';
  page_config:    PublicPageConfig;
  cover_asset_id: string | null;
  created_at:     number;
  updated_at:     number;
}

export interface Block<T = unknown> {
  id:              string;
  project_id:      string;
  type:            BlockType;
  sort_order:      number;
  grid_col:        number;
  grid_col_span:   number;
  visible_on_page: boolean;
  data:            T;
  created_at:      number;
  updated_at:      number;
}

export type BlockType =
  | 'how_it_works' | 'bom' | 'build_guide' | 'case_study'
  | 'image_gallery' | 'markdown' | 'link' | 'text'
  | 'spec_table' | 'embed' | 'note' | 'todo';

export interface Asset {
  id:          string;
  project_id:  string;
  filename:    string;
  stored_path: string;
  mime_type:   string;
  size_bytes:  number;
  tags:        string[];
  created_at:  number;
}
```

---

## 7. Database Initialisation & Migrations

On app startup, the main process runs:
1. Open `lab.db` with `better-sqlite3`
2. Enable WAL mode: `db.pragma('journal_mode = WAL')`
3. Run Drizzle migrations via `drizzle-kit migrate`
4. Seed default data if DB is brand new

Migrations are generated with `drizzle-kit generate` and stored in `src/main/db/migrations/`. They are bundled into the app and run automatically.
