import { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PublicPagePreview } from '@renderer/components/preview/PublicPagePreview'
import { TitleBar } from '@renderer/components/workspace/TitleBar'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import styles from './ProjectPreview.module.css'

export function ProjectPreview(): JSX.Element {
  const navigate = useNavigate()
  const params = useParams()
  const projectId = params.id ?? ''
  const project = useProjectStore((state) => state.activeProject)
  const loadProject = useProjectStore((state) => state.loadProject)
  const blocks = useBlockStore((state) => state.blocks)
  const loadBlocks = useBlockStore((state) => state.loadBlocks)
  const setActiveBlock = useBlockStore((state) => state.setActiveBlock)

  useEffect(() => {
    if (!projectId) {
      return
    }

    void loadProject(projectId)
    void loadBlocks(projectId)
  }, [loadBlocks, loadProject, projectId])

  const handleFocusBlock = useCallback(
    (blockId: string) => {
      setActiveBlock(blockId)
      navigate(`/project/${projectId}`)
    },
    [navigate, projectId, setActiveBlock]
  )

  if (!project) {
    return <div style={{ padding: 32 }}>Loading preview…</div>
  }

  return (
    <div className="routeShell">
      <TitleBar project={project} view="preview" />
      <div className={styles.shell}>
        <PublicPagePreview
          blocks={blocks}
          onFocusBlock={handleFocusBlock}
          project={project}
          showBorder={false}
        />
      </div>
    </div>
  )
}
