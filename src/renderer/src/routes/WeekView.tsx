import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WeeklyPriorityStatus } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useOsStore } from '@renderer/stores/osStore'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import { usePlanStore } from '@renderer/stores/planStore'
import { useSkillsStore } from '@renderer/stores/skillsStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import { useWorkflowStore } from '@renderer/stores/workflowStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './WorkflowViews.module.css'

function getCurrentWeekKey(): string {
  const date = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)
  const day = date.getUTCDay()
  const delta = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

type ReviewField = 'wins' | 'friction' | 'focus_next' | 'proof_move' | 'pipeline_move'

export function WeekView(): JSX.Element {
  const navigate = useNavigate()
  const snapshot = useWorkflowStore((state) => state.snapshots.week)
  const loadSnapshot = useWorkflowStore((state) => state.loadSnapshot)
  const {
    createWeeklyPriority,
    deleteWeeklyPriority,
    updateWeeklyPriority,
    upsertWeeklyReview
  } = useOsStore()
  const skills = useSkillsStore((state) => state.nodes)
  const loadSkills = useSkillsStore((state) => state.loadNodes)
  const addEvidence = useSkillsStore((state) => state.addEvidence)
  const loadPlanNodes = usePlanStore((state) => state.loadNodes)
  const loadPipeline = usePipelineStore((state) => state.loadAll)
  const pushToast = useToastStore((state) => state.push)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const [priorityTitle, setPriorityTitle] = useState('')
  const [selectedSkillByProject, setSelectedSkillByProject] = useState<Record<string, string>>({})
  const [reviewDraft, setReviewDraft] = useState({
    wins: '',
    friction: '',
    focus_next: '',
    proof_move: '',
    pipeline_move: '',
    notes: ''
  })

  useEffect(() => {
    void loadSnapshot('week')
    void loadSkills(null)
    void loadPlanNodes()
    void loadPipeline()
  }, [loadPipeline, loadPlanNodes, loadSkills, loadSnapshot])

  useEffect(() => {
    if (!snapshot?.weekly_reset?.review) {
      return
    }

    setReviewDraft({
      wins: snapshot.weekly_reset.review.wins ?? '',
      friction: snapshot.weekly_reset.review.friction ?? '',
      focus_next: snapshot.weekly_reset.review.focus_next ?? '',
      proof_move: snapshot.weekly_reset.review.proof_move ?? '',
      pipeline_move: snapshot.weekly_reset.review.pipeline_move ?? '',
      notes: snapshot.weekly_reset.review.notes ?? ''
    })
  }, [snapshot?.weekly_reset?.review])

  const suggestionMap = useMemo(
    () => snapshot?.weekly_review_prefill ?? snapshot?.weekly_reset?.prefill ?? null,
    [snapshot?.weekly_reset?.prefill, snapshot?.weekly_review_prefill]
  )

  async function refreshWeek(): Promise<void> {
    await loadSnapshot('week')
  }

  async function handleCreatePriority(): Promise<void> {
    if (!priorityTitle.trim()) {
      return
    }

    await createWeeklyPriority({
      week_key: getCurrentWeekKey(),
      title: priorityTitle.trim(),
      status: 'planned'
    })
    setPriorityTitle('')
    await refreshWeek()
    pushToast({ message: 'Added weekly priority.', type: 'success' })
  }

  async function handleSaveReview(): Promise<void> {
    await upsertWeeklyReview({
      week_key: getCurrentWeekKey(),
      wins: reviewDraft.wins || null,
      friction: reviewDraft.friction || null,
      focus_next: reviewDraft.focus_next || null,
      proof_move: reviewDraft.proof_move || null,
      pipeline_move: reviewDraft.pipeline_move || null,
      notes: reviewDraft.notes || null
    })
    await refreshWeek()
    pushToast({ message: 'Saved weekly review.', type: 'success' })
  }

  async function handleAttachEvidence(projectId: string): Promise<void> {
    const skillId = selectedSkillByProject[projectId]
    const project = snapshot?.weekly_evidence_queue.find((entry) => entry.project.id === projectId)?.project

    if (!skillId || !project) {
      return
    }

    await addEvidence({
      skill_id: skillId,
      source_type: 'project',
      label: `${project.name} evidence`,
      project_id: projectId,
      required_stage: 'validation',
      notes: 'Added from the Week workflow evidence queue.'
    })
    await refreshWeek()
    pushToast({ message: 'Attached project evidence to skill.', type: 'success' })
  }

  function applySuggestion(field: ReviewField): void {
    const suggested = suggestionMap?.[field].text ?? ''
    setReviewDraft((current) => ({ ...current, [field]: suggested }))
  }

  if (!snapshot) {
    return (
      <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
        <div className={pageStyles.stack}>
          <section className={pageStyles.lead}>
            <span className={pageStyles.eyebrow}>Week</span>
            <h1 className={pageStyles.title}>Loading the weekly planning surface</h1>
            <p className={pageStyles.description}>
              Pulling in priorities, review suggestions, and the evidence queue.
            </p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Week</span>
          <h1 className={pageStyles.title}>Review and re-commit</h1>
          <p className={pageStyles.description}>
            The weekly loop should read from what the system already knows, then prompt the missing
            proof and planning work directly from that data.
          </p>
        </section>

        <section className={pageStyles.twoColumn}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Weekly priorities</h2>
                <p className={pageStyles.sectionDescription}>
                  Keep the week defined by a small number of owned moves.
                </p>
              </div>
              <span className={pageStyles.chip}>{snapshot.weekly_reset?.priorities.length ?? 0} set</span>
            </div>
            <div className={pageStyles.inlineActions}>
              <InputField
                placeholder="Add the next weekly move"
                value={priorityTitle}
                onChange={(event) => setPriorityTitle(event.target.value)}
              />
              <Button onClick={() => void handleCreatePriority()}>Add priority</Button>
            </div>
            <div className={styles.denseList}>
              {snapshot.weekly_reset?.priorities.map((priority) => (
                <div key={priority.id} className={styles.moveRow}>
                  <div className={styles.rowHeader}>
                    <div>
                      <div className={styles.moveTitle}>{priority.title}</div>
                      <div className={styles.moveReason}>
                        {priority.linked_plan_node_id ? 'Roadmap-linked' : 'Standalone'} ·{' '}
                        {priority.status.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <select
                      value={priority.status}
                      onChange={(event) =>
                        void updateWeeklyPriority({
                          id: priority.id,
                          status: event.target.value as WeeklyPriorityStatus
                        }).then(() => refreshWeek())
                      }
                    >
                      <option value="planned">planned</option>
                      <option value="active">active</option>
                      <option value="done">done</option>
                      <option value="dropped">dropped</option>
                    </select>
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <Button size="sm" variant="ghost" onClick={() => void deleteWeeklyPriority(priority.id).then(() => refreshWeek())}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Reset prompts and artifacts</h2>
                <p className={pageStyles.sectionDescription}>
                  Review and planning become one flow when the context is already assembled.
                </p>
              </div>
            </div>
            <div className={styles.denseList}>
              {snapshot.weekly_reset?.prompts.map((prompt) => (
                <div key={prompt.id} className={styles.moveRow}>
                  <div className={styles.moveTitle}>{prompt.title}</div>
                  <div className={styles.moveReason}>{prompt.body}</div>
                </div>
              ))}
              {snapshot.weekly_reset?.artifacts.slice(0, 5).map((artifact) => (
                <div key={artifact.id} className={styles.moveRow}>
                  <div className={styles.moveTitle}>{artifact.label}</div>
                  <div className={styles.moveReason}>{artifact.body}</div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Weekly review prefill</h2>
              <p className={pageStyles.sectionDescription}>
                Suggested text comes from completed actions, blocked nodes, habit adherence, deep
                work, project movement, and due pipeline items. Blank fields are auto-seeded once,
                then only changed when you choose.
              </p>
            </div>
            <div className={pageStyles.inlineActions}>
              <Button onClick={() => void handleSaveReview()}>Save review</Button>
              <Button variant="outline" onClick={() => void refreshWeek()}>
                Refresh suggestions
              </Button>
            </div>
          </div>
          <div className={pageStyles.grid2}>
            {(
              [
                ['wins', 'Wins'],
                ['friction', 'Friction'],
                ['focus_next', 'Focus next'],
                ['proof_move', 'Proof move'],
                ['pipeline_move', 'Pipeline move']
              ] as Array<[ReviewField, string]>
            ).map(([field, label]) => (
              <div key={field} className={styles.fieldCard}>
                <h3 className={styles.fieldLabel}>{label}</h3>
                <TextareaField
                  rows={4}
                  value={reviewDraft[field]}
                  onChange={(event) =>
                    setReviewDraft((current) => ({ ...current, [field]: event.target.value }))
                  }
                />
                <div className={styles.suggestionBox}>
                  <div className={styles.supportText}>
                    {suggestionMap?.[field].text ?? 'No suggestion available yet.'}
                  </div>
                  <div className={pageStyles.chipRow}>
                    {(suggestionMap?.[field].source_labels ?? []).slice(0, 3).map((source) => (
                      <span key={source} className={pageStyles.chip}>
                        {source}
                      </span>
                    ))}
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <Button size="sm" variant="outline" onClick={() => applySuggestion(field)}>
                      Apply suggestion
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <TextareaField
            label="Notes"
            rows={4}
            value={reviewDraft.notes}
            onChange={(event) => setReviewDraft((current) => ({ ...current, notes: event.target.value }))}
          />
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Project → skill evidence queue</h2>
              <p className={pageStyles.sectionDescription}>
                Recent project movement and role-gap pressure surface here so evidence can be
                attached without leaving the weekly surface.
              </p>
            </div>
          </div>
          <div className={styles.denseList}>
            {snapshot.weekly_evidence_queue.map((connection) => (
              <div key={connection.project.id} className={styles.evidenceCard}>
                <div className={styles.rowHeader}>
                  <div>
                    <div className={styles.moveTitle}>{connection.project.name}</div>
                    <div className={styles.moveReason}>
                      {connection.skill_evidence.length} skill links · {connection.cv_sections.length} CV sections ·{' '}
                      {connection.narrative_fragments.length} narrative fragments
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/project/${connection.project.id}`)}>
                    Open project
                  </Button>
                </div>
                <div className={styles.miniList}>
                  {connection.plan_nodes.slice(0, 2).map((node) => (
                    <div key={node.id}>Plan link: {node.title}</div>
                  ))}
                  {connection.notes.slice(0, 2).map((note) => (
                    <div key={note.id}>Note: {note.title}</div>
                  ))}
                </div>
                <div className={styles.inlineSelects}>
                  <label className={pageStyles.formGrid}>
                    <span className={pageStyles.eyebrow}>Attach new evidence to skill</span>
                    <select
                      value={selectedSkillByProject[connection.project.id] ?? ''}
                      onChange={(event) =>
                        setSelectedSkillByProject((current) => ({
                          ...current,
                          [connection.project.id]: event.target.value
                        }))
                      }
                    >
                      <option value="">Select a skill</option>
                      {skills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button onClick={() => void handleAttachEvidence(connection.project.id)}>
                    Attach evidence
                  </Button>
                </div>
              </div>
            ))}
            {snapshot.weekly_evidence_queue.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <strong>No evidence prompts this week</strong>
                <span>The system does not see recent project movement that needs promotion right now.</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
