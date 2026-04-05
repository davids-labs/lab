import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, Legend, LineElement, PointElement, RadialLinearScale, Tooltip } from 'chart.js'
import { PROJECT_EXECUTION_STAGES, SKILL_EVIDENCE_SOURCE_TYPES } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSkillsStore } from '@renderer/stores/skillsStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'

Chart.register(RadialLinearScale, PointElement, LineElement, Tooltip, Legend)

export function SkillMatrix(): JSX.Element {
  const radarRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart<'radar'> | null>(null)
  const {
    activeDomainId,
    activeNodeDetail,
    activeNodeId,
    addEvidence,
    confirmEvidence,
    createDomain,
    createNode,
    deleteEvidence,
    domains,
    loadDomains,
    loadNodeDetail,
    loadNodes,
    nodes,
    setActiveDomainId
  } = useSkillsStore()
  const projects = useProjectStore((state) => state.projects)
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const pushToast = useToastStore((state) => state.push)
  const [domainTitle, setDomainTitle] = useState('')
  const [nodeTitle, setNodeTitle] = useState('')
  const [evidenceDraft, setEvidenceDraft] = useState({
    source_type: 'project' as (typeof SKILL_EVIDENCE_SOURCE_TYPES)[number],
    label: '',
    project_id: '',
    certification_name: '',
    link_url: '',
    required_stage: 'validation' as (typeof PROJECT_EXECUTION_STAGES)[number],
    notes: ''
  })

  useEffect(() => {
    void loadDomains()
    void loadProjects()
  }, [loadDomains, loadProjects])

  useEffect(() => {
    void loadNodes(activeDomainId)
  }, [activeDomainId, loadNodes])

  useEffect(() => {
    if (nodes[0] && !activeNodeId) {
      void loadNodeDetail(nodes[0].id)
    }
  }, [activeNodeId, loadNodeDetail, nodes])

  useEffect(() => {
    if (activeNodeId) {
      void loadNodeDetail(activeNodeId)
    }
  }, [activeNodeId, loadNodeDetail])

  useEffect(() => {
    if (!radarRef.current) {
      return
    }

    chartRef.current?.destroy()
    chartRef.current = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels: domains.map((domain) => domain.title),
        datasets: [
          {
            label: 'Verified Coverage',
            data: domains.map((domain) =>
              domain.total_nodes > 0 ? (domain.verified_nodes / domain.total_nodes) * 10 : 0
            ),
            backgroundColor: 'rgba(0, 113, 227, 0.12)',
            borderColor: 'rgba(0, 113, 227, 1)',
            pointBackgroundColor: 'rgba(0, 113, 227, 1)',
            borderWidth: 2
          },
          {
            label: 'Target Readiness',
            data: domains.map(() => 10),
            backgroundColor: 'rgba(255, 59, 48, 0.08)',
            borderColor: 'rgba(255, 59, 48, 0.64)',
            pointBackgroundColor: 'rgba(255, 59, 48, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 10,
            angleLines: { color: 'rgba(0,0,0,0.08)' },
            grid: { color: 'rgba(0,0,0,0.08)' },
            pointLabels: {
              color: '#515154',
              font: {
                family: 'Inter, Segoe UI, sans-serif',
                size: 11
              }
            },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#515154',
              font: { family: 'Inter, Segoe UI, sans-serif', size: 11 }
            }
          }
        }
      }
    })

    return () => chartRef.current?.destroy()
  }, [domains])

  const domainNodes = useMemo(
    () => nodes.filter((node) => !activeDomainId || node.domain_id === activeDomainId),
    [activeDomainId, nodes]
  )

  async function handleCreateDomain(): Promise<void> {
    if (!domainTitle.trim()) {
      return
    }

    const domain = await createDomain({ title: domainTitle.trim() })
    setDomainTitle('')
    setActiveDomainId(domain.id)
    await loadNodes(domain.id)
  }

  async function handleCreateNode(): Promise<void> {
    if (!activeDomainId || !nodeTitle.trim()) {
      return
    }

    const node = await createNode({
      domain_id: activeDomainId,
      title: nodeTitle.trim()
    })
    setNodeTitle('')
    await loadNodeDetail(node.id)
  }

  async function handleAddEvidence(): Promise<void> {
    if (!activeNodeDetail || !evidenceDraft.label.trim()) {
      return
    }

    await addEvidence({
      skill_id: activeNodeDetail.skill.id,
      source_type: evidenceDraft.source_type,
      label: evidenceDraft.label.trim(),
      project_id: evidenceDraft.source_type === 'project' ? evidenceDraft.project_id || null : null,
      certification_name:
        evidenceDraft.source_type === 'certification'
          ? evidenceDraft.certification_name || null
          : null,
      link_url: evidenceDraft.source_type === 'link' ? evidenceDraft.link_url || null : null,
      required_stage: evidenceDraft.source_type === 'project' ? evidenceDraft.required_stage : null,
      notes: evidenceDraft.notes || null
    })

    setEvidenceDraft({
      source_type: 'project',
      label: '',
      project_id: projects[0]?.id ?? '',
      certification_name: '',
      link_url: '',
      required_stage: 'validation',
      notes: ''
    })
    pushToast({ message: 'Evidence attached to skill.', type: 'success' })
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Skill Matrix</span>
          <h1 className={pageStyles.title}>Evidence-Based Readiness</h1>
          <p className={pageStyles.description}>
            Skills are not self-scored here. They become verified only when evidence is attached and
            confirmed.
          </p>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Domain Coverage</h2>
              <span className={pageStyles.pill}>{domains.length} domains</span>
            </div>
            <div style={{ height: 320 }}>
              <canvas ref={radarRef} />
            </div>
          </article>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Add Domain</h2>
              <span className={pageStyles.pill}>Buckets</span>
            </div>
            <div className={pageStyles.inlineRow}>
              <InputField
                placeholder="Mechanical IQ"
                value={domainTitle}
                onChange={(event) => setDomainTitle(event.target.value)}
              />
              <Button onClick={() => void handleCreateDomain()}>Add Domain</Button>
            </div>
            <div className={pageStyles.pillRow}>
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  className={pageStyles.pill}
                  onClick={() => setActiveDomainId(domain.id)}
                  type="button"
                  style={{
                    background:
                      domain.id === activeDomainId ? 'rgba(0, 113, 227, 0.08)' : 'var(--lab-surface-muted)'
                  }}
                >
                  {domain.title}
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className={pageStyles.split}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Domains</h2>
            </div>
            <div className={pageStyles.list}>
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  className={pageStyles.listRow}
                  type="button"
                  onClick={() => setActiveDomainId(domain.id)}
                  style={{ textAlign: 'left' }}
                >
                  <strong>{domain.title}</strong>
                  <span className={pageStyles.muted}>
                    {domain.verified_nodes}/{domain.total_nodes} verified
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Nodes</h2>
            </div>
            <div className={pageStyles.inlineRow}>
              <InputField
                placeholder="Add skill node"
                value={nodeTitle}
                onChange={(event) => setNodeTitle(event.target.value)}
              />
              <Button onClick={() => void handleCreateNode()}>Add Node</Button>
            </div>
            <div className={pageStyles.list}>
              {domainNodes.map((node) => (
                <button
                  key={node.id}
                  className={pageStyles.listRow}
                  type="button"
                  onClick={() => void loadNodeDetail(node.id)}
                  style={{ textAlign: 'left' }}
                >
                  <strong>{node.title}</strong>
                  <span className={pageStyles.muted}>
                    {node.state.replace(/_/g, ' ')} · {node.evidence_count} evidence items
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Evidence Linking</h2>
              {activeNodeDetail ? <span className={pageStyles.pill}>{activeNodeDetail.skill.state}</span> : null}
            </div>
            {activeNodeDetail ? (
              <div className={pageStyles.formGrid}>
                <div>
                  <strong>{activeNodeDetail.skill.title}</strong>
                  <p className={pageStyles.description}>
                    {activeNodeDetail.skill.description ?? 'Add a description to clarify the proof required.'}
                  </p>
                </div>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Evidence Type</span>
                  <select
                    value={evidenceDraft.source_type}
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({
                        ...current,
                        source_type: event.target.value as (typeof SKILL_EVIDENCE_SOURCE_TYPES)[number]
                      }))
                    }
                  >
                    <option value="project">Project</option>
                    <option value="certification">Certification</option>
                    <option value="link">Link</option>
                  </select>
                </label>
                <InputField
                  label="Label"
                  value={evidenceDraft.label}
                  onChange={(event) =>
                    setEvidenceDraft((current) => ({ ...current, label: event.target.value }))
                  }
                />
                {evidenceDraft.source_type === 'project' ? (
                  <>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Project</span>
                      <select
                        value={evidenceDraft.project_id}
                        onChange={(event) =>
                          setEvidenceDraft((current) => ({
                            ...current,
                            project_id: event.target.value
                          }))
                        }
                      >
                        <option value="">Select project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Required Stage</span>
                      <select
                        value={evidenceDraft.required_stage}
                        onChange={(event) =>
                          setEvidenceDraft((current) => ({
                            ...current,
                            required_stage: event.target.value as (typeof PROJECT_EXECUTION_STAGES)[number]
                          }))
                        }
                      >
                        {PROJECT_EXECUTION_STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}
                {evidenceDraft.source_type === 'certification' ? (
                  <InputField
                    label="Certification"
                    value={evidenceDraft.certification_name}
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({
                        ...current,
                        certification_name: event.target.value
                      }))
                    }
                  />
                ) : null}
                {evidenceDraft.source_type === 'link' ? (
                  <InputField
                    label="Link"
                    value={evidenceDraft.link_url}
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({ ...current, link_url: event.target.value }))
                    }
                  />
                ) : null}
                <TextareaField
                  label="Notes"
                  rows={3}
                  value={evidenceDraft.notes}
                  onChange={(event) =>
                    setEvidenceDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                />
                <Button onClick={() => void handleAddEvidence()}>Attach Evidence</Button>
                <div className={pageStyles.list}>
                  {activeNodeDetail.evidence.map((evidence) => (
                    <div key={evidence.id} className={pageStyles.listRow}>
                      <strong>{evidence.label}</strong>
                      <span className={pageStyles.muted}>
                        {evidence.source_type} · {evidence.status}
                      </span>
                      <div className={pageStyles.inlineRow}>
                        {evidence.status === 'suggested' ? (
                          <Button size="sm" onClick={() => void confirmEvidence(evidence.id)}>
                            Confirm Verification
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void deleteEvidence(evidence.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className={pageStyles.description}>Select a skill node to attach evidence.</p>
            )}
          </article>
        </section>
      </div>
    </div>
  )
}
