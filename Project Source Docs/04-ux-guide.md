# LAB — UI/UX Design Guide
**DOC-04 · UX · Revision 0.2**
Design language: Engineering Terminal | Theme: Dark-first

---

## 1. Design Principles

| Principle | Meaning in practice |
|-----------|-------------------|
| **Speed over ceremony** | Every common action (add block, import asset, preview page) is ≤2 clicks from any view |
| **Canvas = your thinking** | The workspace is for you. Blocks, notes, todos — messy is fine |
| **Public page = their experience** | The right panel preview shows exactly what a visitor sees. No surprises |
| **Blocks, not pages** | Every piece of content is independently editable, reorderable, toggleable |
| **What you drag is what you share** | Toggling visibility on a block updates the preview instantly |

---

## 2. Design Tokens (CSS Custom Properties)

Defined in `src/renderer/styles/tokens.css`. These same variables are injected into the public page shell template.

```css
:root {
  /* Backgrounds */
  --lab-bg:           #0d0f12;
  --lab-surface:      #1a1d24;
  --lab-surface-2:    #232730;
  --lab-surface-3:    #2d3240;

  /* Accents */
  --lab-primary:      #00e5ff;
  --lab-primary-dim:  rgba(0, 229, 255, 0.12);
  --lab-hero:         #ff2a6d;
  --lab-build:        #05d5ff;
  --lab-design:       #ffb400;
  --lab-green:        #00ff88;

  /* Text */
  --lab-text:         #e2e8f0;
  --lab-text-muted:   #94a3b8;
  --lab-text-faint:   #475569;

  /* Borders */
  --lab-border:       #334155;
  --lab-border-2:     #1e2533;

  /* Typography */
  --lab-font-sans:    'Syne', -apple-system, BlinkMacSystemFont, sans-serif;
  --lab-font-mono:    'Space Mono', 'SFMono-Regular', Consolas, monospace;

  /* Spacing scale */
  --lab-space-1:  4px;
  --lab-space-2:  8px;
  --lab-space-3:  12px;
  --lab-space-4:  16px;
  --lab-space-5:  20px;
  --lab-space-6:  24px;
  --lab-space-8:  32px;
  --lab-space-10: 40px;

  /* Border radius */
  --lab-radius-sm: 4px;
  --lab-radius:    8px;
  --lab-radius-lg: 12px;
  --lab-radius-xl: 16px;

  /* Transition */
  --lab-transition: 0.18s ease;
}
```

---

## 3. Application Shell

```
┌─────────────────────────────────────────────────────────────────┐
│  TITLEBAR  [← Back]  [Project Name]  [Workspace | Customise]   │  h: 44px
│            [▲ Export]  [⎇ Push (P2)]  [● Auto-saved]           │  bg: --lab-surface
├──────────┬────────────────────────────────┬────────────────────┤
│          │                                │                    │
│ SIDEBAR  │        CANVAS                  │  PUBLIC PREVIEW    │
│ 220px    │        flex-1                  │  360px (resizable) │
│          │                                │                    │
│ [Assets] │  ┌──────────┐ ┌──────────┐    │  ┌──────────────┐  │
│ [Nav]    │  │  Block A │ │  Block B │    │  │              │  │
│          │  └──────────┘ └──────────┘    │  │  <iframe>    │  │
│          │  ┌─────────────────────────┐  │  │  live page   │  │
│          │  │      Block C (full)     │  │  │              │  │
│          │  └─────────────────────────┘  │  └──────────────┘  │
│          │  [+ Add block]                │                    │
└──────────┴────────────────────────────────┴────────────────────┘
         STATUS BAR: "3 blocks · 2 visible · Last saved 2s ago"   h: 28px
```

**Panel behaviour:**
- Left sidebar: collapsible to icon rail (48px) via toggle button
- Right preview: collapsible; can be detached to second window (Window menu item)
- All panel widths: persisted in `config.json` via electron-store

---

## 4. Dashboard View (`/`)

```
HEADER
  "LAB" wordmark (top-left)
  [+ New Project] button (top-right)

FILTER BAR
  [ALL] [HERO] [BUILD] [DESIGN] [CONCEPT] — pill buttons, sticky

PROJECT GRID
  Auto-fill grid, min card width 320px
  Each card:
    ┌────────────────────────┐
    │  Cover image / bg      │  200px, gradient fallback
    ├────────────────────────┤
    │  [HERO badge]          │
    │  Project Name          │  font-sans, 600, 1.2rem
    │  Subtitle              │  font-mono, muted, 0.85rem
    │  ────────────────────  │
    │  Updated 2h ago  [···] │  overflow menu: Rename/Archive/Delete
    └────────────────────────┘
  Hover: translateY(-4px), border-color → --lab-primary
  Click: navigate to /project/:id
```

---

## 5. Workspace Canvas — Grid Drag and Drop

### 5.1 Grid Model
The canvas renders blocks in a **2-column CSS grid**. Each block occupies 1 or 2 columns (`grid_col_span`). The `sort_order` fractional index determines vertical position.

```css
.canvas-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 24px;
}
.block-wrapper[data-span="2"] {
  grid-column: span 2;
}
```

### 5.2 dnd-kit Integration

Use `@dnd-kit/sortable` with a custom `SortableContext` covering all blocks.

```typescript
// Canvas.tsx (outline)
<DndContext
  sensors={sensors}              // PointerSensor + KeyboardSensor
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={blockIds}
    strategy={rectSortingStrategy}   // 2D grid-aware strategy
  >
    {blocks.map(block => (
      <SortableBlockWrapper key={block.id} block={block} />
    ))}
  </SortableContext>
</DndContext>
```

On `onDragEnd`:
1. Compute new `sort_order` values using fractional indexing (`(prev + next) / 2`)
2. Call `blockStore.reorderBlocks(newOrderedIds)` → IPC `block:reorder`
3. Optimistic update in Zustand store (no flicker)

### 5.3 Block Wrapper Anatomy

```
┌─ BlockWrapper ───────────────────────────────────────┐
│  [⠿ drag handle]  [Block type label]  [⊙ visible]   │  toolbar (shown on hover)
│  [↔ span toggle]                      [⋮ delete]     │
├──────────────────────────────────────────────────────┤
│                                                      │
│         <BlockEditor component>                      │
│         (specific to block.type)                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Toolbar visibility:** Only shows on hover or when block is focused. Avoids clutter.

**Span toggle (↔):** Clicking cycles between `grid_col_span: 1` and `grid_col_span: 2`. Updates immediately.

**Visibility toggle (⊙):** Eye icon. Toggling `visible_on_page` triggers a preview re-render (debounced 1s).

**Delete:** Shows confirmation tooltip. Undo available for 5s via toast notification.

---

## 6. Block Picker

Triggered by: clicking the `[+]` hover button that appears between blocks, or via `Cmd+K`.

```
┌─ Block Picker (popover) ─────────────────────────────┐
│  🔍 Search blocks...                                  │
├──────────────────────────────────────────────────────┤
│  STRUCTURED                                          │
│  📋 Bill of Materials    📝 Build Guide               │
│  🔍 How It Works         📖 Case Study                │
│  📊 Spec Table                                       │
│                                                      │
│  MEDIA & CONTENT                                     │
│  🖼️ Image Gallery        📄 Markdown                 │
│  ✏️ Text                  🔗 Link                    │
│  ▶️ Embed                                            │
│                                                      │
│  WORKSPACE ONLY                                      │
│  🗒️ Note                 ✅ Todo                     │
└──────────────────────────────────────────────────────┘
```

Selecting a type: inserts a new block with empty `data` at the correct position, opens it in edit mode immediately.

---

## 7. Block Editor Patterns

### BOM Block
Inline editable table. No separate modal.
```
┌ BOM ────────────────────────────────────────────── [+ Row] [Import CSV] ─┐
│ Item                    Detail              Qty    Cost                   │
├─────────────────────────────────────────────────────────────────────────┤
│ Nordic nRF52840 SoC    BLE 5.3, USB, 64MHz  1    €4.50   [🗑]           │
│ ▸ Tab to next cell · Enter to add row · Drag handle to reorder rows      │
└─────────────────────────────────────────────────────────────────────────┘
```
- `Tab` moves to next cell; wraps to next row
- `Enter` on last row: adds new row
- `Backspace` on empty row: deletes it
- Row drag-reorder via row-level drag handle (separate dnd-kit context)
- "Import CSV" opens file picker → parses CSV → populates rows

### Build Guide Block
```
┌ Build Guide ──────────────────────────────────────── [+ Step] ──────────┐
│  1  [Step title...]                                    [⊞ img] [🗑]      │
│     [Step body — rich text (Tiptap)]                                     │
│                                                                          │
│  2  [Step title...]                                                      │
│     [Step body...]                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```
Steps are reorderable by drag. Each step's body uses Tiptap minimal toolbar (bold, italic, inline code, link).

### Markdown Block
```
┌ Markdown ─────────────────────────────── [Import .md] [Raw | Preview] ──┐
│ ┌──────────────────────┐ ┌──────────────────────────────────────────┐   │
│ │  CodeMirror editor   │ │   Rendered preview (marked.js)          │   │
│ │  (raw markdown)      │ │   with LAB typography styles            │   │
│ └──────────────────────┘ └──────────────────────────────────────────┘   │
│ {frontmatter.title} if present — shown as block subtitle                 │
└─────────────────────────────────────────────────────────────────────────┘
```
Toggle between split view and preview-only (for reading).

---

## 8. Sidebar Tabs

**Assets tab:**
```
┌ Assets ──────────────────── [Import file] ──┐
│  Filter: [All] [Images] [Files] [Links]      │
│                                              │
│  ┌──┐ ┌──┐ ┌──┐  ← image thumbnails         │
│  └──┘ └──┘ └──┘  (drag into canvas)         │
│  filename.png    200KB · Render              │
│  ──────────────────────────────────────      │
│  bom-v2.md       Markdown · 4KB             │
│  link: github.com/...                        │
└──────────────────────────────────────────────┘
```
Assets can be dragged directly onto the canvas → creates the appropriate block type automatically.

**Navigator tab:**
Tree view of all blocks in order. Click → scroll canvas to block. Drag → reorder (same as canvas DnD).

---

## 9. Public Page Customiser (`/project/:id/customise`)

```
┌─ TITLEBAR ──────────────────────────────────────────────────────────────┐

┌─ SECTIONS PANEL (300px) ──┐ ┌─ LIVE PREVIEW ──────────────────────────┐
│  Drag to reorder            │ │                                         │
│                             │ │  Full preview iframe                    │
│  [⊙] Hero Header            │ │                                         │
│  [⊙] How It Works           │ │  (updates as you change things)         │
│  [○] Note (hidden)          │ │                                         │
│  [⊙] Bill of Materials      │ │                                         │
│  [⊙] Build Guide            │ │                                         │
│                             │ │                                         │
│  ─── Theme ─────────────── │ │                                         │
│  Accent: [████] #00e5ff    │ │                                         │
│  Layout: [Default ▾]       │ │                                         │
│  Heading: [Syne ▾]         │ │                                         │
│                             │ │                                         │
│  ─────────────────────────  │ │                                         │
│  [▲ Export HTML]            │ │                                         │
│  [📦 Export ZIP]            │ │                                         │
│  [⎇ Publish to GitHub (P2)] │ │                                         │
└─────────────────────────────┘ └─────────────────────────────────────────┘
```

---

## 10. Micro-interaction & Animation Spec

| Interaction | Animation |
|-------------|-----------|
| Card hover (dashboard) | `transform: translateY(-4px)` + `box-shadow` increase, 180ms ease |
| Block drag in progress | `opacity: 0.5` on dragged item; cyan dashed outline on drop target |
| Block added | Fade-in + slide-down from 8px above, 200ms |
| Block deleted | Fade-out + collapse height, 160ms. Undo toast slides in from bottom |
| Preview refresh | No visible animation — iframe `srcdoc` swap is instant |
| Visibility toggle | Eye icon cross-fade; section fades out of preview, 300ms |
| Panel resize | No animation — direct DOM drag for responsiveness |
| Save indicator | "Saving…" → "Saved ✓" in status bar, 200ms fade |
