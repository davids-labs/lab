import { useEffect, useMemo, useState } from 'react'
import matter from 'gray-matter'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import type { Block, ImageGalleryData, MarkdownData } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { useAssetStore } from '@renderer/stores/assetStore'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'
import { renderMarkdownToHtml } from '@renderer/utils/markdown'
import styles from './BlockEditors.module.css'

interface MarkdownBlockProps {
  block: Block<MarkdownData>
}

export function MarkdownBlock({ block }: MarkdownBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  const [view, setView] = useState<'split' | 'raw' | 'preview'>('split')

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  const renderedHtml = useMemo(() => renderMarkdownToHtml(draft.raw), [draft.raw])
  const parsedTitle = useMemo(() => {
    const parsed = matter(draft.raw)
    return typeof parsed.data.title === 'string'
      ? parsed.data.title
      : (draft.filename ?? 'Markdown')
  }, [draft.filename, draft.raw])

  async function handleImport(): Promise<void> {
    const [filePath] = await window.lab.system.openFiles({
      title: 'Import Markdown',
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })

    if (!filePath) {
      return
    }

    const raw = await window.lab.system.readTextFile(filePath)
    const parsed = matter(raw)
    setDraft({
      raw,
      filename: filePath.split(/[\\/]/).pop(),
      frontmatter: parsed.data
    })
  }

  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <div className={styles.muted}>{parsedTitle}</div>
        <Button
          size="sm"
          variant={view === 'split' ? 'primary' : 'outline'}
          onClick={() => setView('split')}
        >
          Split
        </Button>
        <Button
          size="sm"
          variant={view === 'raw' ? 'primary' : 'outline'}
          onClick={() => setView('raw')}
        >
          Raw
        </Button>
        <Button
          size="sm"
          variant={view === 'preview' ? 'primary' : 'outline'}
          onClick={() => setView('preview')}
        >
          Preview
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void handleImport()}>
          Import .md
        </Button>
      </div>
      <div className={styles.row}>
        {view !== 'preview' ? (
          <div style={{ flex: 1, minWidth: 280 }}>
            <CodeMirror
              value={draft.raw}
              height="320px"
              extensions={[markdown()]}
              theme={oneDark}
              onChange={(raw) => setDraft((current) => ({ ...current, raw }))}
            />
          </div>
        ) : null}
        {view !== 'raw' ? (
          <div
            className={styles.card}
            style={{ flex: 1, minWidth: 280 }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : null}
      </div>
    </div>
  )
}

interface ImageGalleryBlockProps {
  block: Block<ImageGalleryData>
}

export function ImageGalleryBlock({ block }: ImageGalleryBlockProps): JSX.Element {
  const assets = useAssetStore((state) => state.assets)
  const [draft, setDraft] = useState(block.data)

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  return (
    <div className={styles.stack}>
      <div className={styles.pillSelect}>
        {(['grid', 'carousel', 'fullwidth'] as const).map((layout) => (
          <button
            key={layout}
            className={`${styles.pill} ${draft.layout === layout ? styles.pillActive : ''}`}
            onClick={() => setDraft((current) => ({ ...current, layout }))}
            type="button"
          >
            {layout}
          </button>
        ))}
      </div>
      <div className={styles.stack}>
        {assets.map((asset) => {
          const selected = draft.asset_ids.includes(asset.id)
          return (
            <div key={asset.id} className={styles.card}>
              <label className={styles.checkboxRow}>
                <input
                  checked={selected}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      asset_ids: event.target.checked
                        ? [...current.asset_ids, asset.id]
                        : current.asset_ids.filter((id) => id !== asset.id)
                    }))
                  }
                  type="checkbox"
                />
                <span>{asset.filename}</span>
              </label>
              {selected ? (
                <InputField
                  label="Caption"
                  value={draft.captions[asset.id] ?? ''}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      captions: {
                        ...current.captions,
                        [asset.id]: event.target.value
                      }
                    }))
                  }
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface PlaceholderBlockProps<T> {
  block: Block<T>
}

export function PlaceholderBlock<T>({ block }: PlaceholderBlockProps<T>): JSX.Element {
  return <div className={styles.muted}>Editor for {block.type} is loading…</div>
}
