# LAB — Component Library Specification
**DOC-07 · COMPONENTS · Revision 0.2**
All components are React functional components with TypeScript. CSS Modules for styling.

---

## 1. Component Tree

```
App
├── TitleBar
├── Router
│   ├── Dashboard (route: /)
│   │   ├── FilterBar
│   │   └── ProjectGrid
│   │       └── ProjectCard (×n)
│   │
│   ├── Workspace (route: /project/:id)
│   │   ├── WorkspaceSidebar
│   │   │   ├── SidebarTabBar
│   │   │   ├── AssetLibrary (tab)
│   │   │   │   ├── AssetFilter
│   │   │   │   └── AssetItem (×n)
│   │   │   └── BlockNavigator (tab)
│   │   │       └── NavBlockItem (×n)
│   │   ├── Canvas
│   │   │   ├── DndContext (dnd-kit)
│   │   │   │   └── SortableContext
│   │   │   │       └── BlockWrapper (×n)  ← SortableItem
│   │   │   │           ├── BlockToolbar
│   │   │   │           └── [BlockEditor component]
│   │   │   └── AddBlockButton
│   │   └── PublicPagePreview
│   │       └── <iframe srcdoc>
│   │
│   └── PageCustomiser (route: /project/:id/customise)
│       ├── SectionsPanel
│       │   ├── SectionItem (×n, draggable)
│       │   └── ThemePanel
│       └── PreviewFrame
│           └── <iframe srcdoc>
│
└── GlobalOverlays
    ├── BlockPickerModal
    ├── ToastStack
    └── ConfirmDialog
```

---

## 2. Shared UI Components (`src/renderer/components/ui/`)

### `<Button>`
```typescript
interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  size?:    'sm' | 'md' | 'lg';
  icon?:    React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?:  () => void;
  children:  React.ReactNode;
}
```

### `<Badge>`
```typescript
interface BadgeProps {
  type: 'hero' | 'build' | 'design' | 'concept';
}
// Renders: <span class={styles[type]}>HERO</span>
```

### `<Input>` / `<Textarea>`
```typescript
interface InputProps {
  label?:       string;
  placeholder?: string;
  value:        string;
  onChange:     (v: string) => void;
  mono?:        boolean;    // use --lab-font-mono
  error?:       string;
}
```

### `<Toast>`
```typescript
interface ToastProps {
  message:  string;
  type:     'success' | 'error' | 'info';
  action?:  { label: string; onClick: () => void };  // e.g. "Undo"
  duration?: number;   // ms, default 4000
}
```

### `<ConfirmDialog>`
```typescript
interface ConfirmDialogProps {
  title:      string;
  body?:      string;
  confirmLabel: string;
  onConfirm:  () => void;
  onCancel:   () => void;
  dangerous?: boolean;   // makes confirm button red
}
```

---

## 3. TitleBar

```typescript
// src/renderer/components/TitleBar.tsx
interface TitleBarProps {
  project?: Project;   // null on dashboard
  view?:    'workspace' | 'customise';
}
```

**Renders (on workspace):**
```
[  ← Back  ]  [ FDL-8 Flash Pocket ]  [ Workspace · Customise ]
                                        [ ▲ Export ▾ ]  [● Saved]
```

- Back button: navigate to `/`
- Project name: inline-editable (click → `<input>`, blur → save)
- Workspace / Customise: tab switcher (highlighted based on current route)
- Export button: dropdown (Export HTML / Export ZIP)
- Save indicator: shows "Saving…" during IPC call, "● Saved" after

**On macOS:** Respect the traffic light buttons area — add `padding-left: 80px` on the title bar, use `-webkit-app-region: drag` on the bar background, and `no-drag` on interactive elements.

---

## 4. ProjectCard

```typescript
interface ProjectCardProps {
  project: Project;
  onOpen:    () => void;
  onRename:  () => void;
  onArchive: () => void;
  onDelete:  () => void;
}
```

**Structure:**
```html
<div class="card" onClick={onOpen}>
  <div class="card-image">
    {coverAsset ? <img src={coverDataUri}> : <div class="placeholder">{project.type.toUpperCase()}</div>}
  </div>
  <div class="card-content">
    <Badge type={project.type} />
    <h3>{project.name}</h3>
    <p>{project.subtitle}</p>
    <div class="card-footer">
      <span class="timestamp">Updated {relativeTime(project.updated_at)}</span>
      <OverflowMenu items={[Rename, Archive, Delete]} />
    </div>
  </div>
</div>
```

---

## 5. Canvas

```typescript
// src/renderer/components/canvas/Canvas.tsx
interface CanvasProps {
  projectId: string;
}
```

**Responsibilities:**
- Reads `blocks` from `blockStore`
- Sets up `DndContext` with `PointerSensor` (drag threshold: 8px to avoid accidental drags during clicks) and `KeyboardSensor`
- Uses `rectSortingStrategy` from `@dnd-kit/sortable` for 2D grid
- On `onDragEnd`: computes new sort orders, calls `blockStore.reorderBlocks()`
- Renders `<BlockWrapper>` for each block
- Renders `<AddBlockButton>` at the end of the list

**Grid implementation:**
```tsx
<div className={styles.grid}>
  {blocks.map(block => (
    <SortableBlockWrapper
      key={block.id}
      block={block}
      style={{ gridColumn: block.grid_col_span === 2 ? 'span 2' : 'span 1' }}
    />
  ))}
  <AddBlockButton onClick={() => uiStore.openBlockPicker()} />
</div>
```

---

## 6. BlockWrapper

```typescript
// src/renderer/components/canvas/BlockWrapper.tsx
interface BlockWrapperProps {
  block: Block;
}
```

This is a `useSortable` wrapper from dnd-kit. It:
- Provides drag handle ref
- Applies `transform` and `transition` styles during drag
- Renders `<BlockToolbar>` (visible on hover via CSS + `data-focused` state)
- Renders the correct `<XxxBlock>` component based on `block.type`

```tsx
const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
  useSortable({ id: block.id });

return (
  <div
    ref={setNodeRef}
    style={{ transform: CSS.Transform.toString(transform), transition }}
    className={clsx(styles.wrapper, isDragging && styles.dragging)}
    data-block-id={block.id}
  >
    <BlockToolbar block={block} dragHandleProps={{ ...attributes, ...listeners }} />
    <BlockEditorRouter block={block} />
  </div>
);
```

---

## 7. BlockEditorRouter

Maps `block.type` to the correct editor component:

```typescript
// src/renderer/components/blocks/BlockEditorRouter.tsx
const BLOCK_EDITORS: Record<BlockType, React.ComponentType<{ block: Block }>> = {
  bom:          BomBlock,
  build_guide:  BuildGuideBlock,
  case_study:   CaseStudyBlock,
  how_it_works: HowItWorksBlock,
  image_gallery:ImageGalleryBlock,
  markdown:     MarkdownBlock,
  link:         LinkBlock,
  text:         TextBlock,
  spec_table:   SpecTableBlock,
  embed:        EmbedBlock,
  note:         NoteBlock,
  todo:         TodoBlock,
};

export function BlockEditorRouter({ block }: { block: Block }) {
  const Editor = BLOCK_EDITORS[block.type];
  return <Editor block={block} />;
}
```

---

## 8. BomBlock

```typescript
// src/renderer/components/blocks/BomBlock.tsx
interface BomRow { id: string; item: string; detail: string; qty: number; cost: string; }
```

**State:** Local `rows: BomRow[]` state. Synced to `blockStore` on blur (not every keystroke).

**Keyboard behaviour:**
- `Tab` from last cell of a row → move to first cell of next row
- `Tab` from last cell of last row → add new row
- `Enter` in any cell → add row below
- `Backspace` on empty row with one cell focused → delete row (with undo toast)

**Row drag-reorder:** Nested dnd-kit `SortableContext` (separate from the canvas-level context). Use `verticalListSortingStrategy`.

**Import CSV:** `<input type="file" accept=".csv">` → parse with `papaparse` → map columns → populate rows. Show a "Map columns" modal if headers don't match expected names.

---

## 9. MarkdownBlock

```typescript
// src/renderer/components/blocks/MarkdownBlock.tsx
```

**State:**
- `raw: string` — the markdown content (from block.data.raw)
- `viewMode: 'split' | 'preview' | 'raw'` — local UI state

**Layout:**
```tsx
<div className={styles.markdownBlock}>
  <div className={styles.toolbar}>
    <span>{data.frontmatter?.title ?? data.filename ?? 'Markdown'}</span>
    <SegmentedControl
      options={['Split', 'Preview', 'Raw']}
      value={viewMode}
      onChange={setViewMode}
    />
    <Button size="sm" onClick={handleImport}>Import .md</Button>
  </div>
  <div className={styles.content} data-mode={viewMode}>
    {(viewMode === 'split' || viewMode === 'raw') && (
      <CodeMirrorEditor value={raw} onChange={handleChange} />
    )}
    {(viewMode === 'split' || viewMode === 'preview') && (
      <div
        className={styles.preview}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    )}
  </div>
</div>
```

`renderedHtml` is computed via `useMemo(() => renderMarkdown(raw), [raw])` — the `renderMarkdown` function is the same one used in the main process renderer, but re-exported for use in the renderer process too (keep it in a shared utility that works in both environments).

---

## 10. PublicPagePreview

```typescript
// src/renderer/components/preview/PublicPagePreview.tsx
```

**State:**
- `html: string` — the last-rendered HTML
- `isRefreshing: boolean` — shows a subtle loading indicator

**Behaviour:**
1. On mount: call `window.lab.page.render(projectId)` → set `html`
2. Subscribe to `blockStore` changes via Zustand — on any change, debounce 1s → re-render
3. Render as `<iframe srcdoc={html} sandbox="allow-scripts allow-same-origin" />`
4. Listen for `message` events from iframe → `LAB_FOCUS_BLOCK` → `blockStore.setActiveBlock()`

```tsx
<div className={styles.previewPanel}>
  <div className={styles.previewHeader}>
    <span>Public Page</span>
    <Button size="sm" icon={<RefreshIcon />} onClick={handleManualRefresh} />
    <Button size="sm" onClick={() => navigate(`/project/${projectId}/customise`)}>
      Customise
    </Button>
  </div>
  <iframe
    ref={iframeRef}
    srcDoc={html}
    sandbox="allow-scripts allow-same-origin"
    className={styles.iframe}
    title="Public page preview"
  />
  {isRefreshing && <div className={styles.refreshOverlay} />}
</div>
```

---

## 11. BlockPickerModal

Triggered by `uiStore.blockPickerOpen`.

**Structure:**
- Search input at top (filters block types by name)
- Categorised grid: Structured / Media & Content / Workspace Only
- Keyboard navigable (arrow keys + Enter)
- `Escape` to close

On select: calls `blockStore.upsertBlock({ project_id, type, data: defaultData[type], sort_order: computedOrder })`.

---

## 12. Component Styling Conventions

1. One CSS Module per component: `ComponentName.module.css`
2. Use CSS custom properties from `tokens.css` — never hardcode colours
3. Class names: camelCase in module, semantic names (`wrapper`, `header`, `content`)
4. Hover/focus states: always defined
5. No `!important`
6. Animation: use CSS `transition` for simple state changes; no JS animation libraries in components
7. Responsive: canvas reflows to 1 column below 700px canvas width (not viewport — the panel is resizable)
