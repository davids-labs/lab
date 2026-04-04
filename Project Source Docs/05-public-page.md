# LAB — Public Page Renderer Specification
**DOC-05 · PUB · Revision 0.2**
Render mode: Node.js template literal → HTML string | Output: Self-contained HTML

---

## 1. Purpose of the Live Preview

The right-panel preview exists to answer one question: **"What will a visitor actually see?"**

The canvas is your editing surface — blocks are functional, form-based, and tool-heavy. The preview renders them as a polished webpage with your chosen design. This is important because a BOM displayed as an inline-editable table looks completely different from a BOM rendered as a styled HTML table in the public page. The preview makes that gap visible at all times.

**Preview trigger:** Debounced 1 second after any block save or visibility/config change. Not on every keystroke (would cause flicker with large content). An explicit "Refresh" button is also available.

---

## 2. Render Pipeline

```
IPC: page:render(projectId)
  │
  ▼
1. DB: fetch Project row
2. DB: fetch all Blocks WHERE project_id = ? AND visible_on_page = 1
3. Sort blocks by page_config.sections[].sortOrder (falling back to block.sort_order)
4. For each block:
   a. Call blockRenderer[block.type](block.data, assets)
   b. Returns HTML partial string
5. Resolve all asset IDs needed → assetManager.getDataURI(id) → base64 strings
   (Pass asset map to block renderers so they can inline images)
6. Build theme CSS string from page_config.theme
7. Inject: theme CSS + section partials + project metadata into shell template
8. Return: complete HTML string
  │
  ▼
Renderer process:
  - Preview: set iframe.srcdoc = htmlString
  - Export: write htmlString to file
```

---

## 3. Shell Template

The shell is a TypeScript template literal function in `src/main/renderer/page-renderer.ts`.

```typescript
function buildShell(params: {
  project: Project;
  sectionsHtml: string;
  themeCSS: string;
  googleFontsUrl: string;    // generated from theme.fontHeading + theme.fontBody
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(params.project.name)}</title>
  ${params.googleFontsUrl ? `<link rel="stylesheet" href="${params.googleFontsUrl}">` : ''}
  <style>
    ${BASE_CSS}           /* inlined base stylesheet */
    ${params.themeCSS}    /* :root { --accent: #00e5ff; ... } */
  </style>
</head>
<body>
  <header class="lab-header">
    <h1>${escapeHtml(params.project.name)}</h1>
    ${params.project.subtitle ? `<p class="subtitle">${escapeHtml(params.project.subtitle)}</p>` : ''}
    ${params.project.core_value ? `<blockquote class="core-value">${escapeHtml(params.project.core_value)}</blockquote>` : ''}
  </header>

  <main class="lab-main">
    ${params.sectionsHtml}
  </main>

  <footer class="lab-footer">
    ${buildFooterHtml(params.project.page_config.footer)}
  </footer>

  <script>
    ${INTERACTIVE_JS}    /* lightbox, collapsible steps, table sort — inlined */
  </script>
</body>
</html>`;
}
```

**`BASE_CSS`** is a constant string defined in the same file — the full stylesheet for all block types, written using the CSS custom property tokens. It is NOT loaded from an external file at runtime; it is bundled as a JS string at build time using Vite's `?raw` import:

```typescript
import BASE_CSS from './base.css?raw';
import INTERACTIVE_JS from './interactive.js?raw';
```

---

## 4. Block Renderer Functions

Each block type has a dedicated renderer function:

```typescript
// src/main/renderer/block-renderers/index.ts
export const blockRenderers: Record<BlockType, BlockRendererFn> = {
  bom:           renderBom,
  build_guide:   renderBuildGuide,
  case_study:    renderCaseStudy,
  how_it_works:  renderHowItWorks,
  image_gallery: renderImageGallery,
  markdown:      renderMarkdown,
  link:          renderLink,
  text:          renderText,
  spec_table:    renderSpecTable,
  embed:         renderEmbed,
  note:          () => '',   // workspace-only: return empty string
  todo:          () => '',
};

type BlockRendererFn = (
  data: unknown,
  assets: Map<string, string>,   // assetId → data URI
  blockId: string,               // injected as data-block-id for preview click-to-edit
  customTitle?: string           // from page_config.sections[].customTitle
) => string;
```

### Block Renderer Outputs

| Block type | HTML structure | Interactive feature |
|------------|---------------|-------------------|
| `bom` | `<section data-block-id="..."><h2>...</h2><table class="bom-table">...</table></section>` | Column sort (click `<th>`) |
| `build_guide` | `<section><h2>...</h2><ol class="build-steps">...</ol></section>` | Click step title → expand/collapse body |
| `case_study` | `<section><h2>...</h2><div class="prose">...</div></section>` | None |
| `how_it_works` | `<section class="accent-left"><h2>...</h2><div class="prose">...</div></section>` | None |
| `image_gallery` | `<section><h2>...</h2><div class="img-grid">...</div></section>` | Click image → lightbox modal |
| `markdown` | `<section><h2>...</h2><div class="prose markdown-body">{{rendered html}}</div></section>` | None |
| `link` | `<section><a class="link-card" href="..." target="_blank">...</a></section>` | Opens new tab |
| `spec_table` | `<section><h2>...</h2><table class="spec-table">...</table></section>` | Sticky header |
| `embed` | `<section><div class="embed-container"><iframe src="..."></iframe></div></section>` | Native iframe |

---

## 5. Click-to-Edit Bridge (Preview → Canvas)

Every section rendered in the public page has a `data-block-id` attribute injected on its root element.

A small script injected into the public page (only when rendered for the in-app preview, not for export) intercepts clicks:

```javascript
// Injected only in preview mode (not in export)
document.addEventListener('click', (e) => {
  const section = e.target.closest('[data-block-id]');
  if (section) {
    e.preventDefault();
    window.parent.postMessage(
      { type: 'LAB_FOCUS_BLOCK', blockId: section.dataset.blockId },
      '*'
    );
  }
});
```

In the renderer process, `PublicPagePreview.tsx` listens:

```typescript
useEffect(() => {
  const handler = (e: MessageEvent) => {
    if (e.data?.type === 'LAB_FOCUS_BLOCK') {
      blockStore.setActiveBlock(e.data.blockId);
      // Canvas scrolls to and highlights the block
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, []);
```

**Important:** This `postMessage` listener is stripped from the HTML on export (export uses a separate `renderForExport()` function that omits the preview-only script injection).

---

## 6. Asset Embedding Strategy

### In-app Preview
Images are embedded as `data:` URIs in the `<img src="">` attributes. This avoids all `file://` path issues with `iframe.srcdoc`.

```typescript
// In renderImageGallery():
const imgHtml = assetIds.map(id => {
  const dataUri = assets.get(id) ?? '';
  const caption = data.captions[id] ?? '';
  return `<figure>
    <img src="${dataUri}" alt="${escapeHtml(caption)}" loading="lazy">
    ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
  </figure>`;
}).join('');
```

### Export (Standalone HTML)
Same approach — all images are base64-embedded. Result is a single `.html` file.

**Size warning:** Base64 adds ~33% overhead. A warning is shown in the Export UI if total asset size exceeds 10MB:
> "Total asset size is 12.3MB. The exported file may be large. Consider using ZIP export for better performance."

### Export (ZIP)
Assets are copied to an `/assets/` folder. Image `src` attributes use relative paths: `assets/{assetId}-{filename}`. ZIP export preserves full quality and avoids the size penalty.

---

## 7. Layout Variants

Controlled by `page_config.theme.layoutVariant`. Applied via a class on `<body>`.

| Variant | Body class | Description |
|---------|-----------|-------------|
| `default` | `layout-default` | Card-based sections on dark background; grid layout; matches Davids.Lab aesthetic |
| `minimal` | `layout-minimal` | Single-column prose; generous whitespace; light or dark |
| `magazine` | `layout-magazine` | Full-bleed hero image; editorial typography; pull-quote styling |

The `BASE_CSS` contains styles for all three variants. Only the active variant's styles apply.

---

## 8. Export Flow

### HTML Export
```typescript
// src/main/ipc/page.ts
ipcMain.handle('page:export-html', async (_, { projectId, outputPath }) => {
  const html = await renderForExport(projectId);   // no click-to-edit script
  await fs.promises.writeFile(outputPath, html, 'utf-8');
  return { ok: true };
});
```
The `outputPath` is chosen by the user via Electron's `showSaveDialog`.

### ZIP Export
```typescript
ipcMain.handle('page:export-zip', async (_, { projectId, outputPath }) => {
  const { html, assetFiles } = await renderForZipExport(projectId);
  // assetFiles: Array<{ relativePath: string, buffer: Buffer }>
  // Use 'archiver' npm package to write zip
  const archive = archiver('zip');
  archive.append(html, { name: 'index.html' });
  for (const f of assetFiles) {
    archive.append(f.buffer, { name: f.relativePath });
  }
  await archive.finalize();
  return { ok: true };
});
```

---

## 9. Google Fonts URL Generation

```typescript
function buildGoogleFontsUrl(headingFont: string, bodyFont: string): string {
  const fonts = [...new Set([headingFont, bodyFont])];
  const families = fonts
    .map(f => `family=${encodeURIComponent(f)}:wght@400;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
```

**Note:** In the standalone HTML export, this loads Google Fonts from the CDN. For fully offline export, a future enhancement could embed font files as base64 `@font-face` declarations.
