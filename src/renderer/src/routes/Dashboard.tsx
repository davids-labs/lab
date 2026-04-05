import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../../../preload/types'
import { Badge } from '@renderer/components/ui/Badge'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { Modal } from '@renderer/components/ui/Modal'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { formatRelativeTime } from '@renderer/utils/relativeTime'

export function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const { createProject, deleteProject, error, filter, loadProjects, projects, setFilter } =
    useProjectStore()
  const pushToast = useToastStore((state) => state.push)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [isCreating, setIsCreating] = useState(false)
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
    const trimmedName = name.trim()

    if (!trimmedName) {
      setNameError('Project name is required.')
      pushToast({ message: 'Add a project name before creating it.', type: 'error' })
      return
    }

    setIsCreating(true)
    setNameError(undefined)

    try {
      const project = await createProject({ name: trimmedName, type })
      setCreateOpen(false)
      setName('')
      navigate(`/project/${project.id}`)
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Failed to create project.',
        type: 'error'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div style={{ padding: 32, display: 'grid', gap: 24 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}
      >
        <div>
          <div
            style={{
              color: 'var(--lab-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            LAB
          </div>
          <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--lab-font-sans)' }}>Projects</h1>
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

      {error ? (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(201, 108, 92, 0.3)',
            background: 'rgba(201, 108, 92, 0.1)',
            color: '#ffd5d5'
          }}
        >
          {error}
        </div>
      ) : null}

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
              borderRadius: 14,
              border: '1px solid var(--lab-border)',
              background: 'var(--lab-surface)',
              padding: 20,
              display: 'grid',
              gap: 16
            }}
          >
            <div
              style={{
                minHeight: 180,
                borderRadius: 10,
                border: '1px solid var(--lab-border)',
                background:
                  'linear-gradient(135deg, rgba(79,140,255,0.12), rgba(255,255,255,0.02) 48%, rgba(79,140,255,0.04))'
              }}
            />
            <div style={{ display: 'grid', gap: 12 }}>
              <Badge type={project.type} />
              <div>
                <h2 style={{ margin: 0, fontFamily: 'var(--lab-font-sans)' }}>{project.name}</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--lab-text-muted)' }}>
                  {project.subtitle || 'No subtitle yet'}
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  alignItems: 'center'
                }}
              >
                <span style={{ color: 'var(--lab-text-muted)' }}>
                  Updated {formatRelativeTime(project.updated_at)}
                </span>
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
          <InputField
            label="Project Name"
            value={name}
            error={nameError}
            onChange={(event) => {
              setName(event.target.value)
              if (nameError) {
                setNameError(undefined)
              }
            }}
          />
          <label style={{ display: 'grid', gap: 8 }}>
            <span
              style={{
                color: 'var(--lab-text-muted)',
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Type
            </span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as Project['type'])}
              style={{
                border: '1px solid var(--lab-border)',
                borderRadius: 8,
                background: 'var(--lab-surface-2)',
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
          <Button disabled={isCreating} onClick={() => void handleCreate()}>
            {isCreating ? 'Creating…' : 'Create'}
          </Button>
        </Modal>
      ) : null}
    </div>
  )
}
