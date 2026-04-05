import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { Block, ImageGalleryData, MarkdownData } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { useAssetStore } from '@renderer/stores/assetStore'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'
import { renderMarkdownToHtml } from '@renderer/utils/markdown'
import { parseMarkdownDocument } from '@shared/content'
import styles from './BlockEditors.module.css'

interface MarkdownBlockProps {
  block: Block<MarkdownData>
}

export function MarkdownBlock({ block }: MarkdownBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  const [view, setView] = useState<'split' | 'raw' | 'preview'>('split')

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  const deferredRaw = useDeferredValue(draft.raw)
  const markdownMeta = useMemo(() => parseMarkdownDocument(draft.raw), [draft.raw])
  const renderedHtml = useMemo(() => renderMarkdownToHtml(deferredRaw), [deferredRaw])
  const parsedTitle = markdownMeta.title || draft.filename || 'Markdown'

  async function handleImport(): Promise<void> {
    const [filePath] = await window.lab.system.openFiles({
      title: 'Import Markdown',
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })

    if (!filePath) {
      return
    }

    const raw = await window.lab.system.readTextFile(filePath)
    const parsed = parseMarkdownDocument(raw)

    startTransition(() => {
      setDraft({
        raw,
        filename: filePath.split(/[\\/]/).pop(),
        frontmatter: parsed.frontmatter
      })
    })
  }

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>{parsedTitle}</strong>
          <div className={styles.helperText}>
            Raw markdown, frontmatter-aware preview, and import from local `.md` files.
          </div>
        </div>
        <div className={styles.inlineActions}>
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
          <Button size="sm" variant="outline" onClick={() => void handleImport()}>
            Import .md
          </Button>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.statLabel}>File</span>
          <strong>{draft.filename || 'Untitled markdown'}</strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.statLabel}>Frontmatter Title</span>
          <strong>{markdownMeta.title || 'Not set'}</strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.statLabel}>Tags</span>
          <strong>{markdownMeta.tags.length > 0 ? markdownMeta.tags.join(', ') : 'None'}</strong>
        </div>
      </div>

      <div className={styles.splitPanel}>
        {view !== 'preview' ? (
          <textarea
            className={styles.previewSurface}
            value={draft.raw}
            onChange={(event) => {
              const raw = event.target.value
              setDraft((current) => ({
                ...current,
                raw,
                frontmatter: parseMarkdownDocument(raw).frontmatter
              }))
            }}
            spellCheck={false}
          />
        ) : null}
        {view !== 'raw' ? (
          <div
            className={styles.previewSurface}
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
  const [previews, setPreviews] = useState<Record<string, string>>({})

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  useEffect(() => {
    let cancelled = false

    async function loadPreviews(): Promise<void> {
      const imageAssets = assets.filter((asset) => asset.mime_type.startsWith('image/'))
      const entries = await Promise.all(
        imageAssets.map(
          async (asset) => [asset.id, await window.lab.asset.getDataUri(asset.id)] as const
        )
      )

      if (!cancelled) {
        setPreviews(Object.fromEntries(entries))
      }
    }

    if (assets.length > 0) {
      void loadPreviews()
    } else {
      setPreviews({})
    }

    return () => {
      cancelled = true
    }
  }, [assets])

  const imageAssets = useMemo(
    () => assets.filter((asset) => asset.mime_type.startsWith('image/')),
    [assets]
  )
  const selectedAssets = useMemo(
    () =>
      draft.asset_ids
        .map((id) => imageAssets.find((asset) => asset.id === id))
        .filter((asset): asset is (typeof imageAssets)[number] => Boolean(asset)),
    [draft.asset_ids, imageAssets]
  )

  function toggleAsset(id: string, checked: boolean): void {
    setDraft((current) => ({
      ...current,
      asset_ids: checked
        ? [...current.asset_ids, id]
        : current.asset_ids.filter((entryId) => entryId !== id)
    }))
  }

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Image gallery</strong>
          <div className={styles.helperText}>
            Choose images, reorder them, and tune the public layout from the selected list.
          </div>
        </div>
        <div className={styles.choiceGroup}>
          {(['grid', 'carousel', 'fullwidth'] as const).map((layout) => (
            <button
              key={layout}
              className={`${styles.choiceButton} ${draft.layout === layout ? styles.choiceActive : ''}`}
              onClick={() => setDraft((current) => ({ ...current, layout }))}
              type="button"
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Selected</span>
          <strong className={styles.statValue}>{selectedAssets.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Available Images</span>
          <strong className={styles.statValue}>{imageAssets.length}</strong>
        </div>
      </div>

      {selectedAssets.length > 0 ? (
        <div className={styles.selectedList}>
          {selectedAssets.map((asset, index) => (
            <div key={asset.id} className={styles.selectedCard}>
              <div className={styles.assetHeader}>
                {previews[asset.id] ? (
                  <img
                    alt={asset.filename}
                    className={styles.assetThumb}
                    src={previews[asset.id]}
                  />
                ) : null}
                <div className={styles.assetMeta}>
                  <strong>{asset.filename}</strong>
                  <span className={styles.helperText}>{asset.mime_type}</span>
                </div>
              </div>
              <InputField
                label="Caption"
                placeholder="What should appear under this image?"
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
              <div className={styles.inlineActions}>
                <button
                  className={`${styles.smallButton} ${styles.iconButton}`}
                  disabled={index === 0}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      asset_ids: arrayMove(current.asset_ids, index, index - 1)
                    }))
                  }
                  type="button"
                >
                  Up
                </button>
                <button
                  className={`${styles.smallButton} ${styles.iconButton}`}
                  disabled={index === selectedAssets.length - 1}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      asset_ids: arrayMove(current.asset_ids, index, index + 1)
                    }))
                  }
                  type="button"
                >
                  Down
                </button>
                <button
                  className={styles.smallButton}
                  onClick={() => toggleAsset(asset.id, false)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>Select one or more images to populate the gallery.</div>
      )}

      <div className={styles.divider} />

      {imageAssets.length > 0 ? (
        <div className={styles.assetGrid}>
          {imageAssets.map((asset) => {
            const selected = draft.asset_ids.includes(asset.id)
            return (
              <div key={asset.id} className={styles.assetCard}>
                <div className={styles.assetHeader}>
                  {previews[asset.id] ? (
                    <img
                      alt={asset.filename}
                      className={styles.assetThumb}
                      src={previews[asset.id]}
                    />
                  ) : null}
                  <div className={styles.assetMeta}>
                    <strong>{asset.filename}</strong>
                    <span className={styles.helperText}>{asset.mime_type}</span>
                  </div>
                </div>
                <label className={styles.checkboxRow}>
                  <input
                    checked={selected}
                    onChange={(event) => toggleAsset(asset.id, event.target.checked)}
                    type="checkbox"
                  />
                  <span>{selected ? 'Included in gallery' : 'Available to add'}</span>
                </label>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          Import image assets in the sidebar before configuring a gallery block.
        </div>
      )}
    </div>
  )
}

interface PlaceholderBlockProps<T> {
  block: Block<T>
}

export function PlaceholderBlock<T>({ block }: PlaceholderBlockProps<T>): JSX.Element {
  return <div className={styles.muted}>Editor for {block.type} is loading…</div>
}
