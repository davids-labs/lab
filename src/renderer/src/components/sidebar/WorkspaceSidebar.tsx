import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Asset, Block, ProjectConnectionSummary } from '@preload/types'
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
  connections?: ProjectConnectionSummary | null
  onFocusBlock: (id: string) => void
  onImportAssets: () => void
}

export function WorkspaceSidebar({
  activeBlockId,
  assets,
  blocks,
  connections,
  onFocusBlock,
  onImportAssets
}: WorkspaceSidebarProps): JSX.Element {
  const navigate = useNavigate()
  const sidebarTab = useUiStore((state) => state.sidebarTab)
  const setSidebarTab = useUiStore((state) => state.setSidebarTab)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
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
    <aside className={styles.sidebar} data-reduced-chrome={reducedChrome}>
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
        <Button
          size="sm"
          variant={sidebarTab === 'connections' ? 'outline' : 'ghost'}
          onClick={() => setSidebarTab('connections')}
        >
          Links
        </Button>
      </div>

      <div className={styles.body}>
        {sidebarTab === 'assets' ? (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Button variant="outline" size="sm" onClick={onImportAssets}>
                {reducedChrome ? 'Import' : 'Import Files'}
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
                      {!reducedChrome ? <span className={styles.muted}>{asset.mime_type}</span> : null}
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
                    {!reducedChrome ? (
                      <span className={styles.assetTag}>{formatBytes(asset.size_bytes)}</span>
                    ) : null}
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
        ) : sidebarTab === 'navigator' ? (
          <div className={styles.panel}>
            {blocks.map((block) => (
              <button
                key={block.id}
                className={`${styles.navItem} ${activeBlockId === block.id ? styles.navItemActive : ''}`}
                onClick={() => onFocusBlock(block.id)}
                type="button"
              >
                <strong>{BLOCK_LABELS[block.type]}</strong>
                  {!reducedChrome ? (
                    <span className={styles.muted}>
                      {block.visible_on_page ? 'Visible on page' : 'Hidden from page'}
                    </span>
                  ) : null}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.panel}>
            {connections ? (
              <>
                <div className={styles.assetCard}>
                  <div className={styles.assetMeta}>
                    <strong>Plan nodes</strong>
                    <span className={styles.muted}>{connections.plan_nodes.length} linked</span>
                  </div>
                  <div className={styles.tagRow}>
                    {connections.plan_nodes.slice(0, 3).map((node) => (
                      <span key={node.id} className={styles.assetTag}>
                        {node.title}
                      </span>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/direction')}>
                    Open Direction
                  </Button>
                </div>

                <div className={styles.assetCard}>
                  <div className={styles.assetMeta}>
                    <strong>Skill evidence</strong>
                    <span className={styles.muted}>{connections.skill_evidence.length} entries</span>
                  </div>
                  <div className={styles.tagRow}>
                    {connections.skill_evidence.slice(0, 3).map((entry) => (
                      <span key={entry.id} className={styles.assetTag}>
                        {entry.label}
                      </span>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/proof/skills')}>
                    Open Skills
                  </Button>
                </div>

                <div className={styles.assetCard}>
                  <div className={styles.assetMeta}>
                    <strong>CV sections</strong>
                    <span className={styles.muted}>{connections.cv_sections.length} linked</span>
                  </div>
                  <div className={styles.tagRow}>
                    {connections.cv_sections.slice(0, 3).map((entry) => (
                      <span key={entry.section.id} className={styles.assetTag}>
                        {entry.variant.title}: {entry.section.title}
                      </span>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/six-months')}>
                    Open Chain
                  </Button>
                </div>

                <div className={styles.assetCard}>
                  <div className={styles.assetMeta}>
                    <strong>Applications and notes</strong>
                    <span className={styles.muted}>
                      {connections.applications.length} apps · {connections.notes.length} notes
                    </span>
                  </div>
                  <div className={styles.tagRow}>
                    {connections.applications.slice(0, 2).map((application) => (
                      <span key={application.id} className={styles.assetTag}>
                        {application.title}
                      </span>
                    ))}
                    {connections.notes.slice(0, 2).map((note) => (
                      <span key={note.id} className={styles.assetTag}>
                        {note.title}
                      </span>
                    ))}
                  </div>
                  <div className={styles.panelHeader}>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/pipeline')}>
                      Pipeline
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/notes')}>
                      Notes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/presence')}>
                      Presence
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <span className={styles.muted}>Loading project connections…</span>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
