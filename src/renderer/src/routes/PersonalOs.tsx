import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chart, ArcElement, DoughnutController, Legend, Tooltip } from 'chart.js'
import {
  ACTION_PRIORITIES,
  ACTION_STATUSES,
  CAPTURE_KINDS,
  HABIT_FREQUENCIES,
  TRIAGE_TARGETS,
  WEEKLY_PRIORITY_STATUSES,
  type ActionStatus,
  type TriageTarget
} from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useActionStore } from '@renderer/stores/actionStore'
import { useCalendarStore } from '@renderer/stores/calendarStore'
import { useCaptureStore } from '@renderer/stores/captureStore'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useExportStore } from '@renderer/stores/exportStore'
import { useOsStore, type HabitProgress } from '@renderer/stores/osStore'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import { usePlanStore } from '@renderer/stores/planStore'
import { useReviewStore } from '@renderer/stores/reviewStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './PersonalOs.module.css'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

type ExecutionTab =
  | 'inbox'
  | 'today'
  | 'this_week'
  | 'next'
  | 'waiting'
  | 'someday'
  | 'rituals'
  | 'schedule'
  | 'review'

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentWeekKey(): string {
  const date = new Date(`${getTodayDate()}T00:00:00.000Z`)
  const day = date.getUTCDay()
  const delta = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

function toDateTimestamp(value: string): number | null {
  return value ? new Date(`${value}T00:00:00.000Z`).getTime() : null
}

function formatTimestamp(value: number | null | undefined): string {
  if (!value) {
    return 'No date'
  }

  return new Date(value).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short'
  })
}

function getCountdownDaysRemaining(targetDate: string): number {
  const today = new Date(`${getTodayDate()}T00:00:00.000Z`).getTime()
  const target = new Date(`${targetDate}T00:00:00.000Z`).getTime()
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function createEmptyHabitDraft(): {
  name: string
  description: string
  frequency: string
  trigger_context: string
  anchor_habit_id: string
} {
  return {
    name: '',
    description: '',
    frequency: 'daily',
    trigger_context: '',
    anchor_habit_id: ''
  }
}

function formatHabitStreak(progress: HabitProgress | undefined): string | null {
  if (!progress || progress.currentStreak === 0) {
    return null
  }

  const unitLabel = progress.streakUnit === 'week' ? 'week' : 'day'
  const suffix = progress.currentStreak === 1 ? '' : 's'
  return `${progress.currentStreak}-${unitLabel}${suffix} streak`
}

function formatHabitSupportLine(habit: {
  description: string | null
  trigger_context: string | null
  frequency: string
}, progress: HabitProgress | undefined): string {
  const parts = [
    habit.description,
    habit.trigger_context,
    progress?.anchorLabel ? `After ${progress.anchorLabel}` : null
  ].filter((value): value is string => Boolean(value))

  return parts.length > 0 ? parts.join(' · ') : habit.frequency.replace(/_/g, ' ')
}

function buildHabitToastMessage(
  habitName: string,
  completed: boolean,
  progress: HabitProgress | undefined
): string {
  if (!completed) {
    return `Cleared ${habitName} for ${progress?.periodLabel ?? 'today'}.`
  }

  const streak = formatHabitStreak(progress)
  return streak ? `Logged ${habitName}. ${streak}.` : `Logged ${habitName}.`
}

export function PersonalOs(): JSX.Element {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart<'doughnut'> | null>(null)
  const { loadSummary, summary } = useDashboardStore()
  const { items: actions, loadItems, createItem, updateItem, deleteItem } = useActionStore()
  const { entries, loadEntries, createEntry, triageEntry, deleteEntry } = useCaptureStore()
  const { weeklyReset, loadWeeklyReset } = useReviewStore()
  const { events, loadSources: loadCalendarSources, loadEvents } = useCalendarStore()
  const {
    activeProfileId,
    countdowns,
    createCountdown,
    createHabit,
    createProfile,
    createWeeklyPriority,
    currentLog,
    deleteCountdown,
    deleteHabit,
    deleteTimeBlock,
    deleteWeeklyPriority,
    habitProgressById,
    habits,
    loadCountdowns,
    loadDailyLog,
    loadDailyLogs,
    loadHabits,
    loadHabitLogs,
    loadProfiles,
    loadWeeklyPriorities,
    loadWeeklyReview,
    profiles,
    setActiveProfileId,
    timeBlocks,
    toggleHabitCompletion,
    updateCountdown,
    updateHabit,
    updateWeeklyPriority,
    upsertDailyLog,
    upsertTimeBlock,
    upsertWeeklyReview,
    weeklyPriorities,
    weeklyReview
  } = useOsStore()
  const applications = usePipelineStore((state) => state.applications)
  const loadPipeline = usePipelineStore((state) => state.loadAll)
  const nodes = usePlanStore((state) => state.nodes)
  const loadNodes = usePlanStore((state) => state.loadNodes)
  const { generatePack } = useExportStore()
  const pushToast = useToastStore((state) => state.push)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const today = getTodayDate()
  const weekKey = getCurrentWeekKey()
  const [profileName, setProfileName] = useState('')
  const [habitDraft, setHabitDraft] = useState(createEmptyHabitDraft)
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [captureDraft, setCaptureDraft] = useState({ title: '', body: '', kind: 'idea' })
  const [triageSelection, setTriageSelection] = useState<Record<string, TriageTarget>>({})
  const [captureAction, setCaptureAction] = useState<
    'action' | 'note' | 'application' | 'narrative_fragment' | 'weekly_priority'
  >('action')
  const [logDraft, setLogDraft] = useState({
    sleep_hours: '0',
    calories: '0',
    protein_grams: '0',
    water_litres: '0',
    deep_work_minutes: '0',
    gym_done: false,
    notes: ''
  })
  const [timeBlockDraft, setTimeBlockDraft] = useState({
    label: '',
    hours: '1',
    color: '#8e8e93'
  })
  const [countdownDraft, setCountdownDraft] = useState({
    title: '',
    target_date: '',
    category: 'General'
  })
  const [priorityDraft, setPriorityDraft] = useState({
    title: '',
    linked_plan_node_id: '',
    linked_application_id: ''
  })
  const [reviewDraft, setReviewDraft] = useState({
    wins: '',
    friction: '',
    focus_next: '',
    proof_move: '',
    pipeline_move: '',
    notes: ''
  })
  const [actionDraft, setActionDraft] = useState({
    title: '',
    details: '',
    priority: 'medium',
    due_at: '',
    linked_plan_node_id: '',
    linked_application_id: ''
  })
  const [activeTab, setActiveTab] = useState<ExecutionTab>('today')

  useEffect(() => {
    void loadSummary()
    void loadEntries('inbox')
    void loadItems()
    void loadProfiles()
    void loadDailyLogs()
    void loadDailyLog(today)
    void loadHabits()
    void loadHabitLogs()
    void loadCountdowns()
    void loadWeeklyPriorities(weekKey)
    void loadWeeklyReview(weekKey)
    void loadWeeklyReset(weekKey)
    void loadNodes()
    void loadPipeline()
    void loadCalendarSources()
    void loadEvents()
  }, [
    loadCalendarSources,
    loadCountdowns,
    loadDailyLog,
    loadDailyLogs,
    loadEntries,
    loadEvents,
    loadHabits,
    loadHabitLogs,
    loadItems,
    loadNodes,
    loadPipeline,
    loadProfiles,
    loadSummary,
    loadWeeklyPriorities,
    loadWeeklyReset,
    loadWeeklyReview,
    today,
    weekKey
  ])

  useEffect(() => {
    setLogDraft({
      sleep_hours: String(currentLog?.sleep_hours ?? 0),
      calories: String(currentLog?.calories ?? 0),
      protein_grams: String(currentLog?.protein_grams ?? 0),
      water_litres: String(currentLog?.water_litres ?? 0),
      deep_work_minutes: String(currentLog?.deep_work_minutes ?? 0),
      gym_done: currentLog?.gym_done ?? false,
      notes: currentLog?.notes ?? ''
    })
  }, [currentLog])

  useEffect(() => {
    setReviewDraft({
      wins: weeklyReview?.wins ?? '',
      friction: weeklyReview?.friction ?? '',
      focus_next: weeklyReview?.focus_next ?? '',
      proof_move: weeklyReview?.proof_move ?? '',
      pipeline_move: weeklyReview?.pipeline_move ?? '',
      notes: weeklyReview?.notes ?? ''
    })
  }, [weeklyReview])

  const chartBlocks = useMemo(
    () => (timeBlocks.length > 0 ? timeBlocks : (summary?.os.time_blocks ?? [])),
    [summary?.os.time_blocks, timeBlocks]
  )
  const weekSummary = summary?.os.week
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? null
  const planNodeLabels = useMemo(() => new Map(nodes.map((node) => [node.id, node.title])), [nodes])
  const applicationLabels = useMemo(
    () => new Map(applications.map((application) => [application.id, application.title])),
    [applications]
  )
  const eventsThisWeek = useMemo(
    () =>
      events
        .filter((event) => new Date(event.starts_at).toISOString().slice(0, 10) >= weekKey)
        .slice(0, 6),
    [events, weekKey]
  )

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    chartRef.current?.destroy()
    if (chartBlocks.length === 0) {
      return
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: chartBlocks.map((block) => block.label),
        datasets: [
          {
            data: chartBlocks.map((block) => block.hours),
            backgroundColor: chartBlocks.map((block) => block.color),
            borderColor: '#ffffff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              color: '#515154',
              font: { family: 'Segoe UI, sans-serif', size: 11 }
            }
          }
        }
      }
    })

    return () => chartRef.current?.destroy()
  }, [chartBlocks])

  async function refresh(): Promise<void> {
    await Promise.all([
      loadSummary(),
      loadEntries('inbox'),
      loadItems(),
      loadWeeklyReset(weekKey),
      loadWeeklyPriorities(weekKey),
      loadWeeklyReview(weekKey),
      loadCountdowns(),
      loadEvents(),
      loadDailyLog(today),
      loadHabits(),
      loadHabitLogs()
    ])
  }

  async function saveLog(): Promise<void> {
    await upsertDailyLog({
      date: today,
      profile_id: activeProfileId,
      sleep_hours: Number(logDraft.sleep_hours || 0),
      calories: Number(logDraft.calories || 0),
      protein_grams: Number(logDraft.protein_grams || 0),
      water_litres: Number(logDraft.water_litres || 0),
      deep_work_minutes: Number(logDraft.deep_work_minutes || 0),
      gym_done: logDraft.gym_done,
      notes: logDraft.notes || null
    })
    await refresh()
    pushToast({ message: "Today's execution log saved.", type: 'success' })
  }

  async function createNewCountdown(): Promise<void> {
    if (!countdownDraft.title.trim() || !countdownDraft.target_date) {
      return
    }

    await createCountdown({
      title: countdownDraft.title.trim(),
      target_date: countdownDraft.target_date,
      category: countdownDraft.category.trim() || 'General'
    })
    setCountdownDraft({ title: '', target_date: '', category: 'General' })
    await refresh()
    pushToast({ message: 'Added countdown tracker.', type: 'success' })
  }

  async function addAction(status: ActionStatus): Promise<void> {
    if (!actionDraft.title.trim()) {
      return
    }

    await createItem({
      title: actionDraft.title.trim(),
      details: actionDraft.details.trim() || null,
      status,
      priority: actionDraft.priority as (typeof ACTION_PRIORITIES)[number],
      due_at: toDateTimestamp(actionDraft.due_at),
      linked_plan_node_id: actionDraft.linked_plan_node_id || null,
      linked_application_id: actionDraft.linked_application_id || null
    })
    setActionDraft({
      title: '',
      details: '',
      priority: 'medium',
      due_at: '',
      linked_plan_node_id: '',
      linked_application_id: ''
    })
    await refresh()
    pushToast({ message: 'Added action item.', type: 'success' })
  }

  async function handleCreateCapture(): Promise<void> {
    if (!captureDraft.title.trim()) {
      return
    }

    await createEntry({
      title: captureDraft.title.trim(),
      body: captureDraft.body.trim() || null,
      kind: captureDraft.kind as (typeof CAPTURE_KINDS)[number],
      source: 'manual'
    })
    setCaptureDraft({ title: '', body: '', kind: 'idea' })
    await refresh()
    pushToast({ message: 'Captured to inbox.', type: 'success' })
  }

  async function handleTriage(id: string): Promise<void> {
    await triageEntry({
      id,
      target: triageSelection[id] ?? 'execution',
      create_follow_up: captureAction
    })
    await refresh()
    pushToast({ message: 'Triage applied.', type: 'success' })
  }

  async function handleCreateProfile(): Promise<void> {
    if (!profileName.trim()) {
      return
    }

    await createProfile({
      name: profileName.trim(),
      is_default: profiles.length === 0
    })
    setProfileName('')
    await loadProfiles()
    await refresh()
    pushToast({ message: 'Created schedule profile.', type: 'success' })
  }

  async function handleSaveHabit(): Promise<void> {
    if (!habitDraft.name.trim()) {
      return
    }

    const input = {
      name: habitDraft.name.trim(),
      description: habitDraft.description.trim() || null,
      frequency: habitDraft.frequency as (typeof HABIT_FREQUENCIES)[number],
      trigger_context: habitDraft.trigger_context.trim() || null,
      anchor_habit_id: habitDraft.anchor_habit_id || null
    }

    if (editingHabitId) {
      await updateHabit({
        id: editingHabitId,
        ...input
      })
    } else {
      await createHabit(input)
    }

    setHabitDraft(createEmptyHabitDraft())
    setEditingHabitId(null)
    await refresh()
    pushToast({
      message: editingHabitId ? 'Updated ritual.' : 'Added ritual.',
      type: 'success'
    })
  }

  async function handleToggleHabit(habitId: string, completed: boolean): Promise<void> {
    const { habit, progress } = await toggleHabitCompletion(habitId, completed)
    await refresh()
    pushToast({
      message: buildHabitToastMessage(habit.name, completed, progress),
      type: 'success'
    })
  }

  function handleEditHabit(habitId: string): void {
    const habit = habits.find((entry) => entry.id === habitId)

    if (!habit) {
      return
    }

    setEditingHabitId(habit.id)
    setHabitDraft({
      name: habit.name,
      description: habit.description ?? '',
      frequency: habit.frequency,
      trigger_context: habit.trigger_context ?? '',
      anchor_habit_id: habit.anchor_habit_id ?? ''
    })
  }

  function handleCancelHabitEdit(): void {
    setEditingHabitId(null)
    setHabitDraft(createEmptyHabitDraft())
  }

  async function handleCreateTimeBlock(): Promise<void> {
    if (!activeProfileId || !timeBlockDraft.label.trim()) {
      return
    }

    await upsertTimeBlock({
      profile_id: activeProfileId,
      label: timeBlockDraft.label.trim(),
      hours: Number(timeBlockDraft.hours || 0),
      color: timeBlockDraft.color
    })
    setTimeBlockDraft({ label: '', hours: '1', color: '#8e8e93' })
    await refresh()
    pushToast({ message: 'Added schedule block.', type: 'success' })
  }

  async function handleCreatePriority(): Promise<void> {
    if (!priorityDraft.title.trim()) {
      return
    }

    await createWeeklyPriority({
      week_key: weekKey,
      title: priorityDraft.title.trim(),
      status: 'planned',
      linked_plan_node_id: priorityDraft.linked_plan_node_id || null,
      linked_application_id: priorityDraft.linked_application_id || null
    })
    setPriorityDraft({
      title: '',
      linked_plan_node_id: '',
      linked_application_id: ''
    })
    await refresh()
    pushToast({ message: 'Added weekly priority.', type: 'success' })
  }

  async function handleSaveReview(): Promise<void> {
    await upsertWeeklyReview({
      week_key: weekKey,
      wins: reviewDraft.wins || null,
      friction: reviewDraft.friction || null,
      focus_next: reviewDraft.focus_next || null,
      proof_move: reviewDraft.proof_move || null,
      pipeline_move: reviewDraft.pipeline_move || null,
      notes: reviewDraft.notes || null
    })
    await refresh()
    pushToast({ message: 'Saved weekly review.', type: 'success' })
  }

  async function handleGeneratePack(target: 'weekly_review' | 'workspace_dump'): Promise<void> {
    await generatePack({
      target,
      format: target === 'workspace_dump' ? 'json' : 'markdown'
    })
    pushToast({
      message: target === 'weekly_review' ? 'Generated weekly review pack.' : 'Generated workspace dump.',
      type: 'success'
    })
  }

  function renderActionLane(status: ActionStatus, title: string, description: string): JSX.Element {
    const laneItems = actions.filter((item) => item.status === status)

    return (
      <section className={pageStyles.grid2}>
        <article className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>{title}</h2>
              <p className={pageStyles.description}>{description}</p>
            </div>
            <span className={pageStyles.pill}>{laneItems.length} actions</span>
          </div>
          <div className={styles.actionComposer}>
            <InputField
              placeholder={`Add a ${title.toLowerCase()} action`}
              value={actionDraft.title}
              onChange={(event) =>
                setActionDraft((current) => ({ ...current, title: event.target.value }))
              }
            />
            <InputField
              placeholder="Due date"
              type="date"
              value={actionDraft.due_at}
              onChange={(event) =>
                setActionDraft((current) => ({ ...current, due_at: event.target.value }))
              }
            />
            <label className={pageStyles.formGrid}>
              <span className={pageStyles.eyebrow}>Priority</span>
              <select
                value={actionDraft.priority}
                onChange={(event) =>
                  setActionDraft((current) => ({ ...current, priority: event.target.value }))
                }
              >
                {ACTION_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className={pageStyles.formGrid}>
              <span className={pageStyles.eyebrow}>Plan link</span>
              <select
                value={actionDraft.linked_plan_node_id}
                onChange={(event) =>
                  setActionDraft((current) => ({
                    ...current,
                    linked_plan_node_id: event.target.value
                  }))
                }
              >
                <option value="">No plan link</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={pageStyles.formGrid}>
              <span className={pageStyles.eyebrow}>Application link</span>
              <select
                value={actionDraft.linked_application_id}
                onChange={(event) =>
                  setActionDraft((current) => ({
                    ...current,
                    linked_application_id: event.target.value
                  }))
                }
              >
                <option value="">No application link</option>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.title}
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={() => void addAction(status)}>Add action</Button>
          </div>
          <TextareaField
            placeholder="Optional details"
            rows={3}
            value={actionDraft.details}
            onChange={(event) =>
              setActionDraft((current) => ({ ...current, details: event.target.value }))
            }
          />
          <div className={styles.actionList}>
            {laneItems.length > 0 ? (
              laneItems.map((item) => (
                <div key={item.id} className={styles.actionRow}>
                  <div className={styles.priorityHeader}>
                    <strong>{item.title}</strong>
                    <span className={pageStyles.muted}>
                      {item.priority}
                      {item.due_at ? ` · due ${formatTimestamp(item.due_at)}` : ''}
                    </span>
                  </div>
                  <div className={pageStyles.row}>
                    <span className={pageStyles.rowMeta}>
                      {item.linked_plan_node_id
                        ? (planNodeLabels.get(item.linked_plan_node_id) ?? 'Plan-linked')
                        : item.linked_application_id
                          ? (applicationLabels.get(item.linked_application_id) ?? 'Application-linked')
                          : 'Standalone'}
                    </span>
                  </div>
                  {item.details ? <div className={pageStyles.muted}>{item.details}</div> : null}
                  <div className={styles.actionRowActions}>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Move to</span>
                      <select
                        value={item.status}
                        onChange={(event) =>
                          void updateItem({
                            id: item.id,
                            status: event.target.value as ActionStatus
                          }).then(() => refresh())
                        }
                      >
                        {ACTION_STATUSES.map((option) => (
                          <option key={option} value={option}>
                            {option.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void updateItem({
                          id: item.id,
                          status: 'done',
                          completed_at: Date.now()
                        }).then(() => refresh())
                      }
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteItem(item.id).then(() => refresh())}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className={pageStyles.emptyState}>
                <strong>No actions here yet</strong>
                <span>Add the next concrete move so this lane becomes real.</span>
              </div>
            )}
          </div>
        </article>

        <article className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Supporting context</h2>
              <p className={pageStyles.description}>
                Keep the lane grounded in the week, the calendar, and the pressure system around it.
              </p>
            </div>
          </div>
          <div className={pageStyles.metricStrip}>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Inbox</span>
              <div className={pageStyles.metricValue}>{summary?.inbox.open ?? 0}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Overdue</span>
              <div className={pageStyles.metricValue}>{summary?.actions.overdue.length ?? 0}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Events this week</span>
              <div className={pageStyles.metricValue}>{eventsThisWeek.length}</div>
            </div>
          </div>
          <div className={pageStyles.list}>
            {eventsThisWeek.map((event) => (
              <div key={event.id} className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>{event.title}</span>
                <span className={pageStyles.rowMeta}>
                  {new Date(event.starts_at).toLocaleDateString('en-IE')}
                </span>
              </div>
            ))}
            {eventsThisWeek.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <strong>No imported calendar events</strong>
                <span>Import an ICS file in Settings to pull time commitments into Execution.</span>
              </div>
            ) : null}
          </div>
          <div className={pageStyles.list}>
            {summary?.actions.overdue.slice(0, 3).map((action) => (
              <div key={action.id} className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>{action.title}</span>
                <span className={pageStyles.rowMeta}>
                  overdue {action.due_at ? formatTimestamp(action.due_at) : 'soon'}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    )
  }

  let tabContent: JSX.Element

  if (activeTab === 'inbox') {
    tabContent = (
      <div className={pageStyles.stack}>
        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Capture inbox</h2>
                <p className={pageStyles.description}>
                  Capture first and decide what it becomes after. The inbox should be a short runway,
                  not a storage unit.
                </p>
              </div>
              <span className={pageStyles.pill}>{entries.length} open</span>
            </div>
            <div className={pageStyles.document}>
              <InputField
                placeholder="Loose thought, decision, reminder, or opportunity"
                value={captureDraft.title}
                onChange={(event) =>
                  setCaptureDraft((current) => ({ ...current, title: event.target.value }))
                }
              />
              <TextareaField
                placeholder="Optional context or why it matters"
                rows={3}
                value={captureDraft.body}
                onChange={(event) =>
                  setCaptureDraft((current) => ({ ...current, body: event.target.value }))
                }
              />
              <div className={pageStyles.inlineRow}>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Capture kind</span>
                  <select
                    value={captureDraft.kind}
                    onChange={(event) =>
                      setCaptureDraft((current) => ({ ...current, kind: event.target.value }))
                    }
                  >
                    {CAPTURE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <Button onClick={() => void handleCreateCapture()}>Add to inbox</Button>
              </div>
            </div>
            <div className={styles.inboxList}>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <div key={entry.id} className={styles.inboxRow}>
                    <div className={styles.priorityHeader}>
                      <strong>{entry.title}</strong>
                      <span className={pageStyles.muted}>
                        {entry.kind.replace(/_/g, ' ')} · {entry.source.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {entry.body ? <div className={pageStyles.muted}>{entry.body}</div> : null}
                    <div className={styles.triageRow}>
                      <label className={pageStyles.formGrid}>
                        <span className={pageStyles.eyebrow}>Route to</span>
                        <select
                          value={triageSelection[entry.id] ?? 'execution'}
                          onChange={(event) =>
                            setTriageSelection((current) => ({
                              ...current,
                              [entry.id]: event.target.value as TriageTarget
                            }))
                          }
                        >
                          {TRIAGE_TARGETS.map((target) => (
                            <option key={target} value={target}>
                              {target.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button size="sm" onClick={() => void handleTriage(entry.id)}>
                        Triage
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void deleteEntry(entry.id).then(() => refresh())}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>The inbox is clear</strong>
                  <span>That is good. Capture the next loose item here instead of scattering it.</span>
                </div>
              )}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Clarify and route</h2>
                <p className={pageStyles.description}>
                  Decide what a capture becomes, then let the downstream workspace own it.
                </p>
              </div>
            </div>
            <div className={pageStyles.formGrid}>
              <label className={pageStyles.formGrid}>
                <span className={pageStyles.eyebrow}>Create follow-up as</span>
                <select
                  value={captureAction}
                  onChange={(event) =>
                    setCaptureAction(
                      event.target.value as
                        | 'action'
                        | 'note'
                        | 'application'
                        | 'narrative_fragment'
                        | 'weekly_priority'
                    )
                  }
                >
                  <option value="action">Action item</option>
                  <option value="note">Note</option>
                  <option value="application">Application</option>
                  <option value="narrative_fragment">Narrative fragment</option>
                  <option value="weekly_priority">Weekly priority</option>
                </select>
              </label>
            </div>
            <div className={pageStyles.metricStrip}>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Inbox</span>
                <div className={pageStyles.metricValue}>{summary?.inbox.open ?? 0}</div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Today lane</span>
                <div className={pageStyles.metricValue}>{summary?.actions.by_status.today ?? 0}</div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>This week lane</span>
                <div className={pageStyles.metricValue}>
                  {summary?.actions.by_status.this_week ?? 0}
                </div>
              </div>
            </div>
            <div className={pageStyles.callout}>
              <strong>Suggested routing rule</strong>
              <p className={pageStyles.description}>
                If it needs a concrete next move, make it an action. If it deserves thought, make
                it a note. If it points at an opportunity, push it into Pipeline or Presence.
              </p>
            </div>
            <div className={pageStyles.list}>
              {summary?.insights.recommendations.map((recommendation) => (
                <div key={recommendation.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{recommendation.title}</span>
                  <span className={pageStyles.rowMeta}>{recommendation.body}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    )
  } else if (activeTab === 'today') {
    tabContent = (
      <div className={pageStyles.stack}>
        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Today log</h2>
                <p className={pageStyles.description}>
                  Record the operator state so the week has reality, not just intention.
                </p>
              </div>
              <span className={pageStyles.pill}>{currentLog ? 'Logged' : 'Open'}</span>
            </div>
            <div className={styles.summaryStrip}>
              <div className={styles.miniMetric}>
                <span className={pageStyles.muted}>Deep work</span>
                <div className={styles.miniMetricValue}>
                  {currentLog?.deep_work_minutes ?? 0}
                </div>
              </div>
              <div className={styles.miniMetric}>
                <span className={pageStyles.muted}>Sleep</span>
                <div className={styles.miniMetricValue}>
                  {(currentLog?.sleep_hours ?? 0).toFixed(1)}
                </div>
              </div>
              <div className={styles.miniMetric}>
                <span className={pageStyles.muted}>Protein</span>
                <div className={styles.miniMetricValue}>{currentLog?.protein_grams ?? 0}</div>
              </div>
            </div>
            <div className={styles.logGrid}>
              <InputField
                label="Sleep hours"
                value={logDraft.sleep_hours}
                onChange={(event) =>
                  setLogDraft((current) => ({ ...current, sleep_hours: event.target.value }))
                }
              />
              <InputField
                label="Calories"
                value={logDraft.calories}
                onChange={(event) =>
                  setLogDraft((current) => ({ ...current, calories: event.target.value }))
                }
              />
              <InputField
                label="Protein grams"
                value={logDraft.protein_grams}
                onChange={(event) =>
                  setLogDraft((current) => ({ ...current, protein_grams: event.target.value }))
                }
              />
              <InputField
                label="Water litres"
                value={logDraft.water_litres}
                onChange={(event) =>
                  setLogDraft((current) => ({ ...current, water_litres: event.target.value }))
                }
              />
              <InputField
                label="Deep work minutes"
                value={logDraft.deep_work_minutes}
                onChange={(event) =>
                  setLogDraft((current) => ({
                    ...current,
                    deep_work_minutes: event.target.value
                  }))
                }
              />
              <label className={pageStyles.inlineRow}>
                <input
                  checked={logDraft.gym_done}
                  type="checkbox"
                  onChange={(event) =>
                    setLogDraft((current) => ({ ...current, gym_done: event.target.checked }))
                  }
                />
                <span className={pageStyles.muted}>Training completed today</span>
              </label>
            </div>
            <TextareaField
              label="Notes"
              rows={4}
              value={logDraft.notes}
              onChange={(event) =>
                setLogDraft((current) => ({ ...current, notes: event.target.value }))
              }
            />
            <Button onClick={() => void saveLog()}>Save today log</Button>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Today support layer</h2>
                <p className={pageStyles.description}>
                  Habits, deadlines, and live context should stay small and visible.
                </p>
              </div>
            </div>
            <div className={pageStyles.list}>
              {habits.map((habit) => (
                <div key={habit.id} className={pageStyles.row}>
                  <div className={pageStyles.inlineActions}>
                    <label className={styles.habitCheck}>
                      <input
                        checked={habitProgressById[habit.id]?.currentPeriodCompleted ?? false}
                        type="checkbox"
                        onChange={(event) => void handleToggleHabit(habit.id, event.target.checked)}
                      />
                      <span>
                        <span className={pageStyles.rowTitle}>{habit.name}</span>
                        <span className={pageStyles.rowMeta}>
                          {formatHabitSupportLine(habit, habitProgressById[habit.id])}
                        </span>
                      </span>
                    </label>
                    <div className={pageStyles.chipRow}>
                      <span className={pageStyles.chip}>
                        {habitProgressById[habit.id]?.currentPeriodCompleted
                          ? `Done ${habitProgressById[habit.id]?.periodLabel ?? 'today'}`
                          : `Open ${habitProgressById[habit.id]?.periodLabel ?? 'today'}`}
                      </span>
                      {formatHabitStreak(habitProgressById[habit.id]) ? (
                        <span className={pageStyles.chip}>
                          {formatHabitStreak(habitProgressById[habit.id])}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {habits.length === 0 ? (
                <div className={pageStyles.emptyState}>
                  <strong>No rituals yet</strong>
                  <span>Add habits in the Rituals tab so Today has a real checklist.</span>
                </div>
              ) : null}
            </div>
            <div className={pageStyles.list}>
              {countdowns.slice(0, 3).map((countdown) => (
                <div key={countdown.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{countdown.title}</span>
                  <span className={pageStyles.rowMeta}>
                    {countdown.category} · {getCountdownDaysRemaining(countdown.target_date)} days
                  </span>
                </div>
              ))}
            </div>
            <div className={pageStyles.inlineActions}>
              <Button variant="outline" onClick={() => setActiveTab('rituals')}>
                Open rituals
              </Button>
              <Button variant="outline" onClick={() => navigate('/notes')}>
                Open notes
              </Button>
            </div>
          </article>
        </section>

        {renderActionLane(
          'today',
          'Today lane',
          'Only the moves that actually deserve today should live here.'
        )}
      </div>
    )
  } else if (activeTab === 'this_week') {
    tabContent = (
      <div className={pageStyles.stack}>
        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Weekly priorities</h2>
                <p className={pageStyles.description}>
                  Give the week 3 to 5 defining moves before it gets consumed by noise.
                </p>
              </div>
              <span className={pageStyles.pill}>{weeklyPriorities.length} set</span>
            </div>
            <div className={styles.priorityDraft}>
              <InputField
                placeholder="Define the weekly move"
                value={priorityDraft.title}
                onChange={(event) =>
                  setPriorityDraft((current) => ({ ...current, title: event.target.value }))
                }
              />
              <label className={pageStyles.formGrid}>
                <span className={pageStyles.eyebrow}>Plan link</span>
                <select
                  value={priorityDraft.linked_plan_node_id}
                  onChange={(event) =>
                    setPriorityDraft((current) => ({
                      ...current,
                      linked_plan_node_id: event.target.value
                    }))
                  }
                >
                  <option value="">No plan link</option>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={pageStyles.formGrid}>
                <span className={pageStyles.eyebrow}>Application link</span>
                <select
                  value={priorityDraft.linked_application_id}
                  onChange={(event) =>
                    setPriorityDraft((current) => ({
                      ...current,
                      linked_application_id: event.target.value
                    }))
                  }
                >
                  <option value="">No application link</option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.title}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={() => void handleCreatePriority()}>Add priority</Button>
            </div>
            <div className={styles.priorityList}>
              {weeklyPriorities.length > 0 ? (
                weeklyPriorities.map((priority) => (
                  <div key={priority.id} className={styles.priorityRow}>
                    <div className={styles.priorityHeader}>
                      <strong>{priority.title}</strong>
                      <span className={pageStyles.muted}>
                        {priority.linked_plan_node_id
                          ? (planNodeLabels.get(priority.linked_plan_node_id) ?? 'Plan-linked')
                          : priority.linked_application_id
                            ? (applicationLabels.get(priority.linked_application_id) ?? 'Application-linked')
                            : 'Standalone'}
                      </span>
                    </div>
                    <div className={styles.priorityFields}>
                      <label className={pageStyles.formGrid}>
                        <span className={pageStyles.eyebrow}>Status</span>
                        <select
                          value={priority.status}
                          onChange={(event) =>
                            void updateWeeklyPriority({
                              id: priority.id,
                              status: event.target.value as (typeof WEEKLY_PRIORITY_STATUSES)[number]
                            }).then(() => refresh())
                          }
                        >
                          {WEEKLY_PRIORITY_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className={pageStyles.rowMeta}>{priority.week_key}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void deleteWeeklyPriority(priority.id).then(() => refresh())}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>The week has no priorities</strong>
                  <span>Set them here so Direction and Pipeline both have an operating owner.</span>
                </div>
              )}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Weekly reset</h2>
                <p className={pageStyles.description}>
                  Prompts, artifacts, and pressure items for the current weekly review cycle.
                </p>
              </div>
            </div>
            <div className={pageStyles.list}>
              {weeklyReset?.prompts.map((prompt) => (
                <div key={prompt.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{prompt.title}</span>
                  <span className={pageStyles.rowMeta}>{prompt.body}</span>
                </div>
              ))}
              {weeklyReset?.prompts.length === 0 ? (
                <div className={pageStyles.emptyState}>
                  <strong>No urgent reset prompts</strong>
                  <span>The week has enough structure to keep moving without extra prompting.</span>
                </div>
              ) : null}
            </div>
            <div className={pageStyles.list}>
              {weeklyReset?.artifacts.slice(0, 6).map((artifact) => (
                <div key={artifact.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{artifact.label}</span>
                  <span className={pageStyles.rowMeta}>{artifact.body}</span>
                </div>
              ))}
            </div>
            <div className={pageStyles.inlineActions}>
              <Button onClick={() => setActiveTab('review')}>Open full review</Button>
              <Button
                variant="outline"
                onClick={() => void handleGeneratePack('weekly_review')}
              >
                Export review pack
              </Button>
            </div>
          </article>
        </section>

        {renderActionLane(
          'this_week',
          'This week lane',
          'This is the real operating horizon for the week, not the someday pile.'
        )}
      </div>
    )
  } else if (activeTab === 'next') {
    tabContent = renderActionLane(
      'next',
      'Next lane',
      'Keep the near-term queue here so Today and This Week stay small.'
    )
  } else if (activeTab === 'waiting') {
    tabContent = renderActionLane(
      'waiting',
      'Waiting lane',
      'Track blocked or externally owned moves without letting them vanish.'
    )
  } else if (activeTab === 'someday') {
    tabContent = renderActionLane(
      'someday',
      'Someday lane',
      'Keep long-tail ideas parked here until they deserve a real commitment.'
    )
  } else if (activeTab === 'rituals') {
    tabContent = (
      <section className={pageStyles.grid2}>
        <article className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Rituals and habits</h2>
              <p className={pageStyles.description}>
                These are the repeatable behaviours that keep the operating system stable.
              </p>
            </div>
            <span className={pageStyles.pill}>{habits.length} rituals</span>
          </div>
          <div className={styles.inlineManager}>
            <InputField
              placeholder="Ritual name"
              value={habitDraft.name}
              onChange={(event) =>
                setHabitDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Button onClick={() => void handleSaveHabit()}>
              {editingHabitId ? 'Save ritual' : 'Add ritual'}
            </Button>
          </div>
          <TextareaField
            placeholder="Optional ritual description"
            rows={3}
            value={habitDraft.description}
            onChange={(event) =>
              setHabitDraft((current) => ({ ...current, description: event.target.value }))
            }
          />
          <InputField
            placeholder="Trigger context, e.g. After morning coffee"
            value={habitDraft.trigger_context}
            onChange={(event) =>
              setHabitDraft((current) => ({ ...current, trigger_context: event.target.value }))
            }
          />
          <label className={pageStyles.formGrid}>
            <span className={pageStyles.eyebrow}>Frequency</span>
            <select
              value={habitDraft.frequency}
              onChange={(event) =>
                setHabitDraft((current) => ({ ...current, frequency: event.target.value }))
              }
            >
              {HABIT_FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequency.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className={pageStyles.formGrid}>
            <span className={pageStyles.eyebrow}>Anchor habit</span>
            <select
              value={habitDraft.anchor_habit_id}
              onChange={(event) =>
                setHabitDraft((current) => ({ ...current, anchor_habit_id: event.target.value }))
              }
            >
              <option value="">No anchor habit</option>
              {habits
                .filter((habit) => habit.id !== editingHabitId)
                .map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name}
                  </option>
                ))}
            </select>
          </label>
          {editingHabitId ? (
            <div className={pageStyles.inlineActions}>
              <Button variant="outline" onClick={handleCancelHabitEdit}>
                Cancel edit
              </Button>
            </div>
          ) : null}
          <div className={styles.habitList}>
            {habits.map((habit) => (
              <div key={habit.id} className={styles.habitRow}>
                <div className={styles.priorityHeader}>
                  <strong>{habit.name}</strong>
                  <span className={pageStyles.muted}>
                    {habit.frequency.replace(/_/g, ' ')}
                    {habit.target_count > 1 ? ` · target ${habit.target_count}` : ''}
                  </span>
                </div>
                <div className={pageStyles.muted}>
                  {formatHabitSupportLine(habit, habitProgressById[habit.id])}
                </div>
                <div className={pageStyles.inlineActions}>
                  <label className={styles.habitCheck}>
                    <input
                      checked={habitProgressById[habit.id]?.currentPeriodCompleted ?? false}
                      type="checkbox"
                      onChange={(event) => void handleToggleHabit(habit.id, event.target.checked)}
                    />
                    <span className={pageStyles.muted}>
                      {habitProgressById[habit.id]?.currentPeriodCompleted
                        ? `Done ${habitProgressById[habit.id]?.periodLabel ?? 'today'}`
                        : `Mark ${habitProgressById[habit.id]?.periodLabel ?? 'today'}`}
                    </span>
                  </label>
                  {formatHabitStreak(habitProgressById[habit.id]) ? (
                    <span className={pageStyles.chip}>
                      {formatHabitStreak(habitProgressById[habit.id])}
                    </span>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => handleEditHabit(habit.id)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void deleteHabit(habit.id).then(() => refresh())}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Countdown trackers</h2>
              <p className={pageStyles.description}>
                Runway, applications, interviews, or deadlines. Add as many clocks as the system needs.
              </p>
            </div>
            <span className={pageStyles.pill}>{countdowns.length} live</span>
          </div>
          <div className={styles.countdownComposer}>
            <InputField
              placeholder="Countdown title"
              value={countdownDraft.title}
              onChange={(event) =>
                setCountdownDraft((current) => ({ ...current, title: event.target.value }))
              }
            />
            <InputField
              placeholder="Target date"
              type="date"
              value={countdownDraft.target_date}
              onChange={(event) =>
                setCountdownDraft((current) => ({ ...current, target_date: event.target.value }))
              }
            />
            <InputField
              placeholder="Category"
              value={countdownDraft.category}
              onChange={(event) =>
                setCountdownDraft((current) => ({ ...current, category: event.target.value }))
              }
            />
            <Button onClick={() => void createNewCountdown()}>Add tracker</Button>
          </div>
          <div className={styles.countdownList}>
            {countdowns.map((countdown) => (
              <div key={countdown.id} className={styles.countdownRow}>
                <div className={styles.priorityHeader}>
                  <strong>{countdown.title}</strong>
                  <span className={pageStyles.muted}>
                    {getCountdownDaysRemaining(countdown.target_date)} days
                  </span>
                </div>
                <div className={styles.countdownFields}>
                  <InputField
                    defaultValue={countdown.title}
                    onBlur={(event) =>
                      void updateCountdown({
                        id: countdown.id,
                        title: event.target.value,
                        category: countdown.category,
                        target_date: countdown.target_date
                      }).then(() => refresh())
                    }
                  />
                  <InputField
                    defaultValue={countdown.target_date}
                    type="date"
                    onBlur={(event) =>
                      void updateCountdown({
                        id: countdown.id,
                        title: countdown.title,
                        category: countdown.category,
                        target_date: event.target.value
                      }).then(() => refresh())
                    }
                  />
                  <InputField
                    defaultValue={countdown.category}
                    onBlur={(event) =>
                      void updateCountdown({
                        id: countdown.id,
                        title: countdown.title,
                        category: event.target.value,
                        target_date: countdown.target_date
                      }).then(() => refresh())
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void deleteCountdown(countdown.id).then(() => refresh())}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {countdowns.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <strong>No countdowns yet</strong>
                <span>Add one for applications, review cycles, exams, or big deliverables.</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    )
  } else if (activeTab === 'schedule') {
    tabContent = (
      <section className={pageStyles.grid2}>
        <article className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Profiles and schedule blocks</h2>
              <p className={pageStyles.description}>
                Treat the week like a profile you can shape, compare, and tune over time.
              </p>
            </div>
            <span className={pageStyles.pill}>{profiles.length} profiles</span>
          </div>
          <div className={styles.profileBar}>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={`${styles.profileChip} ${profile.id === activeProfileId ? styles.profileChipActive : ''}`}
                onClick={() => void setActiveProfileId(profile.id)}
                type="button"
              >
                {profile.name}
              </button>
            ))}
          </div>
          <div className={styles.inlineManager}>
            <InputField
              placeholder="New profile name"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
            />
            <Button onClick={() => void handleCreateProfile()}>Add profile</Button>
          </div>
          <div className={styles.inlineManager}>
            <InputField
              placeholder="Block label"
              value={timeBlockDraft.label}
              onChange={(event) =>
                setTimeBlockDraft((current) => ({ ...current, label: event.target.value }))
              }
            />
            <Button disabled={!activeProfileId} onClick={() => void handleCreateTimeBlock()}>
              Add block
            </Button>
          </div>
          <div className={styles.blockRowFields}>
            <InputField
              placeholder="Hours"
              value={timeBlockDraft.hours}
              onChange={(event) =>
                setTimeBlockDraft((current) => ({ ...current, hours: event.target.value }))
              }
            />
            <InputField
              placeholder="#8e8e93"
              value={timeBlockDraft.color}
              onChange={(event) =>
                setTimeBlockDraft((current) => ({ ...current, color: event.target.value }))
              }
            />
          </div>
          <div className={styles.blockList}>
            {timeBlocks.map((block) => (
              <div key={block.id} className={styles.blockRow}>
                <div className={styles.blockRowHeader}>
                  <strong>{block.label}</strong>
                  <span className={pageStyles.muted}>{block.hours} hours</span>
                </div>
                <div className={styles.blockRowFields}>
                  <InputField
                    defaultValue={block.label}
                    onBlur={(event) =>
                      void upsertTimeBlock({
                        id: block.id,
                        profile_id: block.profile_id,
                        label: event.target.value,
                        hours: block.hours,
                        color: block.color,
                        sort_order: block.sort_order
                      }).then(() => refresh())
                    }
                  />
                  <InputField
                    defaultValue={String(block.hours)}
                    onBlur={(event) =>
                      void upsertTimeBlock({
                        id: block.id,
                        profile_id: block.profile_id,
                        label: block.label,
                        hours: Number(event.target.value || 0),
                        color: block.color,
                        sort_order: block.sort_order
                      }).then(() => refresh())
                    }
                  />
                  <InputField
                    defaultValue={block.color}
                    onBlur={(event) =>
                      void upsertTimeBlock({
                        id: block.id,
                        profile_id: block.profile_id,
                        label: block.label,
                        hours: block.hours,
                        color: event.target.value,
                        sort_order: block.sort_order
                      }).then(() => refresh())
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void deleteTimeBlock(block.id).then(() => refresh())}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {timeBlocks.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <strong>No schedule blocks yet</strong>
                <span>Create a profile and give it real time blocks so the chart has shape.</span>
              </div>
            ) : null}
          </div>
        </article>

        <article className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Schedule signal</h2>
              <p className={pageStyles.description}>
                Compare the intended week against live calendar pressure and recent execution data.
              </p>
            </div>
            <span className={pageStyles.pill}>{activeProfile?.name ?? 'No active profile'}</span>
          </div>
          <div className={styles.chartWrap}>
            <canvas ref={canvasRef} />
          </div>
          <div className={styles.summaryStrip}>
            <div className={styles.miniMetric}>
              <span className={pageStyles.muted}>Days logged</span>
              <div className={styles.miniMetricValue}>{weekSummary?.days_logged ?? 0}</div>
            </div>
            <div className={styles.miniMetric}>
              <span className={pageStyles.muted}>Avg sleep</span>
              <div className={styles.miniMetricValue}>
                {(weekSummary?.average_sleep_hours ?? 0).toFixed(1)}
              </div>
            </div>
            <div className={styles.miniMetric}>
              <span className={pageStyles.muted}>Avg deep work</span>
              <div className={styles.miniMetricValue}>
                {Math.round(weekSummary?.average_deep_work_minutes ?? 0)}
              </div>
            </div>
          </div>
          <div className={pageStyles.list}>
            {eventsThisWeek.map((event) => (
              <div key={event.id} className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>{event.title}</span>
                <span className={pageStyles.rowMeta}>
                  {new Date(event.starts_at).toLocaleDateString('en-IE')}
                </span>
              </div>
            ))}
            {eventsThisWeek.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <strong>No imported calendar events</strong>
                <span>Bring in an ICS file or calendar integration from Settings.</span>
              </div>
            ) : null}
          </div>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            Open calendar settings
          </Button>
        </article>
      </section>
    )
  } else {
    tabContent = (
      <section className={pageStyles.grid2}>
        <article className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Weekly review</h2>
              <p className={pageStyles.description}>
                Close the week properly: wins, friction, next focus, proof move, pipeline move.
              </p>
            </div>
            <span className={pageStyles.pill}>{weekKey}</span>
          </div>
          <div className={styles.reviewGrid}>
            <TextareaField
              label="Wins"
              rows={4}
              value={reviewDraft.wins}
              onChange={(event) =>
                setReviewDraft((current) => ({ ...current, wins: event.target.value }))
              }
            />
            <TextareaField
              label="Friction"
              rows={4}
              value={reviewDraft.friction}
              onChange={(event) =>
                setReviewDraft((current) => ({ ...current, friction: event.target.value }))
              }
            />
            <TextareaField
              label="Next focus"
              rows={4}
              value={reviewDraft.focus_next}
              onChange={(event) =>
                setReviewDraft((current) => ({ ...current, focus_next: event.target.value }))
              }
            />
            <TextareaField
              label="Proof move"
              rows={4}
              value={reviewDraft.proof_move}
              onChange={(event) =>
                setReviewDraft((current) => ({ ...current, proof_move: event.target.value }))
              }
            />
            <TextareaField
              label="Pipeline move"
              rows={4}
              value={reviewDraft.pipeline_move}
              onChange={(event) =>
                setReviewDraft((current) => ({ ...current, pipeline_move: event.target.value }))
              }
            />
            <TextareaField
              label="Notes"
              rows={4}
              value={reviewDraft.notes}
              onChange={(event) =>
                setReviewDraft((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>
          <div className={pageStyles.inlineActions}>
            <Button onClick={() => void handleSaveReview()}>Save weekly review</Button>
            <Button variant="outline" onClick={() => void handleGeneratePack('weekly_review')}>
              Export review pack
            </Button>
            <Button variant="outline" onClick={() => void handleGeneratePack('workspace_dump')}>
              Workspace dump
            </Button>
          </div>
        </article>

        <article className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Reset prompts and artifacts</h2>
              <p className={pageStyles.description}>
                Review what the system thinks deserves attention before the next week starts.
              </p>
            </div>
          </div>
          <div className={styles.reviewList}>
            {weeklyReset?.prompts.map((prompt) => (
              <div key={prompt.id} className={styles.reviewPrompt}>
                <strong>{prompt.title}</strong>
                <span className={pageStyles.rowMeta}>{prompt.body}</span>
              </div>
            ))}
            {weeklyReset?.prompts.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <strong>No urgent prompts</strong>
                <span>The loop is reasonably well-closed for this week.</span>
              </div>
            ) : null}
          </div>
          <div className={styles.sectionDivider} />
          <div className={pageStyles.list}>
            {weeklyReset?.artifacts.map((artifact) => (
              <div key={artifact.id} className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>{artifact.label}</span>
                <span className={pageStyles.rowMeta}>{artifact.body}</span>
              </div>
            ))}
          </div>
          <div className={styles.sectionDivider} />
          <div className={pageStyles.list}>
            {weeklyReset?.actions.map((action) => (
              <div key={action.id} className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>{action.title}</span>
                <span className={pageStyles.rowMeta}>
                  {action.status.replace(/_/g, ' ')}
                  {action.due_at ? ` · ${formatTimestamp(action.due_at)}` : ''}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    )
  }

  return (
    <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Execution</span>
          <h1 className={pageStyles.title}>Capture, execute, review</h1>
          <p className={pageStyles.description}>
            The operating loop lives here now: triage what comes in, move concrete actions through
            the lanes, keep rituals honest, and close the week with a real review.
          </p>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.metricStrip}>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Inbox</span>
              <div className={pageStyles.metricValue}>{summary?.inbox.open ?? entries.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Today</span>
              <div className={pageStyles.metricValue}>{summary?.actions.by_status.today ?? 0}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>This week</span>
              <div className={pageStyles.metricValue}>
                {summary?.actions.by_status.this_week ?? 0}
              </div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Overdue</span>
              <div className={pageStyles.metricValue}>{summary?.actions.overdue.length ?? 0}</div>
            </div>
          </div>
        </section>

        <section className={`${pageStyles.card} ${pageStyles.cardTight}`}>
          <div className={styles.tabBar} role="tablist" aria-label="Execution sections">
            {([
              ['inbox', 'Inbox'],
              ['today', 'Today'],
              ['this_week', 'This Week'],
              ['next', 'Next'],
              ['waiting', 'Waiting'],
              ['someday', 'Someday'],
              ['rituals', 'Rituals'],
              ['schedule', 'Schedule'],
              ['review', 'Review']
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {tabContent}

        <section className={pageStyles.callout}>
          <strong>Execution touchpoints</strong>
          <div className={pageStyles.inlineActions}>
            <Button size="sm" variant="outline" onClick={() => navigate('/direction')}>
              Open direction
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/notes')}>
              Open notes
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/pipeline')}>
              Open pipeline
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
              Settings
            </Button>
          </div>
          <p className={pageStyles.description}>
            Execution is the hinge between long-range strategy and real output. If the week is not
            linked to phases, notes, and applications, the rest of the system turns decorative.
          </p>
        </section>
      </div>
    </div>
  )
}
