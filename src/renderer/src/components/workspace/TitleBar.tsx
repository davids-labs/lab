import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '@preload/types'
import { GitPanelModal } from '@renderer/components/git/GitPanelModal'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './TitleBar.module.css'

interface TitleBarProps {
  project: Project
  view: 'workspace' | 'customise' | 'preview'
}

export function TitleBar({ project, view }: TitleBarProps): JSX.Element {
  const navigate = useNavigate()
  const loadProject = useProjectStore((state) => state.loadProject)
  const updateProject = useProjectStore((state) => state.updateProject)
  const saveState = useUiStore((state) => state.saveState)
  const workspacePreviewVisible = useUiStore((state) => state.workspacePreviewVisible)
  const toggleWorkspacePreview = useUiStore((state) => state.toggleWorkspacePreview)
  const pushToast = useToastStore((state) => state.push)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(project.name)
  const [exporting, setExporting] = useState<'html' | 'zip' | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [gitOpen, setGitOpen] = useState(false)

  useEffect(() => setDraftName(project.name), [project.name])

  async function handleRename(): Promise<void> {
    if (!draftName.trim() || draftName.trim() === project.name) {
      setEditingName(false)
      setDraftName(project.name)
      return
    }

    await updateProject({ id: project.id, name: draftName.trim() })
    setEditingName(false)
  }

  async function handleExport(kind: 'html' | 'zip'): Promise<void> {
    setExporting(kind)

    try {
      const result =
        kind === 'html'
          ? await window.lab.page.exportHtml(project.id)
          : await window.lab.page.exportZip(project.id)

      if (!result.ok) {
        pushToast({
          message: `Cancelled ${kind.toUpperCase()} export.`,
          type: 'info'
        })
        return
      }

      pushToast({
        message: `Exported ${kind.toUpperCase()} to ${result.path}`,
        type: 'success'
      })
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : `Failed to export ${kind.toUpperCase()}.`,
        type: 'error'
      })
    } finally {
      setExporting(null)
    }
  }

  async function handlePublish(): Promise<void> {
    setPublishing(true)

    try {
      const result = await window.lab.git.publish(project.id)
      await loadProject(project.id)
      pushToast({
        message: result.url ? `Published at ${result.url}` : 'Publish completed.',
        type: 'success'
      })
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Failed to publish project.',
        type: 'error'
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/ecosystem')}>
          Back
        </Button>
        <div className={styles.title}>
          {editingName ? (
            <InputField
              autoFocus
              value={draftName}
              onBlur={() => void handleRename()}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleRename()
                }
              }}
            />
          ) : (
            <>
              <span className={styles.projectName}>{project.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditingName(true)}>
                Rename
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <Button
          variant={view === 'workspace' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => navigate(`/project/${project.id}`)}
        >
          Workspace
        </Button>
        <Button
          variant={view === 'customise' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => navigate(`/project/${project.id}/customise`)}
        >
          Customise
        </Button>
        <Button
          variant={view === 'preview' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => navigate(`/project/${project.id}/preview`)}
        >
          Public Page
        </Button>
        {view === 'workspace' ? (
          <Button
            variant={workspacePreviewVisible ? 'primary' : 'outline'}
            size="sm"
            onClick={toggleWorkspacePreview}
          >
            {workspacePreviewVisible ? 'Hide Preview' : 'Show Preview'}
          </Button>
        ) : null}
        <Button
          variant={project.git_enabled ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => setGitOpen(true)}
        >
          Git
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void window.lab.system.toggleFullscreen()}>
          Fullscreen
        </Button>
        {view === 'customise' && project.git_enabled ? (
          <Button size="sm" disabled={publishing} onClick={() => void handlePublish()}>
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          disabled={exporting !== null}
          onClick={() => void handleExport('html')}
        >
          {exporting === 'html' ? 'Exporting HTML…' : 'Export HTML'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting !== null}
          onClick={() => void handleExport('zip')}
        >
          {exporting === 'zip' ? 'Exporting ZIP…' : 'Export ZIP'}
        </Button>
        <span className={styles.status}>
          {saveState === 'saved'
            ? 'Saved'
            : saveState === 'saving'
              ? 'Saving…'
              : saveState === 'error'
                ? 'Save failed'
                : 'Idle'}
        </span>
      </div>
      {gitOpen ? <GitPanelModal onClose={() => setGitOpen(false)} project={project} /> : null}
    </header>
  )
}
