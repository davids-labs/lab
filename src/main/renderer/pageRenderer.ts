import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import matter from 'gray-matter'
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
  ImageGalleryData,
  LinkData,
  MarkdownData,
  Project,
  SpecTableData,
  TextData
} from '../../preload/types'
import { BLOCK_LABELS } from '@shared/defaults'
import { assetQueries } from '../db/queries/assets'
import { blockQueries } from '../db/queries/blocks'
import { projectQueries } from '../db/queries/projects'
import { escapeHtml } from '../utils/html'

type RenderMode = 'preview' | 'export'

const jsdomWindow = new JSDOM('').window
const purifier = createDOMPurify(jsdomWindow as unknown as Parameters<typeof createDOMPurify>[0])

const BASE_CSS = `
  :root {
    --accent: #00e5ff;
    --bg: #0d0f12;
    --surface: #1a1d24;
    --text: #e2e8f0;
    --muted: #94a3b8;
    --border: rgba(148, 163, 184, 0.2);
    --heading-font: 'Syne', sans-serif;
    --body-font: 'Space Mono', monospace;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: radial-gradient(circle at top, rgba(0, 229, 255, 0.12), transparent 30%), var(--bg);
    color: var(--text);
    font-family: var(--body-font);
  }
  a { color: inherit; }
  .shell { max-width: 1200px; margin: 0 auto; padding: 48px 24px 96px; }
  .hero {
    display: grid;
    gap: 16px;
    margin-bottom: 32px;
    padding: 32px;
    border: 1px solid var(--border);
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
  }
  .hero h1 {
    margin: 0;
    font-family: var(--heading-font);
    font-size: clamp(2.8rem, 5vw, 4.8rem);
    line-height: 0.92;
  }
  .hero p, .hero blockquote {
    margin: 0;
    color: var(--muted);
    max-width: 72ch;
  }
  .sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }
  .section {
    background: rgba(26, 29, 36, 0.92);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px;
    overflow: hidden;
  }
  .section.full { grid-column: 1 / -1; }
  .section h2, .section h3 {
    margin-top: 0;
    font-family: var(--heading-font);
  }
  .section .prose { display: grid; gap: 12px; }
  .section .prose > *:first-child { margin-top: 0; }
  .section .prose > *:last-child { margin-bottom: 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
  }
  th, td {
    padding: 10px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
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
    border-radius: 14px;
    cursor: pointer;
  }
  .steps { display: grid; gap: 16px; }
  .step {
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.02);
  }
  .stepButton {
    width: 100%;
    text-align: left;
    background: transparent;
    border: 0;
    color: inherit;
    font: inherit;
    padding: 0;
    cursor: pointer;
  }
  .stepBody { display: none; margin-top: 12px; }
  .step.open .stepBody { display: block; }
  .linkCard {
    display: grid;
    gap: 8px;
    padding: 18px;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    text-decoration: none;
    border: 1px solid var(--border);
  }
  .embed {
    width: 100%;
    min-height: 360px;
    border: 0;
    border-radius: 16px;
    background: rgba(0,0,0,0.3);
  }
  .footer {
    margin-top: 32px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    color: var(--muted);
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
    border-radius: 18px;
  }
  body.layout-minimal .sections { grid-template-columns: 1fr; }
  body.layout-magazine .hero { padding: 56px; min-height: 320px; }
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
  const fonts = [...new Set([project.page_config.theme.fontHeading, project.page_config.theme.fontBody])]
  const families = fonts
    .filter(Boolean)
    .map((font) => `family=${encodeURIComponent(font)}:wght@400;500;600;700;800`)
    .join('&')

  return families ? `https://fonts.googleapis.com/css2?${families}&display=swap` : ''
}

function renderMarkdown(raw: string): string {
  const html = marked.parse(raw, { breaks: false, gfm: true }) as string
  return purifier.sanitize(html)
}

function toYoutubeEmbed(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`
    }

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }
  } catch {
    return url
  }

  return url
}

function buildSectionTitle(block: Block, project: Project): string {
  const customTitle = project.page_config.sections.find((section) => section.blockId === block.id)?.customTitle
  if (customTitle) {
    return customTitle
  }

  if (block.type === 'markdown') {
    const markdown = block.data as MarkdownData
    const frontmatter = matter(markdown.raw)
    return typeof frontmatter.data.title === 'string' ? frontmatter.data.title : BLOCK_LABELS.markdown
  }

  return BLOCK_LABELS[block.type]
}

function renderBlock(block: Block, project: Project, assets: Map<string, string>): string {
  const title = escapeHtml(buildSectionTitle(block, project))
  const sectionClass = block.grid_col_span === 2 ? 'section full' : 'section'

  switch (block.type) {
    case 'text':
    case 'how_it_works': {
      const data = block.data as TextData & { body?: string }
      return `<section class="${sectionClass}" data-block-id="${block.id}"><h2>${title}</h2><div class="prose">${data.html ?? data.body ?? ''}</div></section>`
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
      return `<section class="${sectionClass}" data-block-id="${block.id}"><h2>${title}</h2><div class="prose">${content}</div></section>`
    }
    case 'bom': {
      const data = block.data as BomData
      return `<section class="${sectionClass}" data-block-id="${block.id}">
        <h2>${title}</h2>
        <table>
          <thead><tr><th>Item</th><th>Detail</th><th>Qty</th><th>Cost</th></tr></thead>
          <tbody>
            ${data.items
              .map(
                (item) =>
                  `<tr><td>${escapeHtml(item.item)}</td><td>${escapeHtml(item.detail)}</td><td>${item.qty}</td><td>${escapeHtml(item.cost ?? '')}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      </section>`
    }
    case 'build_guide': {
      const data = block.data as BuildGuideData
      return `<section class="${sectionClass}" data-block-id="${block.id}">
        <h2>${title}</h2>
        <div class="steps">
          ${data.steps
            .map((step, index) => {
              const image = step.img_asset_id ? assets.get(step.img_asset_id) : null
              return `<div class="step">
                <button class="stepButton" data-step-toggle="true"><strong>${index + 1}. ${escapeHtml(step.title || `Step ${index + 1}`)}</strong></button>
                <div class="stepBody">
                  <div class="prose">${step.body}</div>
                  ${image ? `<img src="${image}" alt="${escapeHtml(step.title || `Step ${index + 1}`)}" style="width:100%;margin-top:12px;border-radius:14px;" />` : ''}
                </div>
              </div>`
            })
            .join('')}
        </div>
      </section>`
    }
    case 'image_gallery': {
      const data = block.data as ImageGalleryData
      return `<section class="${sectionClass}" data-block-id="${block.id}">
        <h2>${title}</h2>
        <div class="gallery">
          ${data.asset_ids
            .map((id) => {
              const src = assets.get(id)
              if (!src) {
                return ''
              }
              const caption = data.captions[id] ?? ''
              return `<figure>
                <img src="${src}" alt="${escapeHtml(caption)}" data-lightbox-src="${src}" />
                ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
              </figure>`
            })
            .join('')}
        </div>
      </section>`
    }
    case 'markdown': {
      const data = block.data as MarkdownData
      return `<section class="${sectionClass}" data-block-id="${block.id}"><h2>${title}</h2><div class="prose">${renderMarkdown(data.raw)}</div></section>`
    }
    case 'link': {
      const data = block.data as LinkData
      return `<section class="${sectionClass}" data-block-id="${block.id}">
        <a class="linkCard" href="${escapeHtml(data.url || '#')}" target="_blank" rel="noreferrer">
          <strong>${escapeHtml(data.label || data.url || 'Untitled link')}</strong>
          ${data.description ? `<span>${escapeHtml(data.description)}</span>` : ''}
        </a>
      </section>`
    }
    case 'spec_table': {
      const data = block.data as SpecTableData
      return `<section class="${sectionClass}" data-block-id="${block.id}">
        <h2>${title}</h2>
        <table>
          <thead><tr>${data.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
          <tbody>${data.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
            .join('')}</tbody>
        </table>
      </section>`
    }
    case 'embed': {
      const data = block.data as EmbedData
      const embedUrl = data.type === 'youtube' ? toYoutubeEmbed(data.url) : data.url
      return `<section class="${sectionClass}" data-block-id="${block.id}">
        <h2>${title}</h2>
        <iframe class="embed" src="${escapeHtml(embedUrl)}" loading="lazy" allowfullscreen></iframe>
      </section>`
    }
    case 'note':
    case 'todo':
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
  const blocks = blockQueries
    .list(projectId)
    .filter((block) => block.visible_on_page)
    .sort((left, right) => left.sort_order - right.sort_order)
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

export function writeHtmlExport(projectId: string, outputPath: string): { ok: boolean; path: string } {
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
      archive.file(asset.stored_path, { name: path.join('assets', path.basename(asset.stored_path)) })
    })

    void archive.finalize()
  })

  return { ok: true, path: outputPath }
}
