import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PLAN_NODE_KINDS,
  PLAN_NODE_STATUSES,
  PROJECT_EXECUTION_STAGES,
  type PlanNode,
  type PlanLinkTargetType
} from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useOsStore } from '@renderer/stores/osStore'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import { usePlanStore } from '@renderer/stores/planStore'
import { usePresenceStore } from '@renderer/stores/presenceStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useSkillsStore } from '@renderer/stores/skillsStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './MasterPlan.module.css'

function toDateInput(value: number | null): string {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().slice(0, 10)
}

function toTimestamp(value: string): number | null {
  return value ? new Date(`${value}T00:00:00.000Z`).getTime() : null
}

function findPhaseForNode(
  nodeId: string | null,
  nodeMap: Map<string, PlanNode>,
  phases: PlanNode[]
): PlanNode | null {
  if (!nodeId) {
    return phases[0] ?? null
  }

  let current = nodeMap.get(nodeId) ?? null

  while (current?.parent_id) {
    current = nodeMap.get(current.parent_id) ?? null
  }

  if (current?.kind === 'phase') {
    return current
  }

  return phases.find((phase) => phase.id === nodeId) ?? phases[0] ?? null
}

type TimelineView = 'cards' | 'list'

export function MasterPlan(): JSX.Element {
  const navigate = useNavigate()
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
  const bundle = useSettingsStore((state) => state.bundle)
  const loadBundle = useSettingsStore((state) => state.loadBundle)
  const projects = useProjectStore((state) => state.projects)
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const skillNodes = useSkillsStore((state) => state.nodes)
  const loadSkillNodes = useSkillsStore((state) => state.loadNodes)
  const countdowns = useOsStore((state) => state.countdowns)
  const weeklyPriorities = useOsStore((state) => state.weeklyPriorities)
  const loadCountdowns = useOsStore((state) => state.loadCountdowns)
  const loadWeeklyPriorities = useOsStore((state) => state.loadWeeklyPriorities)
  const { organizations, applications, loadAll: loadPipeline } = usePipelineStore()
  const { narrativeFragments, loadAll: loadPresence } = usePresenceStore()
  const pushToast = useToastStore((state) => state.push)
  const [phaseTitle, setPhaseTitle] = useState('')
  const [childTitle, setChildTitle] = useState('')
  const [childKind, setChildKind] = useState<(typeof PLAN_NODE_KINDS)[number]>('pillar')
  const [linkType, setLinkType] = useState<PlanLinkTargetType>('skill_node')
  const [linkTargetId, setLinkTargetId] = useState('')
  const [requiredStage, setRequiredStage] =
    useState<(typeof PROJECT_EXECUTION_STAGES)[number]>('validation')
  const [timelineView, setTimelineView] = useState<TimelineView>('cards')

  useEffect(() => {
    void loadNodes()
    void loadBundle()
    void loadProjects()
    void loadSkillNodes(null)
    void loadCountdowns()
    void loadWeeklyPriorities()
    void loadPipeline()
    void loadPresence()
  }, [
    loadBundle,
    loadCountdowns,
    loadNodes,
    loadPipeline,
    loadPresence,
    loadProjects,
    loadSkillNodes,
    loadWeeklyPriorities
  ])

  const phases = useMemo(
    () =>
      nodes
        .filter((node) => node.kind === 'phase')
        .sort((left, right) => left.sort_order - right.sort_order),
    [nodes]
  )
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const activePhase = useMemo(
    () => findPhaseForNode(selectedNodeId, nodeMap, phases),
    [nodeMap, phases, selectedNodeId]
  )
  const phaseChildCounts = useMemo(
    () =>
      new Map(
        phases.map((phase) => [
          phase.id,
          nodes.filter((node) => node.parent_id === phase.id).length
        ])
      ),
    [nodes, phases]
  )

  useEffect(() => {
    if (!selectedNodeId && phases[0]) {
      void selectNode(phases[0].id)
    }
  }, [phases, selectNode, selectedNodeId])

  const linkTargets = useMemo(() => {
    switch (linkType) {
      case 'project':
        return projects.map((project) => ({ id: project.id, label: project.name }))
      case 'skill_node':
        return skillNodes.map((node) => ({ id: node.id, label: node.title }))
      case 'countdown_item':
        return countdowns.map((countdown) => ({ id: countdown.id, label: countdown.title }))
      case 'target_organization':
        return organizations.map((organization) => ({
          id: organization.id,
          label: organization.name
        }))
      case 'application_record':
        return applications.map((application) => ({ id: application.id, label: application.title }))
      case 'weekly_priority':
        return weeklyPriorities.map((priority) => ({ id: priority.id, label: priority.title }))
      case 'narrative_fragment':
        return narrativeFragments.map((fragment) => ({ id: fragment.id, label: fragment.title }))
      default:
        return nodes
          .filter((node) => node.id !== selectedNodeId)
          .map((node) => ({ id: node.id, label: node.title }))
    }
  }, [
    applications,
    countdowns,
    linkType,
    narrativeFragments,
    nodes,
    organizations,
    projects,
    selectedNodeId,
    skillNodes,
    weeklyPriorities
  ])

  const targetLabels = useMemo(
    () =>
      new Map<string, string>([
        ...projects.map((project) => [project.id, project.name] as const),
        ...skillNodes.map((node) => [node.id, node.title] as const),
        ...countdowns.map((countdown) => [countdown.id, countdown.title] as const),
        ...nodes.map((node) => [node.id, node.title] as const),
        ...organizations.map((organization) => [organization.id, organization.name] as const),
        ...applications.map((application) => [application.id, application.title] as const),
        ...weeklyPriorities.map((priority) => [priority.id, priority.title] as const),
        ...narrativeFragments.map((fragment) => [fragment.id, fragment.title] as const)
      ]),
    [
      applications,
      countdowns,
      narrativeFragments,
      nodes,
      organizations,
      projects,
      skillNodes,
      weeklyPriorities
    ]
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
    pushToast({ message: 'Added a new phase.', type: 'success' })
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
    pushToast({ message: 'Added a nested roadmap item.', type: 'success' })
  }

  async function handleSaveNode(): Promise<void> {
    if (!selectedNodeDetail) {
      return
    }

    await updateNode(selectedNodeDetail.node)
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
    pushToast({ message: 'Linked roadmap item to supporting evidence.', type: 'success' })
  }

  const topOrganizations = organizations.slice(0, 4)
  const relationLinks =
    selectedNodeDetail?.links.length && selectedNodeDetail.links.length > 0
      ? selectedNodeDetail.links
      : selectedNodeDetail
        ? links.filter((link) => link.node_id === selectedNodeDetail.node.id)
        : []

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Direction</span>
          <h1 className={pageStyles.title}>Narrative, phases, and dependencies</h1>
          <p className={pageStyles.description}>
            Direction should read like a working document with a database underneath it: the long
            range self at the top, the phase structure below, and the linked proof or opportunity
            dependencies alongside it.
          </p>
        </section>

        <section className={pageStyles.twoColumn}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Personal profile</h2>
                <p className={pageStyles.sectionDescription}>
                  Identity defaults and the long-range aim that every phase should support.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
                Edit profile
              </Button>
            </div>
            <div className={pageStyles.propertyGrid}>
              <div className={pageStyles.propertyRow}>
                <strong>{bundle?.user_profile.full_name ?? 'Your profile'}</strong>
                <span className={pageStyles.muted}>
                  {bundle?.user_profile.location ?? 'Location not set'}
                </span>
              </div>
              <div className={pageStyles.propertyRow}>
                <strong>Current education</strong>
                <span className={pageStyles.muted}>
                  {bundle?.user_profile.current_education ?? 'Add this in Settings'}
                </span>
              </div>
              <div className={pageStyles.propertyRow}>
                <strong>North star goal</strong>
                <span className={pageStyles.muted}>
                  {bundle?.user_profile.north_star_goal ?? 'Add this in Settings'}
                </span>
              </div>
              <div className={pageStyles.propertyRow}>
                <strong>Degree path</strong>
                <span className={pageStyles.muted}>
                  {bundle?.user_profile.degree_track ?? 'Add this in Settings'}
                </span>
              </div>
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Strategic narrative</h2>
                <p className={pageStyles.sectionDescription}>
                  The concise story that connects Trinity, portfolio proof, and the Apple /
                  Columbia path.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
                Edit narrative
              </Button>
            </div>
            <div className={pageStyles.document}>
              <div className={pageStyles.propertyRow}>
                <strong>Strategic narrative</strong>
                <span className={pageStyles.muted}>
                  {bundle?.narrative_profile.strategic_narrative ??
                    'Capture the long-range narrative in Settings.'}
                </span>
              </div>
              <div className={pageStyles.propertyRow}>
                <strong>Apple strategy</strong>
                <span className={pageStyles.muted}>
                  {bundle?.narrative_profile.apple_strategy ?? 'Add Apple strategy notes.'}
                </span>
              </div>
              <div className={pageStyles.propertyRow}>
                <strong>Columbia strategy</strong>
                <span className={pageStyles.muted}>
                  {bundle?.narrative_profile.columbia_strategy ?? 'Add Columbia strategy notes.'}
                </span>
              </div>
            </div>
            <div className={pageStyles.list}>
              {topOrganizations.length > 0 ? (
                topOrganizations.map((organization) => (
                  <div key={organization.id} className={pageStyles.row}>
                    <span className={pageStyles.rowTitle}>{organization.name}</span>
                    <span className={pageStyles.rowMeta}>
                      {organization.priority.replace(/_/g, ' ')}
                      {organization.why_fit ? ` · ${organization.why_fit}` : ''}
                    </span>
                  </div>
                ))
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No target organizations yet</strong>
                  <span>Add them in Pipeline so Direction can point at real landscapes.</span>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Fractal timeline</h2>
              <p className={pageStyles.sectionDescription}>
                Phases are the outer frame. Pick a phase, then move into its pillars, dependencies,
                and sprint-level items.
              </p>
            </div>
            <div className={pageStyles.inlineActions}>
              <div className={pageStyles.tabs}>
                <button
                  className={`${pageStyles.tab} ${timelineView === 'cards' ? pageStyles.tabActive : ''}`}
                  onClick={() => setTimelineView('cards')}
                  type="button"
                >
                  Cards
                </button>
                <button
                  className={`${pageStyles.tab} ${timelineView === 'list' ? pageStyles.tabActive : ''}`}
                  onClick={() => setTimelineView('list')}
                  type="button"
                >
                  List
                </button>
              </div>
              <InputField
                placeholder="Add a new phase"
                value={phaseTitle}
                onChange={(event) => setPhaseTitle(event.target.value)}
              />
              <Button onClick={() => void handleCreatePhase()}>Add phase</Button>
            </div>
          </div>
          {timelineView === 'cards' ? (
            <div className={styles.timelineGrid}>
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  className={`${styles.timelineCard} ${
                    phase.id === activePhase?.id ? styles.timelineCardActive : ''
                  }`}
                  onClick={() => void selectNode(phase.id)}
                  type="button"
                >
                  <span className={styles.timelineKicker}>
                    {phase.status.replace(/_/g, ' ')} · {phaseChildCounts.get(phase.id) ?? 0} items
                  </span>
                  <h3 className={styles.timelineTitle}>{phase.title}</h3>
                  <p className={styles.timelineSummary}>
                    {phase.summary ?? 'Add the phase-level summary and key constraints here.'}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className={pageStyles.list}>
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  className={`${pageStyles.rowButton} ${phase.id === activePhase?.id ? pageStyles.rowActive : ''}`}
                  onClick={() => void selectNode(phase.id)}
                  type="button"
                >
                  <span className={pageStyles.rowTitle}>{phase.title}</span>
                  <span className={pageStyles.rowMeta}>
                    {phase.status.replace(/_/g, ' ')} · {phaseChildCounts.get(phase.id) ?? 0}{' '}
                    items
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={pageStyles.collectionDetailLayout}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Phase tree</h2>
                <p className={pageStyles.sectionDescription}>
                  Select the active item, then branch deeper when you need more detail.
                </p>
              </div>
            </div>

            {activePhase ? (
              <div className={pageStyles.list}>
                <button
                  className={`${pageStyles.rowButton} ${selectedNodeDetail?.node.id === activePhase.id ? pageStyles.rowActive : ''}`}
                  onClick={() => void selectNode(activePhase.id)}
                  type="button"
                >
                  <span className={pageStyles.rowTitle}>{activePhase.title}</span>
                  <span className={pageStyles.rowMeta}>Phase · {activePhase.status.replace(/_/g, ' ')}</span>
                </button>
                {selectedNodeDetail?.children.map((child) => (
                  <button
                    key={child.id}
                    className={`${pageStyles.rowButton} ${selectedNodeDetail.node.id === child.id ? pageStyles.rowActive : ''}`}
                    onClick={() => void selectNode(child.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{child.title}</span>
                    <span className={pageStyles.rowMeta}>
                      {child.kind.replace(/_/g, ' ')} · {child.status.replace(/_/g, ' ')}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={pageStyles.emptyState}>
                <strong>No phases yet</strong>
                <span>Add the outer timeline first, then drill down into pillars and dependencies.</span>
              </div>
            )}

            {selectedNodeDetail ? (
              <div className={pageStyles.formGrid}>
                <InputField
                  label="Add child"
                  placeholder="New roadmap item"
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
                <Button onClick={() => void handleCreateChild()}>Add child</Button>
              </div>
            ) : null}
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Selected item</h2>
                <p className={pageStyles.sectionDescription}>
                  Edit the current record as a working note, not a crowded inspector.
                </p>
              </div>
              {selectedNodeDetail ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void deleteNode(selectedNodeDetail.node.id)}
                >
                  Delete
                </Button>
              ) : null}
            </div>

            {selectedNodeDetail ? (
              <div className={pageStyles.document}>
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
                <div className={pageStyles.propertyGrid}>
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
                <div className={pageStyles.propertyGrid}>
                  <InputField
                    label="Start date"
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
                    label="Due date"
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
                  rows={7}
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
                <Button onClick={() => void handleSaveNode()}>Save changes</Button>
                {selectedNodeDetail.blocking_reasons.length > 0 ? (
                  <div className={pageStyles.callout}>
                    <strong>Blocking signals</strong>
                    <div className={pageStyles.list}>
                      {selectedNodeDetail.blocking_reasons.map((reason) => (
                        <div key={reason} className={pageStyles.row}>
                          <span className={pageStyles.rowMeta}>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={pageStyles.emptyState}>
                <strong>Select a roadmap item</strong>
                <span>Pick any phase or nested item to edit it here.</span>
              </div>
            )}
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Relations</h2>
                <p className={pageStyles.sectionDescription}>
                  Link the item to proof, skills, targets, or execution objects.
                </p>
              </div>
              {selectedNodeDetail ? (
                <span className={pageStyles.chip}>{relationLinks.length} links</span>
              ) : null}
            </div>

            {selectedNodeDetail ? (
              <div className={pageStyles.document}>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Relation type</span>
                  <select
                    value={linkType}
                    onChange={(event) => setLinkType(event.target.value as PlanLinkTargetType)}
                  >
                    <option value="skill_node">Skill</option>
                    <option value="project">Project</option>
                    <option value="target_organization">Target organization</option>
                    <option value="application_record">Application</option>
                    <option value="weekly_priority">Weekly priority</option>
                    <option value="narrative_fragment">Narrative fragment</option>
                    <option value="countdown_item">Countdown</option>
                    <option value="plan_node">Dependency</option>
                  </select>
                </label>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Target</span>
                  <select
                    value={linkTargetId}
                    onChange={(event) => setLinkTargetId(event.target.value)}
                  >
                    {linkTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                </label>
                {linkType === 'project' ? (
                  <label className={pageStyles.formGrid}>
                    <span className={pageStyles.eyebrow}>Required stage</span>
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
                <Button onClick={() => void handleCreateLink()}>Add relation</Button>
                <div className={pageStyles.list}>
                  {relationLinks.map((link) => (
                    <div key={link.id} className={pageStyles.row}>
                      <span className={pageStyles.rowTitle}>
                        {link.target_type.replace(/_/g, ' ')}
                      </span>
                      <span className={pageStyles.rowMeta}>
                        {targetLabels.get(link.target_id) ?? link.target_id}
                        {link.required_stage ? ` · requires ${link.required_stage}` : ''}
                      </span>
                      <div className={pageStyles.inlineActions}>
                        <Button size="sm" variant="ghost" onClick={() => void deleteLink(link.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {relationLinks.length === 0 ? (
                    <div className={pageStyles.emptyState}>
                      <strong>No relations yet</strong>
                      <span>Use relations to connect this item to skills, projects, and targets.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className={pageStyles.emptyState}>
                <strong>Select a roadmap item</strong>
                <span>Its linked proof and dependencies will appear here.</span>
              </div>
            )}
          </article>
        </section>

        {error ? <section className={pageStyles.callout}>{error}</section> : null}
      </div>
    </div>
  )
}
