import { useCallback, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { BlockPickerModal } from '@renderer/components/canvas/BlockPickerModal'
import { Canvas } from '@renderer/components/canvas/Canvas'
import { WorkspaceSidebar } from '@renderer/components/sidebar/WorkspaceSidebar'
import { ResizeHandle } from '@renderer/components/ui/ResizeHandle'
import { TitleBar } from '@renderer/components/workspace/TitleBar'
import { useResizableWidth } from '@renderer/hooks/useResizableWidth'
import { useAssetStore } from '@renderer/stores/assetStore'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './Workspace.module.css'

export function Workspace(): JSX.Element {
  const params = useParams()
  const projectId = params.id ?? ''
  const project = useProjectStore((state) => state.activeProject)
  const loadProject = useProjectStore((state) => state.loadProject)
  const blocks = useBlockStore((state) => state.blocks)
  const activeBlockId = useBlockStore((state) => state.activeBlockId)
  const loadBlocks = useBlockStore((state) => state.loadBlocks)
  const setActiveBlock = useBlockStore((state) => state.setActiveBlock)
  const assets = useAssetStore((state) => state.assets)
  const importAsset = useAssetStore((state) => state.importAsset)
  const loadAssets = useAssetStore((state) => state.loadAssets)
  const workspaceSidebarWidth = useUiStore((state) => state.workspaceSidebarWidth)
  const setWorkspaceSidebarWidth = useUiStore((state) => state.setWorkspaceSidebarWidth)
  const pushToast = useToastStore((state) => state.push)
  const { isResizing, onPointerDown } = useResizableWidth({
    value: workspaceSidebarWidth,
    min: 240,
    max: 520,
    onChange: setWorkspaceSidebarWidth
  })

  useEffect(() => {
    if (!projectId) {
      return
    }

    void loadProject(projectId)
    void loadBlocks(projectId)
    void loadAssets(projectId)
  }, [loadAssets, loadBlocks, loadProject, projectId])

  useEffect(() => {
    if (!activeBlockId) {
      return
    }

    const node = document.querySelector<HTMLElement>(`[data-canvas-block-id="${activeBlockId}"]`)
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeBlockId])

  const handleImportAssets = useCallback(async () => {
    const filePaths = await window.lab.system.openFiles({
      title: 'Import Assets',
      properties: ['openFile', 'multiSelections']
    })

    for (const filePath of filePaths) {
      await importAsset(projectId, filePath)
    }

    if (filePaths.length > 0) {
      pushToast({
        message: `Imported ${filePaths.length} asset${filePaths.length === 1 ? '' : 's'}`,
        type: 'success'
      })
    }
  }, [importAsset, projectId, pushToast])

  if (!project) {
    return <div style={{ padding: 32 }}>Loading project…</div>
  }

  return (
    <div className="routeShell">
      <TitleBar project={project} view="workspace" />
      <div
        className={styles.shell}
        style={
          {
            '--workspace-sidebar-width': `${workspaceSidebarWidth}px`
          } as CSSProperties
        }
      >
        <WorkspaceSidebar
          activeBlockId={activeBlockId}
          assets={assets}
          blocks={blocks}
          onFocusBlock={setActiveBlock}
          onImportAssets={() => void handleImportAssets()}
        />
        <ResizeHandle
          active={isResizing}
          ariaLabel="Resize workspace sidebar"
          onPointerDown={onPointerDown}
        />
        <main className={styles.main}>
          <Canvas activeBlockId={activeBlockId} blocks={blocks} />
          <div className={styles.statusBar}>
            <span>
              {blocks.length} block{blocks.length === 1 ? '' : 's'}
            </span>
            <span>{blocks.filter((block) => block.visible_on_page).length} visible on page</span>
          </div>
        </main>
      </div>
      <BlockPickerModal projectId={projectId} />
    </div>
  )
}
