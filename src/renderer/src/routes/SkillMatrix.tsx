import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Chart,
  Legend,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip
} from 'chart.js'
import { PROJECT_EXECUTION_STAGES, SKILL_EVIDENCE_SOURCE_TYPES } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSkillsStore } from '@renderer/stores/skillsStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './SkillMatrix.module.css'

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Tooltip, Legend)

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
  const reducedChrome = useUiStore((state) => state.reducedChrome)
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

    if (domains.length === 0) {
      return
    }

    chartRef.current = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels: domains.map((domain) => domain.title),
        datasets: [
          {
            label: 'Verified coverage',
            data: domains.map((domain) =>
              domain.total_nodes > 0 ? (domain.verified_nodes / domain.total_nodes) * 10 : 0
            ),
            backgroundColor: 'rgba(47, 111, 235, 0.08)',
            borderColor: 'rgba(47, 111, 235, 0.88)',
            pointBackgroundColor: 'rgba(47, 111, 235, 1)',
            borderWidth: 2
          },
          {
            label: 'Target line',
            data: domains.map(() => 10),
            backgroundColor: 'rgba(43, 41, 38, 0.03)',
            borderColor: 'rgba(43, 41, 38, 0.34)',
            pointBackgroundColor: 'rgba(43, 41, 38, 0.55)',
            borderWidth: 1
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
            angleLines: { color: 'rgba(55, 53, 47, 0.1)' },
            grid: { color: 'rgba(55, 53, 47, 0.08)' },
            pointLabels: {
              color: '#6e675f',
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
              color: '#6e675f',
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
    <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Proof / Skills</span>
          <h1 className={pageStyles.title}>Evidence-based skill matrix</h1>
          <p className={pageStyles.description}>
            Domains, nodes, and evidence should read like a quiet collection-detail workflow. The
            chart is context, not the page itself.
          </p>
        </section>

        <section className={pageStyles.twoColumn}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Coverage map</h2>
                <p className={pageStyles.sectionDescription}>
                  A high-level read on how verified each domain is becoming.
                </p>
              </div>
              <span className={pageStyles.chip}>{domains.length} domains</span>
            </div>
            <div className={styles.chartWrap}>
              <canvas ref={radarRef} />
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>New domain</h2>
                <p className={pageStyles.sectionDescription}>
                  Domain buckets keep the matrix readable when the skill tree grows.
                </p>
              </div>
            </div>
            <div className={pageStyles.inlineActions}>
              <InputField
                placeholder="Mechanical IQ"
                value={domainTitle}
                onChange={(event) => setDomainTitle(event.target.value)}
              />
              <Button onClick={() => void handleCreateDomain()}>Add domain</Button>
            </div>
            <div className={pageStyles.chipRow}>
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  className={`${pageStyles.chip} ${domain.id === activeDomainId ? pageStyles.chipActive : ''}`}
                  onClick={() => setActiveDomainId(domain.id)}
                  type="button"
                >
                  {domain.title}
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className={pageStyles.collectionDetailLayout}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Domains</h2>
                <p className={pageStyles.sectionDescription}>Choose the bucket you want to work inside.</p>
              </div>
            </div>
            <div className={pageStyles.list}>
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  className={`${pageStyles.rowButton} ${domain.id === activeDomainId ? pageStyles.rowActive : ''}`}
                  onClick={() => setActiveDomainId(domain.id)}
                  type="button"
                >
                  <span className={pageStyles.rowTitle}>{domain.title}</span>
                  <span className={pageStyles.rowMeta}>
                    {domain.verified_nodes}/{domain.total_nodes} verified
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Nodes</h2>
                <p className={pageStyles.sectionDescription}>Select a node, then work its evidence trail.</p>
              </div>
            </div>
            <div className={pageStyles.inlineActions}>
              <InputField
                placeholder="Add skill node"
                value={nodeTitle}
                onChange={(event) => setNodeTitle(event.target.value)}
              />
              <Button onClick={() => void handleCreateNode()}>Add node</Button>
            </div>
            <div className={pageStyles.list}>
              {domainNodes.map((node) => (
                <button
                  key={node.id}
                  className={`${pageStyles.rowButton} ${node.id === activeNodeId ? pageStyles.rowActive : ''}`}
                  onClick={() => void loadNodeDetail(node.id)}
                  type="button"
                >
                  <span className={pageStyles.rowTitle}>{node.title}</span>
                  <span className={pageStyles.rowMeta}>
                    {node.state.replace(/_/g, ' ')} · {node.evidence_count} evidence items
                  </span>
                </button>
              ))}
              {domainNodes.length === 0 ? (
                <div className={pageStyles.emptyState}>
                  <strong>No nodes in this domain yet</strong>
                  <span>Add the concrete capability nodes you want this bucket to track.</span>
                </div>
              ) : null}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Evidence detail</h2>
                <p className={pageStyles.sectionDescription}>Attach proof and confirm suggested verification here.</p>
              </div>
              {activeNodeDetail ? (
                <span className={styles.statePill} data-state={activeNodeDetail.skill.state}>
                  {activeNodeDetail.skill.state.replace(/_/g, ' ')}
                </span>
              ) : null}
            </div>
            {activeNodeDetail ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.propertyRow}>
                  <strong>{activeNodeDetail.skill.title}</strong>
                  <span className={pageStyles.muted}>
                    {activeNodeDetail.skill.description ??
                      'Add a description to clarify the proof required.'}
                  </span>
                </div>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Evidence type</span>
                  <select
                    value={evidenceDraft.source_type}
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({
                        ...current,
                        source_type: event.target
                          .value as (typeof SKILL_EVIDENCE_SOURCE_TYPES)[number]
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
                      <span className={pageStyles.eyebrow}>Required stage</span>
                      <select
                        value={evidenceDraft.required_stage}
                        onChange={(event) =>
                          setEvidenceDraft((current) => ({
                            ...current,
                            required_stage: event.target
                              .value as (typeof PROJECT_EXECUTION_STAGES)[number]
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
                <Button onClick={() => void handleAddEvidence()}>Attach evidence</Button>
                <div className={pageStyles.list}>
                  {activeNodeDetail.evidence.map((evidence) => (
                    <div key={evidence.id} className={pageStyles.row}>
                      <span className={pageStyles.rowTitle}>{evidence.label}</span>
                      <span className={pageStyles.rowMeta}>
                        {evidence.source_type} · {evidence.status}
                      </span>
                      <div className={pageStyles.inlineActions}>
                        {evidence.status === 'suggested' ? (
                          <Button size="sm" onClick={() => void confirmEvidence(evidence.id)}>
                            Confirm
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
                  {activeNodeDetail.evidence.length === 0 ? (
                    <div className={pageStyles.emptyState}>
                      <strong>No evidence attached yet</strong>
                      <span>Attach proof from projects, certifications, or links to verify this node.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className={pageStyles.emptyState}>
                <strong>Select a skill node</strong>
                <span>Its evidence record will open here.</span>
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  )
}
