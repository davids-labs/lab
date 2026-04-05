import type { Asset, Block } from '@preload/types'
import { BLOCK_LABELS } from '@shared/defaults'
import { Button } from '@renderer/components/ui/Button'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './WorkspaceSidebar.module.css'

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

  return (
    <aside className={styles.sidebar}>
      <div className={styles.tabs}>
        <Button
          size="sm"
          variant={sidebarTab === 'assets' ? 'primary' : 'outline'}
          onClick={() => setSidebarTab('assets')}
        >
          Assets
        </Button>
        <Button
          size="sm"
          variant={sidebarTab === 'navigator' ? 'primary' : 'outline'}
          onClick={() => setSidebarTab('navigator')}
        >
          Navigator
        </Button>
      </div>

      <div className={styles.body}>
        {sidebarTab === 'assets' ? (
          <div className={styles.panel}>
            <Button variant="outline" size="sm" onClick={onImportAssets}>
              Import Files
            </Button>
            {assets.map((asset) => (
              <div key={asset.id} className={styles.assetCard}>
                <strong>{asset.filename}</strong>
                <span className={styles.muted}>{asset.mime_type}</span>
              </div>
            ))}
            {assets.length === 0 ? (
              <span className={styles.muted}>No assets imported yet.</span>
            ) : null}
          </div>
        ) : (
          <div className={styles.panel}>
            {blocks.map((block) => (
              <button
                key={block.id}
                className={styles.navItem}
                onClick={() => onFocusBlock(block.id)}
                style={
                  activeBlockId === block.id
                    ? {
                        borderColor: 'rgba(79, 140, 255, 0.4)',
                        background: 'rgba(79, 140, 255, 0.08)'
                      }
                    : undefined
                }
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
