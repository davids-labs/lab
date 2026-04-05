import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, ArcElement, DoughnutController, Legend, Tooltip } from 'chart.js'
import { WEEKLY_PRIORITY_STATUSES } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useOsStore } from '@renderer/stores/osStore'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import { usePlanStore } from '@renderer/stores/planStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './PersonalOs.module.css'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

type ExecutionTab = 'today' | 'week' | 'rituals' | 'schedule' | 'review'

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

export function PersonalOs(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart<'doughnut'> | null>(null)
  const { loadSummary, summary } = useDashboardStore()
  const {
    activeProfileId,
    countdowns,
    createCountdown,
    createHabit,
    createProfile,
    createWeeklyPriority,
    currentLog,
    deleteCountdown,
    deleteTimeBlock,
    deleteWeeklyPriority,
    habits,
    loadCountdowns,
    loadDailyLog,
    loadDailyLogs,
    loadHabits,
    loadProfiles,
    loadWeeklyPriorities,
    loadWeeklyReview,
    profiles,
    setActiveProfileId,
    timeBlocks,
    updateCountdown,
    updateWeeklyPriority,
    upsertDailyLog,
    upsertHabitLog,
    upsertTimeBlock,
    upsertWeeklyReview,
    weeklyPriorities,
    weeklyReview
  } = useOsStore()
  const applications = usePipelineStore((state) => state.applications)
  const loadPipeline = usePipelineStore((state) => state.loadAll)
  const nodes = usePlanStore((state) => state.nodes)
  const loadNodes = usePlanStore((state) => state.loadNodes)
  const pushToast = useToastStore((state) => state.push)
  const today = getTodayDate()
  const weekKey = getCurrentWeekKey()
  const [profileName, setProfileName] = useState('')
  const [habitName, setHabitName] = useState('')
  const [logDraft, setLogDraft] = useState({
    sleep_hours: '0',
    calories: '0',
    protein_grams: '0',
    water_litres: '0',
    deep_work_minutes: '0',
    gym_done: false,
    notes: ''
  })
  const [timeBlockDraft, setTimeBlockDraft] = useState({ label: '', hours: '1', color: '#8e8e93' })
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
  const [activeTab, setActiveTab] = useState<ExecutionTab>('today')

  useEffect(() => {
    void loadSummary()
    void loadProfiles()
    void loadDailyLogs()
    void loadDailyLog(today)
    void loadHabits()
    void loadCountdowns()
    void loadWeeklyPriorities(weekKey)
    void loadWeeklyReview(weekKey)
    void loadNodes()
    void loadPipeline()
  }, [
    loadCountdowns,
    loadDailyLog,
    loadDailyLogs,
    loadHabits,
    loadNodes,
    loadPipeline,
    loadProfiles,
    loadSummary,
    loadWeeklyPriorities,
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

  const chartBlocks = summary?.os.time_blocks ?? timeBlocks
  const weekSummary = summary?.os.week
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? null
  const habitStatuses = new Map(
    (summary?.os.habits ?? []).map((habit) => [habit.id, habit.today_completed])
  )
  const planNodeLabels = useMemo(() => new Map(nodes.map((node) => [node.id, node.title])), [nodes])
  const applicationLabels = useMemo(
    () => new Map(applications.map((application) => [application.id, application.title])),
    [applications]
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
    await loadSummary()
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

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Execution</span>
          <h1 className={pageStyles.title}>Weekly Operating System</h1>
          <p className={pageStyles.description}>
            Run one lane at a time: log today, shape the week, keep rituals honest, and review the
            system without carrying every control at once.
          </p>
        </section>

        <section className={`${pageStyles.card} ${pageStyles.cardTight}`}>
          <div className={styles.tabBar} role="tablist" aria-label="Execution sections">
            {([
              ['today', 'Today'],
              ['week', 'Week'],
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

        {activeTab === 'week' ? (
          <section className={pageStyles.grid2}>
            <article className={pageStyles.card}>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <h2 className={pageStyles.cardTitle}>This Week</h2>
                  <p className={pageStyles.description}>Define the few moves that matter.</p>
                </div>
                <span className={pageStyles.pill}>{weekKey}</span>
              </div>
              <div className={styles.priorityDraft}>
                <InputField
                  placeholder="Add weekly priority"
                  value={priorityDraft.title}
                  onChange={(event) =>
                    setPriorityDraft((current) => ({ ...current, title: event.target.value }))
                  }
                />
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Plan item</span>
                  <select
                    value={priorityDraft.linked_plan_node_id}
                    onChange={(event) =>
                      setPriorityDraft((current) => ({
                        ...current,
                        linked_plan_node_id: event.target.value
                      }))
                    }
                  >
                    <option value="">No roadmap link</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Application</span>
                  <select
                    value={priorityDraft.linked_application_id}
                    onChange={(event) =>
                      setPriorityDraft((current) => ({
                        ...current,
                        linked_application_id: event.target.value
                      }))
                    }
                  >
                    <option value="">No pipeline link</option>
                    {applications.map((application) => (
                      <option key={application.id} value={application.id}>
                        {application.title}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  onClick={() =>
                    void createWeeklyPriority({
                      week_key: weekKey,
                      title: priorityDraft.title.trim(),
                      linked_plan_node_id: priorityDraft.linked_plan_node_id || null,
                      linked_application_id: priorityDraft.linked_application_id || null
                    }).then(async () => {
                      setPriorityDraft({
                        title: '',
                        linked_plan_node_id: '',
                        linked_application_id: ''
                      })
                      await refresh()
                    })
                  }
                >
                  Add Priority
                </Button>
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
                              ? (applicationLabels.get(priority.linked_application_id) ??
                                'Pipeline-linked')
                              : 'Standalone priority'}
                        </span>
                      </div>
                      <div className={styles.priorityFields}>
                        <InputField
                          defaultValue={priority.title}
                          onBlur={(event) =>
                            void updateWeeklyPriority({
                              id: priority.id,
                              title: event.target.value.trim() || priority.title
                            }).then(() => refresh())
                          }
                        />
                        <label className={pageStyles.formGrid}>
                          <span className={pageStyles.eyebrow}>Status</span>
                          <select
                            value={priority.status}
                            onChange={(event) =>
                              void updateWeeklyPriority({
                                id: priority.id,
                                status: event.target
                                  .value as (typeof WEEKLY_PRIORITY_STATUSES)[number]
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void deleteWeeklyPriority(priority.id).then(() => refresh())
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={pageStyles.listRow}>
                    <strong>No weekly priorities yet</strong>
                    <span className={pageStyles.muted}>
                      Add the 3–5 moves that define the week before it starts drifting.
                    </span>
                  </div>
                )}
              </div>
            </article>
          </section>
        ) : null}

        {activeTab === 'today' ? (
          <section className={pageStyles.grid2}>
            <article className={pageStyles.card}>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <h2 className={pageStyles.cardTitle}>Today</h2>
                  <p className={pageStyles.description}>
                    Fast manual telemetry for the operating day.
                  </p>
                </div>
                <span className={pageStyles.pill}>{today}</span>
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
              <div className={styles.logGrid}>
                <InputField
                  label="Sleep hours"
                  type="number"
                  value={logDraft.sleep_hours}
                  onChange={(event) =>
                    setLogDraft((current) => ({ ...current, sleep_hours: event.target.value }))
                  }
                />
                <InputField
                  label="Calories"
                  type="number"
                  value={logDraft.calories}
                  onChange={(event) =>
                    setLogDraft((current) => ({ ...current, calories: event.target.value }))
                  }
                />
                <InputField
                  label="Protein (g)"
                  type="number"
                  value={logDraft.protein_grams}
                  onChange={(event) =>
                    setLogDraft((current) => ({ ...current, protein_grams: event.target.value }))
                  }
                />
                <InputField
                  label="Water (L)"
                  type="number"
                  value={logDraft.water_litres}
                  onChange={(event) =>
                    setLogDraft((current) => ({ ...current, water_litres: event.target.value }))
                  }
                />
                <InputField
                  label="Deep work (min)"
                  type="number"
                  value={logDraft.deep_work_minutes}
                  onChange={(event) =>
                    setLogDraft((current) => ({
                      ...current,
                      deep_work_minutes: event.target.value
                    }))
                  }
                />
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Training</span>
                  <select
                    value={logDraft.gym_done ? 'yes' : 'no'}
                    onChange={(event) =>
                      setLogDraft((current) => ({
                        ...current,
                        gym_done: event.target.value === 'yes'
                      }))
                    }
                  >
                    <option value="yes">Done</option>
                    <option value="no">Missed</option>
                  </select>
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
              <Button onClick={() => void saveLog()}>Save Today&apos;s Log</Button>
            </article>
          </section>
        ) : null}

        {activeTab === 'review' ? (
          <section className={pageStyles.grid2}>
            <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Weekly Review</h2>
              <span className={pageStyles.pill}>Review loop</span>
            </div>
            <div className={styles.reviewGrid}>
              <TextareaField
                label="Wins"
                rows={3}
                value={reviewDraft.wins}
                onChange={(event) =>
                  setReviewDraft((current) => ({ ...current, wins: event.target.value }))
                }
              />
              <TextareaField
                label="Friction"
                rows={3}
                value={reviewDraft.friction}
                onChange={(event) =>
                  setReviewDraft((current) => ({ ...current, friction: event.target.value }))
                }
              />
              <TextareaField
                label="Focus next"
                rows={3}
                value={reviewDraft.focus_next}
                onChange={(event) =>
                  setReviewDraft((current) => ({ ...current, focus_next: event.target.value }))
                }
              />
              <TextareaField
                label="Proof move"
                rows={3}
                value={reviewDraft.proof_move}
                onChange={(event) =>
                  setReviewDraft((current) => ({ ...current, proof_move: event.target.value }))
                }
              />
              <TextareaField
                label="Pipeline move"
                rows={3}
                value={reviewDraft.pipeline_move}
                onChange={(event) =>
                  setReviewDraft((current) => ({ ...current, pipeline_move: event.target.value }))
                }
              />
              <TextareaField
                label="Notes"
                rows={3}
                value={reviewDraft.notes}
                onChange={(event) =>
                  setReviewDraft((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>
            <Button
              onClick={() =>
                void upsertWeeklyReview({
                  week_key: weekKey,
                  wins: reviewDraft.wins || null,
                  friction: reviewDraft.friction || null,
                  focus_next: reviewDraft.focus_next || null,
                  proof_move: reviewDraft.proof_move || null,
                  pipeline_move: reviewDraft.pipeline_move || null,
                  notes: reviewDraft.notes || null
                }).then(() => pushToast({ message: 'Weekly review saved.', type: 'success' }))
              }
            >
              Save Weekly Review
            </Button>
          </article>
          </section>
        ) : null}

        {activeTab === 'rituals' ? (
          <section className={pageStyles.grid2}>
            <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Rituals and Runway</h2>
              <span className={pageStyles.pill}>{countdowns.length} countdowns</span>
            </div>
            <div className={styles.inlineManager}>
              <InputField
                placeholder="New habit"
                value={habitName}
                onChange={(event) => setHabitName(event.target.value)}
              />
              <Button
                onClick={() =>
                  void createHabit({ name: habitName.trim() }).then(async () => {
                    setHabitName('')
                    await refresh()
                  })
                }
              >
                Add Habit
              </Button>
            </div>
            <div className={styles.habitList}>
              {habits.map((habit) => (
                <label key={habit.id} className={styles.habitRow}>
                  <strong>{habit.name}</strong>
                  <span className={pageStyles.muted}>
                    {habit.description ?? 'Daily operating habit'}
                  </span>
                  <span className={styles.habitCheck}>
                    <input
                      checked={habitStatuses.get(habit.id) ?? false}
                      type="checkbox"
                      onChange={(event) =>
                        void upsertHabitLog({
                          habit_id: habit.id,
                          date: today,
                          completed: event.target.checked
                        }).then(() => refresh())
                      }
                    />
                    <span className={pageStyles.muted}>Done today</span>
                  </span>
                </label>
              ))}
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
              <Button onClick={() => void createNewCountdown()}>Add Countdown</Button>
            </div>
            <div className={styles.countdownList}>
              {countdowns.map((countdown) => (
                <div key={countdown.id} className={styles.countdownRow}>
                  <div className={styles.blockRowHeader}>
                    <strong>{countdown.title}</strong>
                    <span className={pageStyles.muted}>{countdown.target_date}</span>
                  </div>
                  <div className={styles.countdownFields}>
                    <InputField
                      defaultValue={countdown.title}
                      onBlur={(event) =>
                        void updateCountdown({
                          id: countdown.id,
                          title: event.target.value.trim() || countdown.title
                        }).then(() => refresh())
                      }
                    />
                    <InputField
                      type="date"
                      defaultValue={countdown.target_date}
                      onBlur={(event) =>
                        void updateCountdown({
                          id: countdown.id,
                          target_date: event.target.value || countdown.target_date
                        }).then(() => refresh())
                      }
                    />
                    <InputField
                      defaultValue={countdown.category}
                      onBlur={(event) =>
                        void updateCountdown({
                          id: countdown.id,
                          category: event.target.value.trim() || countdown.category
                        }).then(() => refresh())
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void deleteCountdown(countdown.id).then(() => refresh())}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>
          </section>
        ) : null}

        {activeTab === 'schedule' ? (
          <section className={pageStyles.grid2}>
            <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Schedule Profile</h2>
              <span className={pageStyles.pill}>{activeProfile?.name ?? 'No profile'}</span>
            </div>
            <div className={styles.chartWrap}>
              <canvas ref={canvasRef} />
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
                placeholder="New schedule profile"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
              <Button
                onClick={() =>
                  void createProfile({ name: profileName.trim() }).then(async (profile) => {
                    setProfileName('')
                    await setActiveProfileId(profile.id)
                    await refresh()
                  })
                }
              >
                Add Profile
              </Button>
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Profile Blocks</h2>
              <span className={pageStyles.pill}>{timeBlocks.length} items</span>
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
                          label: event.target.value.trim() || block.label,
                          hours: block.hours,
                          color: block.color,
                          sort_order: block.sort_order
                        }).then(() => refresh())
                      }
                    />
                    <InputField
                      defaultValue={String(block.hours)}
                      type="number"
                      onBlur={(event) =>
                        void upsertTimeBlock({
                          id: block.id,
                          profile_id: block.profile_id,
                          label: block.label,
                          hours: Number(event.target.value || block.hours),
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
                          color: event.target.value.trim() || block.color,
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
            </div>
            <div className={styles.blockRow}>
              <div className={styles.blockRowHeader}>
                <strong>Add schedule block</strong>
                <span className={pageStyles.muted}>New</span>
              </div>
              <div className={styles.blockRowFields}>
                <InputField
                  placeholder="Block label"
                  value={timeBlockDraft.label}
                  onChange={(event) =>
                    setTimeBlockDraft((current) => ({ ...current, label: event.target.value }))
                  }
                />
                <InputField
                  placeholder="Hours"
                  type="number"
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
                <Button
                  onClick={() =>
                    void upsertTimeBlock({
                      profile_id: activeProfileId ?? '',
                      label: timeBlockDraft.label.trim(),
                      hours: Number(timeBlockDraft.hours || 0),
                      color: timeBlockDraft.color
                    }).then(async () => {
                      setTimeBlockDraft({ label: '', hours: '1', color: '#8e8e93' })
                      await refresh()
                    })
                  }
                  disabled={!activeProfileId || !timeBlockDraft.label.trim()}
                >
                  Add Block
                </Button>
              </div>
            </div>
          </article>
          </section>
        ) : null}
      </div>
    </div>
  )
}
