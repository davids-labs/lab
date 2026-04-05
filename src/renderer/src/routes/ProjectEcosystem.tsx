import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROJECT_EXECUTION_STAGES, type Project } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { Modal } from '@renderer/components/ui/Modal'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { formatRelativeTime } from '@renderer/utils/relativeTime'
import pageStyles from './CommandCenterPages.module.css'

export function ProjectEcosystem(): JSX.Element {
  const navigate = useNavigate()
  const { createProject, deleteProject, filter, loadProjects, projects, setFilter, updateProject } =
    useProjectStore()
  const pushToast = useToastStore((state) => state.push)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<Project['type']>('build')

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const filteredProjects = useMemo(() => {
    if (filter === 'all') {
      return projects
    }

    return projects.filter((project) => project.type === filter)
  }, [filter, projects])

  async function handleCreateProject(): Promise<void> {
    if (!name.trim()) {
      pushToast({ message: 'Project name is required.', type: 'error' })
      return
    }

    const project = await createProject({ name: name.trim(), type })
    setCreateOpen(false)
    setName('')
    navigate(`/project/${project.id}`)
  }

  async function handleStageChange(projectId: string, executionStage: Project['execution_stage']): Promise<void> {
    await updateProject({ id: projectId, execution_stage: executionStage })
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Project Ecosystem</span>
          <h1 className={pageStyles.title}>Portfolio Architecture</h1>
          <p className={pageStyles.description}>
            The block editor remains intact here, but now it sits inside the wider command center.
          </p>
        </section>

        <section className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Projects</h2>
              <p className={pageStyles.description}>
                Manage tier, execution stage, and the route into the existing high-polish workspace.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>New Project</Button>
          </div>
          <div className={pageStyles.pillRow}>
            {(['all', 'hero', 'build', 'design', 'concept'] as const).map((entry) => (
              <button
                key={entry}
                className={pageStyles.pill}
                onClick={() => setFilter(entry)}
                type="button"
                style={{
                  background:
                    filter === entry ? 'rgba(0, 113, 227, 0.08)' : 'var(--lab-surface-muted)'
                }}
              >
                {entry}
              </button>
            ))}
          </div>
        </section>

        <section className={pageStyles.grid3}>
          {filteredProjects.map((project) => (
            <article key={project.id} className={pageStyles.card}>
              <div className={pageStyles.sectionHeader}>
                <h2 className={pageStyles.cardTitle}>{project.name}</h2>
                <span className={pageStyles.pill}>{project.type}</span>
              </div>
              <p className={pageStyles.description}>
                {project.subtitle || 'No subtitle yet. Add one in the workspace or customise flow.'}
              </p>
              <label className={pageStyles.formGrid}>
                <span className={pageStyles.eyebrow}>Execution Stage</span>
                <select
                  value={project.execution_stage}
                  onChange={(event) =>
                    void handleStageChange(
                      project.id,
                      event.target.value as Project['execution_stage']
                    )
                  }
                >
                  {PROJECT_EXECUTION_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <div className={pageStyles.inlineRow}>
                <Button size="sm" onClick={() => navigate(`/project/${project.id}`)}>
                  Open Workspace
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/project/${project.id}/customise`)}
                >
                  Public Page
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void deleteProject(project.id)}>
                  Delete
                </Button>
              </div>
              <span className={pageStyles.muted}>Updated {formatRelativeTime(project.updated_at)}</span>
            </article>
          ))}
        </section>
      </div>

      {createOpen ? (
        <Modal onClose={() => setCreateOpen(false)} title="Create Project">
          <InputField
            label="Project Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <label className={pageStyles.formGrid}>
            <span className={pageStyles.eyebrow}>Tier</span>
            <select value={type} onChange={(event) => setType(event.target.value as Project['type'])}>
              <option value="hero">Hero</option>
              <option value="build">Build</option>
              <option value="design">Design</option>
              <option value="concept">Concept</option>
            </select>
          </label>
          <Button onClick={() => void handleCreateProject()}>Create Project</Button>
        </Modal>
      ) : null}
    </div>
  )
}
