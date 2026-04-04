import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../../../preload/types'
import { Badge } from '@renderer/components/ui/Badge'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { Modal } from '@renderer/components/ui/Modal'
import { useProjectStore } from '@renderer/stores/projectStore'
import { formatRelativeTime } from '@renderer/utils/relativeTime'

export function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const {
    createProject,
    deleteProject,
    filter,
    loadProjects,
    projects,
    setFilter
  } = useProjectStore()
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

  async function handleCreate(): Promise<void> {
    if (!name.trim()) {
      return
    }

    const project = await createProject({ name, type })
    setCreateOpen(false)
    setName('')
    navigate(`/project/${project.id}`)
  }

  return (
    <div style={{ padding: 32, display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <div>
          <div style={{ color: 'var(--lab-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>LAB</div>
          <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--lab-font-sans)' }}>Project Workspace</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New Project</Button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', 'hero', 'build', 'design', 'concept'] as const).map((entry) => (
          <Button
            key={entry}
            variant={filter === entry ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(entry)}
          >
            {entry}
          </Button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gap: 20,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}
      >
        {filteredProjects.map((project) => (
          <article
            key={project.id}
            onClick={() => navigate(`/project/${project.id}`)}
            role="presentation"
            style={{
              borderRadius: 24,
              border: '1px solid var(--lab-border)',
              background: 'linear-gradient(180deg, rgba(35,39,48,0.94), rgba(26,29,36,0.98))',
              padding: 20,
              display: 'grid',
              gap: 16
            }}
          >
            <div
              style={{
                minHeight: 180,
                borderRadius: 16,
                background:
                  'linear-gradient(135deg, rgba(0,229,255,0.24), rgba(255,42,109,0.2), rgba(255,180,0,0.18))'
              }}
            />
            <div style={{ display: 'grid', gap: 12 }}>
              <Badge type={project.type} />
              <div>
                <h2 style={{ margin: 0, fontFamily: 'var(--lab-font-sans)' }}>{project.name}</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--lab-text-muted)' }}>{project.subtitle || 'No subtitle yet'}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <span style={{ color: 'var(--lab-text-muted)' }}>Updated {formatRelativeTime(project.updated_at)}</span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    void deleteProject(project.id)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {createOpen ? (
        <Modal onClose={() => setCreateOpen(false)} title="Create Project">
          <InputField label="Project Name" value={name} onChange={(event) => setName(event.target.value)} />
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ color: 'var(--lab-text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Type
            </span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as Project['type'])}
              style={{
                border: '1px solid var(--lab-border)',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--lab-text)',
                padding: '10px 12px'
              }}
            >
              <option value="hero">Hero</option>
              <option value="build">Build</option>
              <option value="design">Design</option>
              <option value="concept">Concept</option>
            </select>
          </label>
          <Button onClick={() => void handleCreate()}>Create</Button>
        </Modal>
      ) : null}
    </div>
  )
}
