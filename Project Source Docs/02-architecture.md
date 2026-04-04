# LAB — Technical Architecture Specification
**DOC-02 · ARCH · Revision 0.2**

---

## 1. Stack Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| App shell | Electron 32 + electron-vite | Cross-platform desktop; hot-reload dev; context isolation |
| UI framework | React 18 + TypeScript | Component model suits block editor; strong ecosystem |
| State management | Zustand 5 | Lightweight, no boilerplate; already used in FlowState & SYNAPSE |
| Drag and drop | dnd-kit (@dnd-kit/core + @dnd-kit/sortable) | Best modern React DnD; accessible; works with grid layouts |
| Database | SQLite via better-sqlite3 | Local-first; single-file DB; synchronous API simplifies Electron main process |
| ORM | Drizzle ORM | Type-safe; lightweight; great TS inference; no magic |
| Markdown rendering | marked.js + DOMPurify | Fast; extensible; sanitised output safe for innerHTML |
| Markdown editing | CodeMirror 6 | Syntax-highlighted .md editor pane in the markdown block |
| Styling | CSS Modules + CSS custom properties | Scoped styles; theme vars shared with public page renderer |
| Rich text (text blocks) | Tiptap (headless) | Headless; extensible; outputs HTML or JSON; no vendor lock-in |
| Public page render | Template literal renderer (custom) | No external dep; pure string generation in main process |
| Git (P2) | isomorphic-git | Pure JS; no system Git binary dependency |
| Build tooling | electron-vite + Vite 5 | Fast HMR; shared config for main/renderer/preload |

---

## 2. Process Architecture

Electron enforces a strict two-process model. All privileged operations (filesystem, database, Git) run in **Main**. The UI runs in a sandboxed **Renderer** (Chromium/React). They communicate exclusively through a typed IPC bridge exposed via a **Preload** script using `contextBridge`.

```
┌─────────────────────────────────────────┐
│           RENDERER PROCESS              │
│  React 18 + TypeScript + Zustand        │
│  dnd-kit · Tiptap · marked.js           │
│  CSS Modules                            │
└──────────────┬──────────────────────────┘
               │ contextBridge (typed API)
┌──────────────▼──────────────────────────┐
│           PRELOAD SCRIPT                │
│  window.lab = { project, block, asset,  │
│                 page, git }             │
└──────────────┬──────────────────────────┘
               │ ipcRenderer.invoke / ipcMain.handle
┌──────────────▼──────────────────────────┐
│             MAIN PROCESS                │
│  Node.js · better-sqlite3 · Drizzle     │
│  fs (asset management)                  │
│  isomorphic-git (P2)                    │
└─────────────────────────────────────────┘
```

**Security rules:**
- `nodeIntegration: false` on all BrowserWindows
- `contextIsolation: true` always
- `sandbox: true` on renderer
- No `remote` module usage

---

## 3. IPC Channel Surface

All channels use `ipcRenderer.invoke` (request/response pattern). No fire-and-forget channels except `page:preview-update` which pushes from main to renderer.

### 3.1 Project Channels

| Channel | Input | Output |
|---------|-------|--------|
| `project:list` | `void` | `Project[]` |
| `project:get` | `id: string` | `Project` |
| `project:create` | `{ name, type }` | `Project` |
| `project:update` | `Partial<Project> & { id }` | `Project` |
| `project:delete` | `id: string` | `{ ok: boolean }` |

### 3.2 Block Channels

| Channel | Input | Output |
|---------|-------|--------|
| `block:list` | `projectId: string` | `Block[]` |
| `block:upsert` | `Block` | `Block` |
| `block:delete` | `id: string` | `{ ok: boolean }` |
| `block:reorder` | `{ projectId, orderedIds: string[] }` | `{ ok: boolean }` |

### 3.3 Asset Channels

| Channel | Input | Output |
|---------|-------|--------|
| `asset:import` | `{ projectId, srcPath }` | `Asset` |
| `asset:list` | `projectId: string` | `Asset[]` |
| `asset:delete` | `id: string` | `{ ok: boolean }` |
| `asset:get-data-uri` | `id: string` | `string` (data URI) |

### 3.4 Page Channels

| Channel | Input | Output |
|---------|-------|--------|
| `page:render` | `projectId: string` | `htmlString: string` |
| `page:export-html` | `{ projectId, outputPath }` | `{ ok: boolean }` |
| `page:export-zip` | `{ projectId, outputPath }` | `{ ok: boolean }` |

### 3.5 Git Channels (P2)

| Channel | Input | Output |
|---------|-------|--------|
| `git:init` | `projectId: string` | `{ ok: boolean }` |
| `git:commit` | `{ projectId, message? }` | `{ hash: string }` |
| `git:log` | `projectId: string` | `Commit[]` |
| `git:push` | `projectId: string` | `{ ok: boolean }` |
| `git:restore` | `{ projectId, hash }` | `{ ok: boolean }` |

---

## 4. Directory Structure

```
~/Library/Application Support/lab/          # macOS
  lab.db                                     # Global SQLite database
  projects/
    {projectId}/
      assets/                                # Imported files, copied here
        {assetId}-{filename}
      exports/                               # Last export outputs
        index.html
      .git/                                  # Per-project Git repo (P2)
  config.json                                # App preferences
```

```
# Source tree (development)
src/
  main/
    index.ts                 # Main process entry
    ipc/
      project.ts             # IPC handlers for project:*
      block.ts               # IPC handlers for block:*
      asset.ts               # IPC handlers for asset:*
      page.ts                # IPC handlers for page:*
      git.ts                 # IPC handlers for git:* (P2)
    db/
      schema.ts              # Drizzle schema definitions
      migrations/            # Drizzle migration files
      queries/
        projects.ts
        blocks.ts
        assets.ts
    renderer/
      page-renderer.ts       # Project data → HTML string
      block-renderers/       # One file per block type
        bom.ts
        build-guide.ts
        markdown.ts
        # etc.
    assets/
      asset-manager.ts       # Copy, delete, get-data-uri
  preload/
    index.ts                 # contextBridge definitions
    types.ts                 # Shared IPC types (imported by renderer too)
  renderer/
    main.tsx                 # React entry
    App.tsx
    routes/
      Dashboard.tsx
      Workspace.tsx
      PageCustomiser.tsx
    components/
      canvas/
        Canvas.tsx
        BlockWrapper.tsx
        GridCell.tsx
        BlockPicker.tsx
      blocks/
        BomBlock.tsx
        BuildGuideBlock.tsx
        MarkdownBlock.tsx
        ImageGalleryBlock.tsx
        # etc.
      sidebar/
        AssetLibrary.tsx
        BlockNavigator.tsx
      preview/
        PublicPagePreview.tsx
      ui/                    # Shared design system components
        Button.tsx
        Input.tsx
        Badge.tsx
        # etc.
    stores/
      projectStore.ts
      blockStore.ts
      assetStore.ts
      uiStore.ts
    styles/
      tokens.css             # CSS custom properties (design tokens)
      reset.css
```

---

## 5. State Management (Zustand Stores)

### 5.1 `projectStore`
```typescript
interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  // Actions
  loadProjects: () => Promise<void>;
  setActiveProject: (id: string) => void;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}
```

### 5.2 `blockStore`
```typescript
interface BlockStore {
  blocks: Block[];           // all blocks for active project
  activeBlockId: string | null;
  // Actions
  loadBlocks: (projectId: string) => Promise<void>;
  upsertBlock: (block: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  reorderBlocks: (orderedIds: string[]) => Promise<void>;
  setActiveBlock: (id: string | null) => void;
}
```

### 5.3 `uiStore`
```typescript
interface UiStore {
  previewVisible: boolean;
  sidebarTab: 'assets' | 'navigator';
  blockPickerOpen: boolean;
  insertAfterBlockId: string | null;
  // Actions
  togglePreview: () => void;
  openBlockPicker: (afterBlockId?: string) => void;
  closeBlockPicker: () => void;
}
```

---

## 6. Renderer Entry & Routing

```typescript
// src/renderer/App.tsx
// Routes (using react-router-dom v6 with memory router — no URL bar in Electron)

/                           → <Dashboard />         (projects grid)
/project/:id                → <Workspace />          (canvas + preview)
/project/:id/customise      → <PageCustomiser />     (public page editor)
```

---

## 7. Public Page Renderer (Main Process)

The renderer is a pure function: `renderProject(projectId: string): Promise<string>`.

Steps:
1. Fetch project row from DB
2. Fetch all blocks where `visible_on_page = 1`, ordered by `page_config.sections` order
3. For each block, call the matching block renderer function → returns HTML partial string
4. For image assets, call `assetManager.getDataURI(assetId)` → embeds as base64
5. Inject all partials into the shell template string
6. Inject CSS variables from `project.page_config.theme`
7. Return complete HTML string

The shell template is a TypeScript template literal in `src/main/renderer/page-renderer.ts`. No external templating engine.

---

## 8. Key Dependencies (package.json sketch)

```json
{
  "dependencies": {
    "electron": "^32.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "zustand": "^5.0.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.0",
    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.33.0",
    "marked": "^14.0.0",
    "dompurify": "^3.1.0",
    "@codemirror/lang-markdown": "^6.3.0",
    "@tiptap/react": "^2.7.0",
    "@tiptap/starter-kit": "^2.7.0",
    "isomorphic-git": "^1.27.0"
  },
  "devDependencies": {
    "electron-vite": "^2.3.0",
    "vite": "^5.4.0",
    "typescript": "^5.5.0",
    "drizzle-kit": "^0.24.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/dompurify": "^3.0.0"
  }
}
```
