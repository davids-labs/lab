import { useEffect, useMemo, useState } from 'react'
import type { Asset, Block } from '@preload/types'
import { BLOCK_LABELS } from '@shared/defaults'
import { Button } from '@renderer/components/ui/Button'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './WorkspaceSidebar.module.css'

type AssetFilter = 'all' | 'image' | 'cad' | 'file'

const ASSET_FILTERS: Array<{ key: AssetFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'cad', label: 'CAD' },
  { key: 'file', label: 'Files' }
]

function getAssetKind(asset: Asset): Exclude<AssetFilter, 'all'> {
  if (asset.tags.includes('image') || asset.mime_type.startsWith('image/')) {
    return 'image'
  }

  if (asset.tags.includes('cad')) {
    return 'cad'
  }

  return 'file'
}

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

interface WorkspaceSidebarProps {
  activeBlockId: string | null
  assets: Asset[]
  blocks: Block[]
  onFocusBlock: (id: string) => void
  onImportAssets: () => void
}

export function WorkspaceSidebar({
  activeBlockId,
  assets,
  blocks,
  onFocusBlock,
  onImportAssets
}: WorkspaceSidebarProps): JSX.Element {
  const sidebarTab = useUiStore((state) => state.sidebarTab)
  const setSidebarTab = useUiStore((state) => state.setSidebarTab)
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('all')
  const [assetPreviews, setAssetPreviews] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false

    async function loadAssetPreviews(): Promise<void> {
      const imageAssets = assets.filter((asset) => getAssetKind(asset) === 'image')
      const entries = await Promise.all(
        imageAssets.map(
          async (asset) => [asset.id, await window.lab.asset.getDataUri(asset.id)] as const
        )
      )

      if (!cancelled) {
        setAssetPreviews(Object.fromEntries(entries))
      }
    }

    if (assets.some((asset) => getAssetKind(asset) === 'image')) {
      void loadAssetPreviews()
    } else {
      setAssetPreviews({})
    }

    return () => {
      cancelled = true
    }
  }, [assets])

  const assetCounts = useMemo(
    () => ({
      all: assets.length,
      image: assets.filter((asset) => getAssetKind(asset) === 'image').length,
      cad: assets.filter((asset) => getAssetKind(asset) === 'cad').length,
      file: assets.filter((asset) => getAssetKind(asset) === 'file').length
    }),
    [assets]
  )

  const filteredAssets = useMemo(
    () => assets.filter((asset) => assetFilter === 'all' || getAssetKind(asset) === assetFilter),
    [assetFilter, assets]
  )

  return (
    <aside className={styles.sidebar}>
      <div className={styles.tabs}>
        <Button
          size="sm"
          variant={sidebarTab === 'assets' ? 'outline' : 'ghost'}
          onClick={() => setSidebarTab('assets')}
        >
          Assets
        </Button>
        <Button
          size="sm"
          variant={sidebarTab === 'navigator' ? 'outline' : 'ghost'}
          onClick={() => setSidebarTab('navigator')}
        >
          Navigator
        </Button>
      </div>

      <div className={styles.body}>
        {sidebarTab === 'assets' ? (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Button variant="outline" size="sm" onClick={onImportAssets}>
                Import Files
              </Button>
              <span className={styles.muted}>{assetCounts.all} total</span>
            </div>

            <div className={styles.filterRow}>
              {ASSET_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  className={`${styles.filterButton} ${assetFilter === filter.key ? styles.filterButtonActive : ''}`}
                  onClick={() => setAssetFilter(filter.key)}
                  type="button"
                >
                  {filter.label} {assetCounts[filter.key]}
                </button>
              ))}
            </div>

            {filteredAssets.map((asset) => {
              const kind = getAssetKind(asset)
              const preview = kind === 'image' ? assetPreviews[asset.id] : null

              return (
                <div key={asset.id} className={styles.assetCard}>
                  <div className={styles.assetHeader}>
                    {preview ? (
                      <img alt={asset.filename} className={styles.assetThumb} src={preview} />
                    ) : (
                      <div className={styles.assetPlaceholder}>{kind.toUpperCase()}</div>
                    )}
                    <div className={styles.assetMeta}>
                      <strong>{asset.filename}</strong>
                      <span className={styles.muted}>{asset.mime_type}</span>
                    </div>
                  </div>

                  <div className={styles.tagRow}>
                    <span className={styles.assetTag}>{kind}</span>
                    {asset.tags
                      .filter((tag) => tag !== kind)
                      .map((tag) => (
                        <span key={tag} className={styles.assetTag}>
                          {tag}
                        </span>
                      ))}
                    <span className={styles.assetTag}>{formatBytes(asset.size_bytes)}</span>
                  </div>
                </div>
              )
            })}

            {filteredAssets.length === 0 ? (
              <span className={styles.muted}>
                {assetFilter === 'all'
                  ? 'No assets imported yet.'
                  : `No ${assetFilter} assets imported yet.`}
              </span>
            ) : null}
          </div>
        ) : (
          <div className={styles.panel}>
            {blocks.map((block) => (
              <button
                key={block.id}
                className={`${styles.navItem} ${activeBlockId === block.id ? styles.navItemActive : ''}`}
                onClick={() => onFocusBlock(block.id)}
                type="button"
              >
                <strong>{BLOCK_LABELS[block.type]}</strong>
                <span className={styles.muted}>
                  {block.visible_on_page ? 'Visible on page' : 'Hidden from page'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
