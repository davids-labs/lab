# LAB — Implementation Roadmap
**DOC-08 · ROADMAP · Revision 0.2**
Phased build plan. Each phase is independently shippable and testable.

---

## Overview

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
Shell      Data      Canvas    Blocks    Public    Polish
& Setup    Layer     + DnD     Deep      Page      + Export
(1-2d)    (1-2d)    (2-3d)    (3-5d)   (2-3d)    (1-2d)
```

Total estimated: **10–17 days** of focused work.

---

## Phase 1: Project Shell & Setup

**Goal:** Electron app launches, shows a window, routing works, dev tooling is fast.

### Tasks

- [ ] `npm create electron-vite@latest lab -- --template react-ts`
- [ ] Configure `electron-vite` for main / preload / renderer split
- [ ] Set up TypeScript strict mode
- [ ] Create `src/preload/types.ts` with all shared interface definitions (Project, Block, Asset)
- [ ] Set up `contextBridge` in preload with stub implementations
- [ ] Set up React Router (MemoryRouter) with three routes: `/`, `/project/:id`, `/project/:id/customise`
- [ ] Create stub route components (Dashboard, Workspace, PageCustomiser)
- [ ] Import `tokens.css` as global style
- [ ] Implement `TitleBar` component (macOS traffic light padding, drag region)
- [ ] Implement `Button`, `Badge`, `Input` UI components
- [ ] Configure ESLint + Prettier

**Done when:** `npm run dev` launches the app, three routes are navigable, design tokens are applied.

---

## Phase 2: Data Layer

**Goal:** SQLite database initialises, projects can be created and listed via IPC.

### Tasks

- [ ] Install `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `ulidx`
- [ ] Write Drizzle schema (`src/main/db/schema.ts`) — projects, blocks, assets tables
- [ ] Run `drizzle-kit generate` → create initial migration
- [ ] Implement `DatabaseService` class (singleton, opens `lab.db`, runs migrations on startup)
- [ ] Implement `project:list`, `project:get`, `project:create`, `project:update`, `project:delete` IPC handlers
- [ ] Wire up preload bridge for project channels
- [ ] Implement `projectStore` (Zustand) in renderer
- [ ] Build `Dashboard` view: fetch projects on mount, render `ProjectCard` grid
- [ ] Build `ProjectCard` component with overflow menu
- [ ] Build "New Project" modal (name + type selector)
- [ ] Implement project deletion with confirmation dialog
- [ ] Set up `AppDataDir` helper (platform-aware path to userData)
- [ ] Create project folder on project creation (`projects/{id}/assets/`)

**Done when:** Projects can be created, listed, renamed, and deleted. Data persists across app restarts.

---

## Phase 3: Canvas Foundation + Drag-and-Drop

**Goal:** Workspace opens for a project; blocks can be created, displayed, and reordered via drag and drop.

### Tasks

- [ ] Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [ ] Implement `block:list`, `block:upsert`, `block:delete`, `block:reorder` IPC handlers
- [ ] Implement `blockStore` (Zustand)
- [ ] Build `Workspace` route: three-panel layout (sidebar + canvas + preview)
- [ ] Build `WorkspaceSidebar` with tab bar (Assets / Navigator placeholders)
- [ ] Build `Canvas` component with dnd-kit `DndContext` + `SortableContext`
- [ ] Build `BlockWrapper` with `useSortable`, drag handle, `BlockToolbar` (hover state)
- [ ] Build `BlockEditorRouter` (stub: renders `<div>block.type</div>` for each type)
- [ ] Build `AddBlockButton` and `BlockPickerModal` (all types listed, creates empty block)
- [ ] Implement `BlockToolbar` actions: toggle visibility, delete (with undo toast), span toggle
- [ ] Implement `ToastStack` component (portal-rendered)
- [ ] Implement fractional sort order update on `onDragEnd`
- [ ] Implement `BlockNavigator` tab (tree view, click to scroll canvas to block)

**Done when:** Blocks can be added via the picker, dragged to reorder in a 2-column grid, toggled visible/hidden, and deleted with undo.

---

## Phase 4: Block Editors (Deep)

**Goal:** Every block type has a functional editor. Core structured blocks are production-quality.

### Priority order:

**P1 blocks (build these first):**
- [ ] `text` — Tiptap editor (bold, italic, h2/h3, lists, links). Install `@tiptap/react`, `@tiptap/starter-kit`
- [ ] `bom` — Inline table with Tab/Enter keyboard nav, row drag-reorder, CSV import
- [ ] `build_guide` — Step list with Tiptap per-step, image attachment per step, step drag-reorder
- [ ] `markdown` — CodeMirror 6 editor + marked preview split pane, Import .md button
- [ ] `image_gallery` — Asset drag-drop, thumbnail grid, caption per image, layout toggle
- [ ] `how_it_works` — Tiptap (same as text block but with accent bar styling)
- [ ] `case_study` — Mode toggle (free / structured), Tiptap per section

**P2 blocks (add these next):**
- [ ] `link` — URL input, label, description, favicon fetch
- [ ] `spec_table` — Custom headers + rows, same cell keyboard nav as BOM
- [ ] `embed` — URL input, type auto-detect, iframe preview
- [ ] `note` — Simple textarea, colour picker
- [ ] `todo` — Checkbox list, inline edit, keyboard add/delete

**Asset library (needed for image_gallery + build_guide steps):**
- [ ] Implement `asset:import`, `asset:list`, `asset:delete`, `asset:get-data-uri` IPC handlers
- [ ] Build `AssetLibrary` sidebar tab: thumbnails, filter (Images/Files), drag-to-canvas

**Done when:** All P1 blocks work end-to-end. Data persists. Images can be imported and attached to blocks.

---

## Phase 5: Public Page

**Goal:** Public page preview works; exported HTML opens correctly in a browser.

### Tasks

- [ ] Write `BASE_CSS` stylesheet for all block types (dark, default layout variant)
- [ ] Write `INTERACTIVE_JS` bundle (lightbox, collapsible steps, table sort)
- [ ] Implement all block renderer functions (`src/main/renderer/block-renderers/`)
- [ ] Implement `buildShell()` function
- [ ] Implement `renderProject()` orchestrator
- [ ] Implement `page:render` IPC handler
- [ ] Build `PublicPagePreview` component (iframe + message listener for click-to-edit)
- [ ] Wire click-to-edit: click in preview → `LAB_FOCUS_BLOCK` message → canvas scrolls to block
- [ ] Implement `page:export-html` IPC handler (base64 assets, write file)
- [ ] Install `archiver`; implement `page:export-zip` handler
- [ ] Wire Export HTML / Export ZIP to TitleBar dropdown
- [ ] Test export: open in Chrome — verify no broken images, interactive JS works

**Done when:** Live preview renders all block types. Exported HTML works offline in a browser.

---

## Phase 6: Page Customiser + Polish

**Goal:** Page customiser works; app is ready for real use.

### Tasks

- [ ] Build `PageCustomiser` route: sections panel (DnD reorder, visibility toggle, custom title) + theme panel
- [ ] Implement theme panel: accent colour picker, layout variant selector, font selector
- [ ] Write `layout-minimal.css` and `layout-magazine.css` variants
- [ ] Wire customiser changes to `project:update` (page_config field)
- [ ] Auto-save: debounce 1s on any block or config change → save + update "● Saved" indicator
- [ ] Persist panel widths in `config.json`
- [ ] Keyboard shortcuts: `Cmd+K` (block picker), `Cmd+S` (force save), `Cmd+P` (toggle preview)
- [ ] Loading states on all async operations
- [ ] Empty states: empty project, empty canvas, no assets
- [ ] App icon + window title
- [ ] Build: `npm run build` → test packaged app on macOS
- [ ] P2: Git sync (see DOC-10)

**Done when:** App is usable end-to-end for a real project. No regressions on packaged build.

---

## File Creation Order (for Copilot)

When implementing with GitHub Copilot Workspace, scaffold files in this order:

```
1. src/preload/types.ts                   ← all shared types first
2. src/main/db/schema.ts                  ← DB schema
3. src/main/db/migrations/               ← generated
4. src/main/ipc/project.ts               ← IPC handlers
5. src/main/index.ts                     ← main entry, register handlers
6. src/preload/index.ts                  ← contextBridge
7. src/renderer/styles/tokens.css        ← design tokens
8. src/renderer/components/ui/           ← shared UI components
9. src/renderer/stores/                  ← Zustand stores
10. src/renderer/routes/Dashboard.tsx
11. src/renderer/routes/Workspace.tsx
12. src/renderer/components/canvas/
13. src/renderer/components/blocks/
14. src/main/renderer/                   ← public page renderer
```
