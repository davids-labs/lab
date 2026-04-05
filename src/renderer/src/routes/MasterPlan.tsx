import { useEffect, useMemo, useState } from 'react'
import {
  PLAN_NODE_KINDS,
  PLAN_NODE_STATUSES,
  PROJECT_EXECUTION_STAGES,
  type PlanLinkTargetType
} from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useOsStore } from '@renderer/stores/osStore'
import { usePlanStore } from '@renderer/stores/planStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSkillsStore } from '@renderer/stores/skillsStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'

function toDateInput(value: number | null): string {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().slice(0, 10)
}

function toTimestamp(value: string): number | null {
  return value ? new Date(`${value}T00:00:00.000Z`).getTime() : null
}

export function MasterPlan(): JSX.Element {
  const {
    createLink,
    createNode,
    deleteLink,
    deleteNode,
    error,
    links,
    loadNodes,
    nodes,
    selectedNodeDetail,
    selectedNodeId,
    selectNode,
    updateNode
  } = usePlanStore()
  const projects = useProjectStore((state) => state.projects)
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const skillNodes = useSkillsStore((state) => state.nodes)
  const loadSkillNodes = useSkillsStore((state) => state.loadNodes)
  const countdowns = useOsStore((state) => state.countdowns)
  const loadCountdowns = useOsStore((state) => state.loadCountdowns)
  const pushToast = useToastStore((state) => state.push)
  const [phaseTitle, setPhaseTitle] = useState('')
  const [childTitle, setChildTitle] = useState('')
  const [childKind, setChildKind] = useState<(typeof PLAN_NODE_KINDS)[number]>('pillar')
  const [linkType, setLinkType] = useState<PlanLinkTargetType>('skill_node')
  const [linkTargetId, setLinkTargetId] = useState('')
  const [requiredStage, setRequiredStage] = useState<(typeof PROJECT_EXECUTION_STAGES)[number]>(
    'validation'
  )

  useEffect(() => {
    void loadNodes()
    void loadProjects()
    void loadSkillNodes(null)
    void loadCountdowns()
  }, [loadCountdowns, loadNodes, loadProjects, loadSkillNodes])

  const phases = useMemo(
    () =>
      nodes
        .filter((node) => node.kind === 'phase')
        .sort((left, right) => left.sort_order - right.sort_order),
    [nodes]
  )

  useEffect(() => {
    if (!selectedNodeId && phases[0]) {
      void selectNode(phases[0].id)
    }
  }, [phases, selectNode, selectedNodeId])

  const linkTargets = useMemo(() => {
    if (linkType === 'project') {
      return projects.map((project) => ({ id: project.id, label: project.name }))
    }

    if (linkType === 'skill_node') {
      return skillNodes.map((node) => ({ id: node.id, label: node.title }))
    }

    if (linkType === 'countdown_item') {
      return countdowns.map((countdown) => ({ id: countdown.id, label: countdown.title }))
    }

    return nodes
      .filter((node) => node.id !== selectedNodeId)
      .map((node) => ({ id: node.id, label: node.title }))
  }, [countdowns, linkType, nodes, projects, selectedNodeId, skillNodes])

  const targetLabels = useMemo(
    () =>
      new Map<string, string>([
        ...projects.map((project) => [project.id, project.name] as const),
        ...skillNodes.map((node) => [node.id, node.title] as const),
        ...countdowns.map((countdown) => [countdown.id, countdown.title] as const),
        ...nodes.map((node) => [node.id, node.title] as const)
      ]),
    [countdowns, nodes, projects, skillNodes]
  )

  useEffect(() => {
    setLinkTargetId(linkTargets[0]?.id ?? '')
  }, [linkTargets])

  async function handleCreatePhase(): Promise<void> {
    if (!phaseTitle.trim()) {
      return
    }

    const phase = await createNode({
      title: phaseTitle.trim(),
      kind: 'phase',
      status: 'not_started'
    })
    setPhaseTitle('')
    await selectNode(phase.id)
    pushToast({ message: 'Added phase to the roadmap.', type: 'success' })
  }

  async function handleCreateChild(): Promise<void> {
    if (!selectedNodeDetail || !childTitle.trim()) {
      return
    }

    const node = await createNode({
      title: childTitle.trim(),
      kind: childKind,
      parent_id: selectedNodeDetail.node.id,
      status: 'not_started'
    })
    setChildTitle('')
    await selectNode(node.id)
    pushToast({ message: 'Added nested roadmap item.', type: 'success' })
  }

  async function handleSaveNode(): Promise<void> {
    if (!selectedNodeDetail) {
      return
    }

    const form = selectedNodeDetail.node
    await updateNode(form)
    pushToast({ message: 'Roadmap item updated.', type: 'success' })
  }

  async function handleCreateLink(): Promise<void> {
    if (!selectedNodeDetail || !linkTargetId) {
      return
    }

    await createLink({
      node_id: selectedNodeDetail.node.id,
      target_type: linkType,
      target_id: linkTargetId,
      required_stage: linkType === 'project' ? requiredStage : null
    })
    pushToast({ message: 'Link added to roadmap item.', type: 'success' })
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Master Plan</span>
          <h1 className={pageStyles.title}>The Fractal Master Plan</h1>
          <p className={pageStyles.description}>
            Build the long-range trajectory as linked, editable milestones instead of static notes.
          </p>
        </section>

        <section className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.cardTitle}>Timeline</h2>
            <div className={pageStyles.inlineRow}>
              <InputField
                placeholder="Add a new phase"
                value={phaseTitle}
                onChange={(event) => setPhaseTitle(event.target.value)}
              />
              <Button onClick={() => void handleCreatePhase()}>Add Phase</Button>
            </div>
          </div>
          <div className={pageStyles.pillRow}>
            {phases.map((phase) => (
              <button
                key={phase.id}
                className={pageStyles.pill}
                onClick={() => void selectNode(phase.id)}
                type="button"
                style={{
                  background:
                    phase.id === selectedNodeId ? 'rgba(0, 113, 227, 0.1)' : 'var(--lab-surface-muted)',
                  borderColor:
                    phase.id === selectedNodeId ? 'rgba(0, 113, 227, 0.28)' : 'var(--lab-border)',
                  color: phase.id === selectedNodeId ? 'var(--lab-text)' : 'var(--lab-text-muted)'
                }}
              >
                {phase.title}
              </button>
            ))}
          </div>
        </section>

        <section className={pageStyles.split}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Nested Items</h2>
              <span className={pageStyles.pill}>{selectedNodeDetail?.children.length ?? 0}</span>
            </div>
            <div className={pageStyles.list}>
              {selectedNodeDetail?.children.map((child) => (
                <button
                  key={child.id}
                  className={pageStyles.listRow}
                  type="button"
                  onClick={() => void selectNode(child.id)}
                  style={{ textAlign: 'left' }}
                >
                  <strong>{child.title}</strong>
                  <span className={pageStyles.muted}>
                    {child.kind.replace(/_/g, ' ')} · {child.status.replace(/_/g, ' ')}
                  </span>
                </button>
              ))}
            </div>
            {selectedNodeDetail ? (
              <div className={pageStyles.formGrid}>
                <InputField
                  label="Add Child"
                  placeholder="New nested item"
                  value={childTitle}
                  onChange={(event) => setChildTitle(event.target.value)}
                />
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Kind</span>
                  <select
                    value={childKind}
                    onChange={(event) =>
                      setChildKind(event.target.value as (typeof PLAN_NODE_KINDS)[number])
                    }
                  >
                    {PLAN_NODE_KINDS.filter((kind) => kind !== 'phase').map((kind) => (
                      <option key={kind} value={kind}>
                        {kind.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <Button onClick={() => void handleCreateChild()}>Add Child</Button>
              </div>
            ) : null}
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Selected Item</h2>
              {selectedNodeDetail ? (
                <Button variant="danger" size="sm" onClick={() => void deleteNode(selectedNodeDetail.node.id)}>
                  Delete
                </Button>
              ) : null}
            </div>
            {selectedNodeDetail ? (
              <div className={pageStyles.formGrid}>
                <InputField
                  label="Title"
                  value={selectedNodeDetail.node.title}
                  onChange={(event) =>
                    usePlanStore.setState((state) => ({
                      selectedNodeDetail: state.selectedNodeDetail
                        ? {
                            ...state.selectedNodeDetail,
                            node: { ...state.selectedNodeDetail.node, title: event.target.value }
                          }
                        : null
                    }))
                  }
                />
                <TextareaField
                  label="Summary"
                  rows={4}
                  value={selectedNodeDetail.node.summary ?? ''}
                  onChange={(event) =>
                    usePlanStore.setState((state) => ({
                      selectedNodeDetail: state.selectedNodeDetail
                        ? {
                            ...state.selectedNodeDetail,
                            node: {
                              ...state.selectedNodeDetail.node,
                              summary: event.target.value || null
                            }
                          }
                        : null
                    }))
                  }
                />
                <div className={pageStyles.grid2}>
                  <label className={pageStyles.formGrid}>
                    <span className={pageStyles.eyebrow}>Kind</span>
                    <select
                      value={selectedNodeDetail.node.kind}
                      onChange={(event) =>
                        usePlanStore.setState((state) => ({
                          selectedNodeDetail: state.selectedNodeDetail
                            ? {
                                ...state.selectedNodeDetail,
                                node: {
                                  ...state.selectedNodeDetail.node,
                                  kind: event.target.value as (typeof PLAN_NODE_KINDS)[number]
                                }
                              }
                            : null
                        }))
                      }
                    >
                      {PLAN_NODE_KINDS.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={pageStyles.formGrid}>
                    <span className={pageStyles.eyebrow}>Status</span>
                    <select
                      value={selectedNodeDetail.node.status}
                      onChange={(event) =>
                        usePlanStore.setState((state) => ({
                          selectedNodeDetail: state.selectedNodeDetail
                            ? {
                                ...state.selectedNodeDetail,
                                node: {
                                  ...state.selectedNodeDetail.node,
                                  status: event.target.value as (typeof PLAN_NODE_STATUSES)[number]
                                }
                              }
                            : null
                        }))
                      }
                    >
                      {PLAN_NODE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={pageStyles.grid2}>
                  <InputField
                    label="Start Date"
                    type="date"
                    value={toDateInput(selectedNodeDetail.node.start_at)}
                    onChange={(event) =>
                      usePlanStore.setState((state) => ({
                        selectedNodeDetail: state.selectedNodeDetail
                          ? {
                              ...state.selectedNodeDetail,
                              node: {
                                ...state.selectedNodeDetail.node,
                                start_at: toTimestamp(event.target.value)
                              }
                            }
                          : null
                      }))
                    }
                  />
                  <InputField
                    label="Due Date"
                    type="date"
                    value={toDateInput(selectedNodeDetail.node.due_at)}
                    onChange={(event) =>
                      usePlanStore.setState((state) => ({
                        selectedNodeDetail: state.selectedNodeDetail
                          ? {
                              ...state.selectedNodeDetail,
                              node: {
                                ...state.selectedNodeDetail.node,
                                due_at: toTimestamp(event.target.value)
                              }
                            }
                          : null
                      }))
                    }
                  />
                </div>
                <TextareaField
                  label="Notes"
                  rows={5}
                  value={selectedNodeDetail.node.notes ?? ''}
                  onChange={(event) =>
                    usePlanStore.setState((state) => ({
                      selectedNodeDetail: state.selectedNodeDetail
                        ? {
                            ...state.selectedNodeDetail,
                            node: {
                              ...state.selectedNodeDetail.node,
                              notes: event.target.value || null
                            }
                          }
                        : null
                    }))
                  }
                />
                <Button onClick={() => void handleSaveNode()}>Save Changes</Button>
                {selectedNodeDetail.blocking_reasons.length > 0 ? (
                  <div className={pageStyles.list}>
                    {selectedNodeDetail.blocking_reasons.map((reason) => (
                      <div key={reason} className={pageStyles.listRow}>
                        <strong>Blocking signal</strong>
                        <span className={pageStyles.muted}>{reason}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className={pageStyles.description}>Select a roadmap item to edit it.</p>
            )}
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Dependencies & Links</h2>
              <span className={pageStyles.pill}>{selectedNodeDetail?.links.length ?? 0}</span>
            </div>
            {selectedNodeDetail ? (
              <div className={pageStyles.formGrid}>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Link Type</span>
                  <select
                    value={linkType}
                    onChange={(event) => setLinkType(event.target.value as PlanLinkTargetType)}
                  >
                    <option value="skill_node">Skill</option>
                    <option value="project">Project</option>
                    <option value="countdown_item">Countdown</option>
                    <option value="plan_node">Dependency</option>
                  </select>
                </label>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Target</span>
                  <select value={linkTargetId} onChange={(event) => setLinkTargetId(event.target.value)}>
                    {linkTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                </label>
                {linkType === 'project' ? (
                  <label className={pageStyles.formGrid}>
                    <span className={pageStyles.eyebrow}>Required Stage</span>
                    <select
                      value={requiredStage}
                      onChange={(event) =>
                        setRequiredStage(
                          event.target.value as (typeof PROJECT_EXECUTION_STAGES)[number]
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
                ) : null}
                <Button onClick={() => void handleCreateLink()}>Add Link</Button>
                <div className={pageStyles.list}>
                  {(selectedNodeDetail.links.length > 0 ? selectedNodeDetail.links : links.filter((link) => link.node_id === selectedNodeDetail.node.id)).map(
                    (link) => (
                      <div key={link.id} className={pageStyles.listRow}>
                        <strong>{link.target_type.replace(/_/g, ' ')}</strong>
                        <span className={pageStyles.muted}>
                          {targetLabels.get(link.target_id) ?? link.target_id}
                          {link.required_stage ? ` · requires ${link.required_stage}` : ''}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => void deleteLink(link.id)}>
                          Remove
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <p className={pageStyles.description}>Select a roadmap item to link it to evidence.</p>
            )}
          </article>
        </section>

        {error ? <div className={pageStyles.card}>{error}</div> : null}
      </div>
    </div>
  )
}
