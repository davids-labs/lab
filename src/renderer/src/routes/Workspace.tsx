import { useCallback, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { BlockPickerModal } from '@renderer/components/canvas/BlockPickerModal'
import { Canvas } from '@renderer/components/canvas/Canvas'
import { PublicPagePreview } from '@renderer/components/preview/PublicPagePreview'
import { WorkspaceSidebar } from '@renderer/components/sidebar/WorkspaceSidebar'
import { ResizeHandle } from '@renderer/components/ui/ResizeHandle'
import { TitleBar } from '@renderer/components/workspace/TitleBar'
import { useResizableWidth } from '@renderer/hooks/useResizableWidth'
import { useAssetStore } from '@renderer/stores/assetStore'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import { useWorkflowStore } from '@renderer/stores/workflowStore'
import styles from './Workspace.module.css'

export function Workspace(): JSX.Element {
  const params = useParams()
  const projectId = params.id ?? ''
  const project = useProjectStore((state) => state.activeProject)
  const loadProject = useProjectStore((state) => state.loadProject)
  const projectConnections = useWorkflowStore((state) => state.projectConnections[projectId] ?? null)
  const loadProjectConnections = useWorkflowStore((state) => state.loadProjectConnections)
  const blocks = useBlockStore((state) => state.blocks)
  const activeBlockId = useBlockStore((state) => state.activeBlockId)
  const loadBlocks = useBlockStore((state) => state.loadBlocks)
  const setActiveBlock = useBlockStore((state) => state.setActiveBlock)
  const assets = useAssetStore((state) => state.assets)
  const importAsset = useAssetStore((state) => state.importAsset)
  const loadAssets = useAssetStore((state) => state.loadAssets)
  const workspaceSidebarWidth = useUiStore((state) => state.workspaceSidebarWidth)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const setWorkspaceSidebarWidth = useUiStore((state) => state.setWorkspaceSidebarWidth)
  const workspacePreviewVisible = useUiStore((state) => state.workspacePreviewVisible)
  const workspacePreviewWidth = useUiStore((state) => state.workspacePreviewWidth)
  const setWorkspacePreviewWidth = useUiStore((state) => state.setWorkspacePreviewWidth)
  const setWorkspacePreviewVisible = useUiStore((state) => state.setWorkspacePreviewVisible)
  const toggleWorkspacePreview = useUiStore((state) => state.toggleWorkspacePreview)
  const pushToast = useToastStore((state) => state.push)
  const { isResizing, onPointerDown } = useResizableWidth({
    value: workspaceSidebarWidth,
    min: 240,
    max: 520,
    onChange: setWorkspaceSidebarWidth
  })
  const { isResizing: isPreviewResizing, onPointerDown: onPreviewPointerDown } = useResizableWidth({
    value: workspacePreviewWidth,
    min: 320,
    max: 760,
    onChange: setWorkspacePreviewWidth,
    side: 'right'
  })

  useEffect(() => {
    if (!projectId) {
      return
    }

    void loadProject(projectId)
    void loadBlocks(projectId)
    void loadAssets(projectId)
    void loadProjectConnections(projectId)
  }, [loadAssets, loadBlocks, loadProject, loadProjectConnections, projectId])

  useEffect(() => {
    if (!activeBlockId) {
      return
    }

    const node = document.querySelector<HTMLElement>(`[data-canvas-block-id="${activeBlockId}"]`)
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeBlockId])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        toggleWorkspacePreview()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleWorkspacePreview])

  const handleImportAssets = useCallback(async () => {
    const filePaths = await window.lab.system.openFiles({
      title: 'Import Assets',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Supported assets',
          extensions: [
            'png',
            'jpg',
            'jpeg',
            'webp',
            'gif',
            'avif',
            'svg',
            'stl',
            'step',
            'stp',
            'obj',
            'pdf',
            'md',
            'txt',
            'csv'
          ]
        }
      ]
    })

    const results = await Promise.allSettled(
      filePaths.map((filePath) => importAsset(projectId, filePath))
    )
    const importedCount = results.filter((result) => result.status === 'fulfilled').length
    const failedCount = results.length - importedCount

    if (importedCount > 0) {
      pushToast({
        message: `Imported ${importedCount} asset${importedCount === 1 ? '' : 's'}`,
        type: 'success'
      })
    }

    if (failedCount > 0) {
      pushToast({
        message: `${failedCount} asset import${failedCount === 1 ? '' : 's'} failed`,
        type: 'error'
      })
    }
  }, [importAsset, projectId, pushToast])

  if (!project) {
    return <div style={{ padding: 32 }}>Loading project workspace…</div>
  }

  return (
    <div className="routeShell" data-reduced-chrome={reducedChrome}>
      <TitleBar project={project} view="workspace" />
      <div
        className={`${styles.shell} ${workspacePreviewVisible ? styles.withPreview : ''}`}
        style={
          {
            '--workspace-sidebar-width': `${workspaceSidebarWidth}px`,
            '--workspace-preview-width': `${workspacePreviewWidth}px`
          } as CSSProperties
        }
      >
        <WorkspaceSidebar
          activeBlockId={activeBlockId}
          assets={assets}
          blocks={blocks}
          connections={projectConnections}
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
            <span>{blocks.length} block{blocks.length === 1 ? '' : 's'}</span>
            {!reducedChrome ? (
              <>
                <span>{blocks.filter((block) => block.visible_on_page).length} visible publicly</span>
                <span>{workspacePreviewVisible ? 'Live preview open' : 'Live preview hidden'}</span>
              </>
            ) : null}
          </div>
        </main>
        {workspacePreviewVisible ? (
          <>
            <ResizeHandle
              active={isPreviewResizing}
              ariaLabel="Resize workspace preview"
              onPointerDown={onPreviewPointerDown}
            />
            <div className={styles.previewPane}>
              <PublicPagePreview
                blocks={blocks}
                onClose={() => setWorkspacePreviewVisible(false)}
                onFocusBlock={setActiveBlock}
                project={project}
              />
            </div>
          </>
        ) : null}
      </div>
      <BlockPickerModal projectId={projectId} />
    </div>
  )
}
