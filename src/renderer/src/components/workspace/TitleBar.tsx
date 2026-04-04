import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useUiStore } from '@renderer/stores/uiStore'
import { useToastStore } from '@renderer/stores/toastStore'
import styles from './TitleBar.module.css'

interface TitleBarProps {
  project: Project
  view: 'workspace' | 'customise'
}

export function TitleBar({ project, view }: TitleBarProps): JSX.Element {
  const navigate = useNavigate()
  const updateProject = useProjectStore((state) => state.updateProject)
  const previewVisible = useUiStore((state) => state.previewVisible)
  const togglePreview = useUiStore((state) => state.togglePreview)
  const saveState = useUiStore((state) => state.saveState)
  const pushToast = useToastStore((state) => state.push)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(project.name)

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

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
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
        {view === 'workspace' ? (
          <Button variant="outline" size="sm" onClick={togglePreview}>
            {previewVisible ? 'Hide Preview' : 'Show Preview'}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void window.lab.page.exportHtml(project.id).then((result) => {
              if (result.ok) {
                pushToast({ message: `Exported HTML to ${result.path}`, type: 'success' })
              }
            })
          }
        >
          Export HTML
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void window.lab.page.exportZip(project.id).then((result) => {
              if (result.ok) {
                pushToast({ message: `Exported ZIP to ${result.path}`, type: 'success' })
              }
            })
          }
        >
          Export ZIP
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
    </header>
  )
}
