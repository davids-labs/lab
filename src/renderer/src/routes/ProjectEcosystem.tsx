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
import styles from './ProjectEcosystem.module.css'

type EcosystemView = 'table' | 'board'

export function ProjectEcosystem(): JSX.Element {
  const navigate = useNavigate()
  const { createProject, deleteProject, filter, loadProjects, projects, setFilter, updateProject } =
    useProjectStore()
  const pushToast = useToastStore((state) => state.push)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<Project['type']>('build')
  const [view, setView] = useState<EcosystemView>('table')

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const filteredProjects = useMemo(() => {
    if (filter === 'all') {
      return projects
    }

    return projects.filter((project) => project.type === filter)
  }, [filter, projects])

  const groupedByStage = useMemo(
    () =>
      Object.fromEntries(
        PROJECT_EXECUTION_STAGES.map((stage) => [
          stage,
          filteredProjects.filter((project) => project.execution_stage === stage)
        ])
      ) as Record<Project['execution_stage'], Project[]>,
    [filteredProjects]
  )

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

  async function handleStageChange(
    projectId: string,
    executionStage: Project['execution_stage']
  ): Promise<void> {
    await updateProject({ id: projectId, execution_stage: executionStage })
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Proof / Projects</span>
          <h1 className={pageStyles.title}>Project ecosystem</h1>
          <p className={pageStyles.description}>
            Projects should behave like a working database: sortable, filterable, and quiet by
            default, with the editor only one click away.
          </p>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Views</h2>
              <p className={pageStyles.sectionDescription}>
                Use the table when you need a calm operational view, or switch to board mode to
                read execution stage distribution at a glance.
              </p>
            </div>
            <div className={pageStyles.inlineActions}>
              <div className={pageStyles.tabs}>
                <button
                  className={`${pageStyles.tab} ${view === 'table' ? pageStyles.tabActive : ''}`}
                  onClick={() => setView('table')}
                  type="button"
                >
                  Table
                </button>
                <button
                  className={`${pageStyles.tab} ${view === 'board' ? pageStyles.tabActive : ''}`}
                  onClick={() => setView('board')}
                  type="button"
                >
                  Board
                </button>
              </div>
              <div className={pageStyles.chipRow}>
                {(['all', 'hero', 'build', 'design', 'concept'] as const).map((entry) => (
                  <button
                    key={entry}
                    className={`${pageStyles.chip} ${filter === entry ? pageStyles.chipActive : ''}`}
                    onClick={() => setFilter(entry)}
                    type="button"
                  >
                    {entry}
                  </button>
                ))}
              </div>
              <Button onClick={() => setCreateOpen(true)}>New project</Button>
            </div>
          </div>

          {view === 'table' ? (
            <div className={pageStyles.table}>
              <div className={pageStyles.tableHeader}>
                <div>Name</div>
                <div>Tier</div>
                <div>Stage</div>
                <div>Status</div>
                <div>Updated</div>
                <div />
              </div>
              {filteredProjects.map((project) => (
                <div key={project.id} className={pageStyles.tableRow}>
                  <div className={pageStyles.tableCell}>
                    <strong>{project.name}</strong>
                    <span>
                      {project.subtitle || 'No subtitle yet. Add positioning in the workspace.'}
                    </span>
                  </div>
                  <div className={pageStyles.tableCell}>
                    <strong>{project.type}</strong>
                    <span>Portfolio tier</span>
                  </div>
                  <div className={pageStyles.tableCell}>
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
                  </div>
                  <div className={pageStyles.tableCell}>
                    <strong>{project.status}</strong>
                    <span>{project.git_enabled ? 'Git enabled' : 'Local only'}</span>
                  </div>
                  <div className={pageStyles.tableCell}>
                    <strong>{formatRelativeTime(project.updated_at)}</strong>
                    <span>Last updated</span>
                  </div>
                  <div className={styles.rowActions}>
                    <Button size="sm" onClick={() => navigate(`/project/${project.id}`)}>
                      Open
                    </Button>
                    <details className={styles.menu}>
                      <summary className={styles.menuTrigger}>More</summary>
                      <div className={styles.menuPanel}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/project/${project.id}/customise`)}
                        >
                          Customise
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/project/${project.id}/preview`)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void deleteProject(project.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
              {filteredProjects.length === 0 ? (
                <div className={styles.tableEmpty}>No projects match this filter yet.</div>
              ) : null}
            </div>
          ) : (
            <div className={styles.board}>
              {PROJECT_EXECUTION_STAGES.map((stage) => (
                <section key={stage} className={styles.boardColumn}>
                  <div className={styles.boardHeader}>
                    <strong>{stage.replace(/_/g, ' ')}</strong>
                    <span>{groupedByStage[stage].length}</span>
                  </div>
                  <div className={styles.boardList}>
                    {groupedByStage[stage].map((project) => (
                      <button
                        key={project.id}
                        className={styles.boardCard}
                        onClick={() => navigate(`/project/${project.id}`)}
                        type="button"
                      >
                        <strong>{project.name}</strong>
                        <span>
                          {project.type} · updated {formatRelativeTime(project.updated_at)}
                        </span>
                      </button>
                    ))}
                    {groupedByStage[stage].length === 0 ? (
                      <div className={styles.boardEmpty}>No projects in this stage.</div>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      {createOpen ? (
        <Modal onClose={() => setCreateOpen(false)} title="Create Project">
          <InputField
            label="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <label className={pageStyles.formGrid}>
            <span className={pageStyles.eyebrow}>Tier</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as Project['type'])}
            >
              <option value="hero">Hero</option>
              <option value="build">Build</option>
              <option value="design">Design</option>
              <option value="concept">Concept</option>
            </select>
          </label>
          <Button onClick={() => void handleCreateProject()}>Create project</Button>
        </Modal>
      ) : null}
    </div>
  )
}
