import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'
import type {
  Asset,
  Block,
  BomData,
  BuildGuideData,
  CaseStudyData,
  EmbedData,
  GCodeData,
  ImageGalleryData,
  LinkData,
  MarkdownData,
  PinoutData,
  Project,
  SpecTableData,
  TextData
} from '../../preload/types'
import { BLOCK_LABELS, WORKSPACE_ONLY_BLOCK_TYPES } from '@shared/defaults'
import {
  ensureUrlProtocol,
  getUrlHostname,
  inferEmbedType,
  parseMarkdownDocument,
  toEmbedSrc
} from '@shared/content'
import { assetQueries } from '../db/queries/assets'
import { blockQueries } from '../db/queries/blocks'
import { projectQueries } from '../db/queries/projects'
import { escapeHtml } from '../utils/html'

type RenderMode = 'preview' | 'export'

const jsdomWindow = new JSDOM('').window
const purifier = createDOMPurify(jsdomWindow as unknown as Parameters<typeof createDOMPurify>[0])

const BASE_CSS = `
  :root {
    --accent: #8d947f;
    --bg: #111315;
    --surface: #171a1d;
    --surface-2: #1d2126;
    --text: #e2e5e8;
    --muted: #99a0a8;
    --border: rgba(152, 162, 179, 0.24);
    --heading-font: 'IBM Plex Sans', sans-serif;
    --body-font: 'IBM Plex Mono', monospace;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--body-font);
    line-height: 1.55;
  }
  a { color: inherit; }
  img { display: block; max-width: 100%; }
  .shell {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 24px 72px;
    display: grid;
    gap: 20px;
  }
  .hero {
    display: grid;
    gap: 12px;
    padding: 24px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }
  .heroMeta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    color: var(--muted);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .hero h1 {
    margin: 0;
    font-family: var(--heading-font);
    font-size: clamp(2.2rem, 4vw, 3.8rem);
    line-height: 0.96;
    letter-spacing: -0.03em;
  }
  .hero p, .hero blockquote {
    margin: 0;
    color: var(--muted);
    max-width: 76ch;
  }
  .hero blockquote {
    padding-left: 12px;
    border-left: 3px solid var(--accent);
  }
  .sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    align-items: start;
  }
  .section {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    background: var(--surface);
    overflow: hidden;
  }
  .section.full { grid-column: 1 / -1; }
  .sectionHeader {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .section h2, .section h3 {
    margin: 0;
    font-family: var(--heading-font);
  }
  .section h2 {
    font-size: 1.08rem;
    letter-spacing: -0.02em;
  }
  .sectionTag {
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.72rem;
    line-height: 1.2;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .section .prose {
    display: grid;
    gap: 12px;
  }
  .section .prose > *:first-child { margin-top: 0; }
  .section .prose > *:last-child { margin-bottom: 0; }
  .section .prose p,
  .section .prose ul,
  .section .prose ol,
  .section .prose blockquote,
  .section .prose pre {
    margin: 0;
  }
  .section .prose ul,
  .section .prose ol {
    padding-left: 20px;
  }
  .section .prose code {
    background: rgba(255, 255, 255, 0.06);
    padding: 1px 5px;
    border-radius: 6px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  th, td {
    padding: 10px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }
  th {
    color: var(--muted);
    font-size: 0.76rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  td:last-child,
  th:last-child {
    width: 1%;
  }
  .tableTotals {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 12px;
    color: var(--muted);
    font-size: 0.82rem;
  }
  .tableTotals span {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 10px;
    background: var(--surface-2);
  }
  .gallery {
    display: grid;
    gap: 12px;
  }
  .gallery.grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  .gallery.carousel {
    grid-auto-flow: column;
    grid-auto-columns: minmax(260px, 1fr);
    overflow-x: auto;
    padding-bottom: 4px;
    scroll-snap-type: x proximity;
  }
  .gallery.fullwidth {
    grid-template-columns: 1fr;
  }
  .gallery figure {
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .gallery img {
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    cursor: pointer;
  }
  .gallery.carousel figure {
    scroll-snap-align: start;
  }
  .gallery.fullwidth img {
    aspect-ratio: auto;
    max-height: 520px;
    object-fit: contain;
  }
  figcaption {
    color: var(--muted);
    font-size: 0.82rem;
  }
  .steps { display: grid; gap: 12px; }
  .step {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface-2);
  }
  .stepButton {
    width: 100%;
    text-align: left;
    background: transparent;
    border: 0;
    color: inherit;
    font: inherit;
    padding: 14px 16px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .stepIndex {
    color: var(--muted);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .stepBody {
    display: none;
    padding: 14px 16px 16px;
    border-top: 1px solid var(--border);
  }
  .step.open .stepBody { display: grid; gap: 12px; }
  .linkCard {
    display: grid;
    gap: 8px;
    padding: 18px;
    border-radius: 8px;
    background: var(--surface-2);
    text-decoration: none;
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
  }
  .linkMeta {
    color: var(--muted);
    font-size: 0.82rem;
  }
  .embed {
    width: 100%;
    min-height: 360px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface-2);
  }
  .codeBlock {
    margin: 0;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface-2);
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .pinoutGrid {
    display: grid;
    gap: 12px;
  }
  .pinoutGrid.twoColumn {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pinoutColumn {
    display: grid;
    gap: 8px;
  }
  .footer {
    padding-top: 4px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    color: var(--muted);
  }
  .footer a {
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
  }
  .lightbox {
    position: fixed;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.84);
    padding: 24px;
    z-index: 999;
  }
  .lightbox.open { display: flex; }
  .lightbox img {
    max-width: min(92vw, 1280px);
    max-height: 88vh;
    border-radius: 8px;
  }
  .empty {
    border: 1px dashed var(--border);
    border-radius: 8px;
    padding: 14px;
    color: var(--muted);
  }
  body.layout-minimal .sections { grid-template-columns: 1fr; }
  body.layout-magazine .hero {
    grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr);
    align-items: end;
    min-height: 280px;
  }
  body.layout-magazine .sections {
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
  }
  @media (max-width: 900px) {
    .shell { padding: 20px 16px 48px; }
    body.layout-magazine .hero,
    body.layout-magazine .sections {
      grid-template-columns: 1fr;
    }
    .pinoutGrid.twoColumn {
      grid-template-columns: 1fr;
    }
  }
`

const INTERACTIVE_JS = `
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImage = lightbox?.querySelector('img');
  document.addEventListener('click', (event) => {
    const image = event.target.closest('[data-lightbox-src]');
    if (image && lightbox && lightboxImage) {
      lightboxImage.src = image.dataset.lightboxSrc || '';
      lightbox.classList.add('open');
    }
    if (event.target === lightbox) {
      lightbox.classList.remove('open');
    }
    const stepButton = event.target.closest('[data-step-toggle]');
    if (stepButton) {
      stepButton.parentElement?.classList.toggle('open');
    }
  });
`

function buildGoogleFontsUrl(project: Project): string {
  const fonts = [
    ...new Set([project.page_config.theme.fontHeading, project.page_config.theme.fontBody])
  ]
  const families = fonts
    .filter(Boolean)
    .map((font) => `family=${encodeURIComponent(font)}:wght@400;500;600;700;800`)
    .join('&')

  return families ? `https://fonts.googleapis.com/css2?${families}&display=swap` : ''
}

function renderMarkdown(raw: string): string {
  const html = marked.parse(parseMarkdownDocument(raw).content, {
    breaks: false,
    gfm: true
  }) as string
  return purifier.sanitize(html)
}

function buildSectionTitle(block: Block, project: Project): string {
  const customTitle = project.page_config.sections.find(
    (section) => section.blockId === block.id
  )?.customTitle
  if (customTitle) {
    return customTitle
  }

  if (block.type === 'markdown') {
    const markdown = block.data as MarkdownData
    return parseMarkdownDocument(markdown.raw).title ?? BLOCK_LABELS.markdown
  }

  return BLOCK_LABELS[block.type]
}

function renderSectionShell(
  block: Block,
  project: Project,
  innerHtml: string,
  label?: string
): string {
  const title = escapeHtml(buildSectionTitle(block, project))
  const sectionClass = block.grid_col_span === 2 ? 'section full' : 'section'
  const sectionLabel = escapeHtml(label ?? BLOCK_LABELS[block.type])

  return `<section class="${sectionClass}" data-block-id="${block.id}">
    <div class="sectionHeader">
      <h2>${title}</h2>
      <span class="sectionTag">${sectionLabel}</span>
    </div>
    ${innerHtml}
  </section>`
}

function renderPinTableRows(pins: PinoutData['pins']): string {
  return pins
    .map(
      (pin) =>
        `<tr><td>${escapeHtml(pin.pin)}</td><td>${escapeHtml(pin.label)}</td><td>${escapeHtml(pin.function)}</td><td>${escapeHtml(pin.voltage ?? '')}</td><td>${escapeHtml(pin.notes ?? '')}</td></tr>`
    )
    .join('')
}

function renderBlock(block: Block, project: Project, assets: Map<string, string>): string {
  switch (block.type) {
    case 'text':
    case 'how_it_works': {
      const data = block.data as TextData & { body?: string }
      return renderSectionShell(
        block,
        project,
        `<div class="prose">${data.html ?? data.body ?? ''}</div>`
      )
    }
    case 'case_study': {
      const data = block.data as CaseStudyData
      const content =
        data.mode === 'free'
          ? (data.paragraphs ?? []).map((paragraph) => `<div>${paragraph}</div>`).join('')
          : `
              <h3>Challenge</h3>${data.challenge ?? '<p></p>'}
              <h3>Approach</h3>${data.approach ?? '<p></p>'}
              <h3>Outcome</h3>${data.outcome ?? '<p></p>'}
            `
      return renderSectionShell(block, project, `<div class="prose">${content}</div>`)
    }
    case 'bom': {
      const data = block.data as BomData
      const items = data.items.filter((item) => item.item || item.detail || item.qty || item.cost)
      const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0)
      return renderSectionShell(
        block,
        project,
        items.length > 0
          ? `
        <table>
          <thead><tr><th>Item</th><th>Detail</th><th>Qty</th><th>Cost</th></tr></thead>
          <tbody>
            ${items
              .map(
                (item) =>
                  `<tr><td>${escapeHtml(item.item)}</td><td>${escapeHtml(item.detail)}</td><td>${item.qty}</td><td>${escapeHtml(item.cost ?? '')}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="tableTotals">
          <span>${items.length} item${items.length === 1 ? '' : 's'}</span>
          <span>${totalQuantity} total qty</span>
        </div>
      `
          : `<div class="empty">No bill of materials entries yet.</div>`
      )
    }
    case 'pinout': {
      const data = block.data as PinoutData
      const pins = data.pins.filter(
        (pin) => pin.pin || pin.label || pin.function || pin.voltage || pin.notes
      )

      if (pins.length === 0) {
        return renderSectionShell(
          block,
          project,
          `<div class="empty">No pinout rows documented yet.</div>`,
          'Pinout'
        )
      }

      const columns =
        data.layout === 'two_column'
          ? [pins.slice(0, Math.ceil(pins.length / 2)), pins.slice(Math.ceil(pins.length / 2))]
          : [pins]

      return renderSectionShell(
        block,
        project,
        `
          <div class="tableTotals">
            <span>${pins.length} pin${pins.length === 1 ? '' : 's'}</span>
            <span>${data.layout === 'two_column' ? 'Two-column layout' : 'Single-column layout'}</span>
          </div>
          <div class="pinoutGrid ${data.layout === 'two_column' ? 'twoColumn' : ''}">
            ${columns
              .filter((column) => column.length > 0)
              .map(
                (column) => `
                  <div class="pinoutColumn">
                    <table>
                      <thead><tr><th>Pin</th><th>Label</th><th>Function</th><th>Voltage</th><th>Notes</th></tr></thead>
                      <tbody>${renderPinTableRows(column)}</tbody>
                    </table>
                  </div>
                `
              )
              .join('')}
          </div>
        `,
        'Pinout'
      )
    }
    case 'build_guide': {
      const data = block.data as BuildGuideData
      return renderSectionShell(
        block,
        project,
        data.steps.length > 0
          ? `
        <div class="steps">
          ${data.steps
            .map((step, index) => {
              const image = step.img_asset_id ? assets.get(step.img_asset_id) : null
              return `<div class="step ${index === 0 ? 'open' : ''}">
                <button class="stepButton" data-step-toggle="true">
                  <strong>${escapeHtml(step.title || `Step ${index + 1}`)}</strong>
                  <span class="stepIndex">Step ${index + 1}</span>
                </button>
                <div class="stepBody">
                  <div class="prose">${step.body}</div>
                  ${image ? `<img src="${image}" alt="${escapeHtml(step.title || `Step ${index + 1}`)}" />` : ''}
                </div>
              </div>`
            })
            .join('')}
        </div>
      `
          : `<div class="empty">No build steps yet.</div>`
      )
    }
    case 'image_gallery': {
      const data = block.data as ImageGalleryData
      const figures = data.asset_ids
        .map((id) => {
          const src = assets.get(id)
          if (!src) {
            return ''
          }
          const caption = data.captions[id] ?? ''
          return `<figure>
            <img src="${src}" alt="${escapeHtml(caption || 'Gallery image')}" data-lightbox-src="${src}" />
            ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
          </figure>`
        })
        .join('')

      return renderSectionShell(
        block,
        project,
        figures
          ? `<div class="gallery ${escapeHtml(data.layout)}">${figures}</div>`
          : `<div class="empty">No gallery images selected yet.</div>`
      )
    }
    case 'markdown': {
      const data = block.data as MarkdownData
      return renderSectionShell(
        block,
        project,
        `<div class="prose">${renderMarkdown(data.raw)}</div>`,
        'Markdown'
      )
    }
    case 'link': {
      const data = block.data as LinkData
      const hostname = getUrlHostname(data.url) ?? ''
      const href = ensureUrlProtocol(data.url) || '#'

      return renderSectionShell(
        block,
        project,
        `
        <a class="linkCard" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">
          <strong>${escapeHtml(data.label || data.url || 'Untitled link')}</strong>
          ${hostname ? `<span class="linkMeta">${escapeHtml(hostname)}</span>` : ''}
          ${data.description ? `<span>${escapeHtml(data.description)}</span>` : ''}
        </a>
      `,
        'Link'
      )
    }
    case 'gcode': {
      const data = block.data as GCodeData
      const trimmedCode = data.code.trim()
      const lineCount = trimmedCode ? trimmedCode.split(/\r?\n/).length : 0

      return renderSectionShell(
        block,
        project,
        trimmedCode
          ? `
            ${data.description ? `<div class="prose"><p>${escapeHtml(data.description)}</p></div>` : ''}
            <div class="tableTotals">
              ${data.machine ? `<span>${escapeHtml(data.machine)}</span>` : ''}
              <span>${lineCount} line${lineCount === 1 ? '' : 's'}</span>
            </div>
            <pre class="codeBlock"><code>${escapeHtml(data.code)}</code></pre>
          `
          : `<div class="empty">No G-code captured yet.</div>`,
        'G-Code'
      )
    }
    case 'spec_table': {
      const data = block.data as SpecTableData
      return renderSectionShell(
        block,
        project,
        data.rows.length > 0
          ? `
        <table>
          <thead><tr>${data.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
          <tbody>${data.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
            .join('')}</tbody>
        </table>
      `
          : `<div class="empty">No specification rows yet.</div>`
      )
    }
    case 'embed': {
      const data = block.data as EmbedData
      const embedType = data.type === 'generic' ? inferEmbedType(data.url) : data.type
      const embedUrl = toEmbedSrc(embedType, data.url)
      return renderSectionShell(
        block,
        project,
        embedUrl
          ? `<iframe class="embed" src="${escapeHtml(embedUrl)}" loading="lazy" allowfullscreen></iframe>`
          : `<div class="empty">Add an embed URL to render this block.</div>`,
        'Embed'
      )
    }
    case 'note':
    case 'todo':
    case 'failed_iteration':
      return ''
  }
}

function buildPreviewScript(mode: RenderMode): string {
  if (mode !== 'preview') {
    return ''
  }

  return `
    document.addEventListener('click', (event) => {
      const section = event.target.closest('[data-block-id]');
      if (section) {
        event.preventDefault();
        window.parent.postMessage({ type: 'LAB_FOCUS_BLOCK', blockId: section.dataset.blockId }, '*');
      }
    });
  `
}

function buildFooter(project: Project): string {
  return project.page_config.footer.links
    .map(
      (link) =>
        `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
    )
    .join('')
}

export function renderProjectHtml(projectId: string, mode: RenderMode = 'preview'): string {
  const project = projectQueries.get(projectId)
  const sectionMap = new Map(
    project.page_config.sections.map((section) => [section.blockId, section])
  )
  const blocks = blockQueries
    .list(projectId)
    .filter((block) => !WORKSPACE_ONLY_BLOCK_TYPES.includes(block.type))
    .filter((block) => {
      const section = sectionMap.get(block.id)
      return section ? section.visible : block.visible_on_page
    })
    .sort((left, right) => {
      const leftOrder = sectionMap.get(left.id)?.sortOrder ?? left.sort_order
      const rightOrder = sectionMap.get(right.id)?.sortOrder ?? right.sort_order
      return leftOrder - rightOrder || left.sort_order - right.sort_order
    })
  const assets = new Map<string, string>()

  assetQueries.list(projectId).forEach((asset) => {
    assets.set(asset.id, assetQueries.getDataUri(asset.id))
  })

  const sections = blocks.map((block) => renderBlock(block, project, assets)).join('')
  const googleFontsUrl = buildGoogleFontsUrl(project)
  const themeCss = `
    :root {
      --accent: ${project.page_config.theme.accent};
      --bg: ${project.page_config.theme.bg};
      --surface: ${project.page_config.theme.surface};
      --heading-font: '${project.page_config.theme.fontHeading}', sans-serif;
      --body-font: '${project.page_config.theme.fontBody}', monospace;
    }
  `

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(project.name)}</title>
    ${googleFontsUrl ? `<link rel="stylesheet" href="${googleFontsUrl}" />` : ''}
    <style>${BASE_CSS}${themeCss}</style>
  </head>
  <body class="layout-${project.page_config.theme.layoutVariant}">
    <div class="shell">
      <header class="hero">
        <div class="heroMeta">
          <span>${escapeHtml(project.type)}</span>
          <span>${escapeHtml(project.status)}</span>
          <span>${blocks.length} public block${blocks.length === 1 ? '' : 's'}</span>
        </div>
        <h1>${escapeHtml(project.name)}</h1>
        ${project.subtitle ? `<p>${escapeHtml(project.subtitle)}</p>` : ''}
        ${project.core_value ? `<blockquote>${escapeHtml(project.core_value)}</blockquote>` : ''}
      </header>
      <main class="sections">${sections}</main>
      ${project.page_config.footer.links.length > 0 ? `<footer class="footer">${buildFooter(project)}</footer>` : ''}
    </div>
    <div class="lightbox" data-lightbox><img alt="" /></div>
    <script>${INTERACTIVE_JS}${buildPreviewScript(mode)}</script>
  </body>
</html>`
}

export function writeHtmlExport(
  projectId: string,
  outputPath: string
): { ok: boolean; path: string } {
  fs.writeFileSync(outputPath, renderProjectHtml(projectId, 'export'), 'utf8')
  return { ok: true, path: outputPath }
}

export async function writeZipExport(
  projectId: string,
  outputPath: string
): Promise<{ ok: boolean; path: string }> {
  const output = fs.createWriteStream(outputPath)
  const archive = archiver('zip')

  await new Promise<void>((resolve, reject) => {
    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    archive.append(renderProjectHtml(projectId, 'export'), { name: 'index.html' })

    assetQueries.list(projectId).forEach((asset: Asset) => {
      archive.file(asset.stored_path, {
        name: path.join('assets', path.basename(asset.stored_path))
      })
    })

    void archive.finalize()
  })

  return { ok: true, path: outputPath }
}
