import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, ArcElement, DoughnutController, Legend, Tooltip } from 'chart.js'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useOsStore } from '@renderer/stores/osStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './PersonalOs.module.css'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10)
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
    currentLog,
    deleteCountdown,
    deleteTimeBlock,
    habits,
    loadCountdowns,
    loadDailyLog,
    loadDailyLogs,
    loadHabits,
    loadProfiles,
    profiles,
    setActiveProfileId,
    timeBlocks,
    updateCountdown,
    upsertDailyLog,
    upsertHabitLog,
    upsertTimeBlock
  } = useOsStore()
  const pushToast = useToastStore((state) => state.push)
  const today = getTodayDate()
  const [logDraft, setLogDraft] = useState({
    sleep_hours: '0',
    calories: '0',
    protein_grams: '0',
    water_litres: '0',
    deep_work_minutes: '0',
    gym_done: false,
    notes: ''
  })
  const [profileName, setProfileName] = useState('')
  const [timeBlockDraft, setTimeBlockDraft] = useState({
    label: '',
    hours: '1',
    color: '#8e8e93'
  })
  const [habitName, setHabitName] = useState('')
  const [countdownDraft, setCountdownDraft] = useState({
    title: '',
    target_date: '',
    category: 'General'
  })

  useEffect(() => {
    void loadSummary()
    void loadProfiles()
    void loadDailyLogs()
    void loadDailyLog(today)
    void loadHabits()
    void loadCountdowns()
  }, [loadCountdowns, loadDailyLog, loadDailyLogs, loadHabits, loadProfiles, loadSummary, today])

  useEffect(() => {
    if (!currentLog) {
      setLogDraft({
        sleep_hours: '0',
        calories: '0',
        protein_grams: '0',
        water_litres: '0',
        deep_work_minutes: '0',
        gym_done: false,
        notes: ''
      })
      return
    }

    setLogDraft({
      sleep_hours: String(currentLog.sleep_hours ?? 0),
      calories: String(currentLog.calories ?? 0),
      protein_grams: String(currentLog.protein_grams ?? 0),
      water_litres: String(currentLog.water_litres ?? 0),
      deep_work_minutes: String(currentLog.deep_work_minutes ?? 0),
      gym_done: currentLog.gym_done,
      notes: currentLog.notes ?? ''
    })
  }, [currentLog])

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, profiles]
  )
  const chartBlocks = summary?.os.time_blocks ?? timeBlocks
  const weekSummary = summary?.os.week
  const habitStatuses = new Map(
    (summary?.os.habits ?? []).map((habit) => [habit.id, habit.today_completed])
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
              font: {
                family: 'Segoe UI Variable Text, Segoe UI, sans-serif',
                size: 11
              }
            }
          }
        }
      }
    })

    return () => chartRef.current?.destroy()
  }, [chartBlocks])

  async function refreshDashboardSummary(): Promise<void> {
    await loadSummary()
  }

  async function handleSaveLog(): Promise<void> {
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
    await refreshDashboardSummary()
    pushToast({ message: "Today's Personal OS log saved.", type: 'success' })
  }

  async function handleCreateProfile(): Promise<void> {
    if (!profileName.trim()) {
      return
    }

    const profile = await createProfile({ name: profileName.trim() })
    setProfileName('')
    await setActiveProfileId(profile.id)
    await refreshDashboardSummary()
    pushToast({ message: 'Added schedule profile.', type: 'success' })
  }

  async function handleAddTimeBlock(): Promise<void> {
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
    await refreshDashboardSummary()
    pushToast({ message: 'Added schedule block.', type: 'success' })
  }

  async function handleCreateHabit(): Promise<void> {
    if (!habitName.trim()) {
      return
    }

    await createHabit({ name: habitName.trim() })
    setHabitName('')
    await refreshDashboardSummary()
    pushToast({ message: 'Added habit tracker.', type: 'success' })
  }

  async function handleCreateCountdown(): Promise<void> {
    if (!countdownDraft.title.trim() || !countdownDraft.target_date) {
      return
    }

    await createCountdown({
      title: countdownDraft.title.trim(),
      target_date: countdownDraft.target_date,
      category: countdownDraft.category.trim() || 'General'
    })
    setCountdownDraft({ title: '', target_date: '', category: 'General' })
    await refreshDashboardSummary()
    pushToast({ message: 'Added countdown tracker.', type: 'success' })
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Personal OS</span>
          <h1 className={pageStyles.title}>Daily Execution</h1>
          <p className={pageStyles.description}>
            Add and edit your schedule profiles, daily telemetry, habits, and countdown trackers
            here.
          </p>
        </section>

        <section className={styles.topGrid}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Schedule Profiles</h2>
                <p className={pageStyles.description}>
                  Shape the operating week here. The chart and home dashboard pull from this data.
                </p>
              </div>
              <span className={pageStyles.pill}>{activeProfile?.name ?? 'No profile'}</span>
            </div>
            <div className={styles.chartWrap}>
              <canvas ref={canvasRef} />
            </div>
            <div className={styles.profileBar}>
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className={`${styles.profileChip} ${
                    profile.id === activeProfileId ? styles.profileChipActive : ''
                  }`}
                  onClick={() => void setActiveProfileId(profile.id)}
                  type="button"
                >
                  {profile.name}
                </button>
              ))}
            </div>
            <div className={styles.toolbar}>
              <InputField
                placeholder="New schedule profile"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
              <Button onClick={() => void handleCreateProfile()}>Add Profile</Button>
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Today</h2>
                <p className={pageStyles.description}>
                  Manual daily logging, local-first and fast enough to keep up with real life.
                </p>
              </div>
              <span className={pageStyles.pill}>{today}</span>
            </div>
            <div className={styles.summaryStrip}>
              <div className={styles.miniMetric}>
                <span className={pageStyles.muted}>Days Logged</span>
                <div className={styles.miniMetricValue}>{weekSummary?.days_logged ?? 0}</div>
              </div>
              <div className={styles.miniMetric}>
                <span className={pageStyles.muted}>Avg Sleep</span>
                <div className={styles.miniMetricValue}>
                  {(weekSummary?.average_sleep_hours ?? 0).toFixed(1)}
                </div>
              </div>
              <div className={styles.miniMetric}>
                <span className={pageStyles.muted}>Avg Deep Work</span>
                <div className={styles.miniMetricValue}>
                  {Math.round(weekSummary?.average_deep_work_minutes ?? 0)}
                </div>
              </div>
            </div>
            <div className={styles.logGrid}>
              <InputField
                label="Sleep Hours"
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
                label="Deep Work (min)"
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
            <Button onClick={() => void handleSaveLog()}>Save Today&apos;s Log</Button>
          </article>
        </section>

        <section className={styles.managerGrid}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Profile Blocks</h2>
                <p className={pageStyles.description}>
                  Edit the named time slices that make up the selected schedule profile.
                </p>
              </div>
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
                        }).then(() => refreshDashboardSummary())
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
                        }).then(() => refreshDashboardSummary())
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
                        }).then(() => refreshDashboardSummary())
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void deleteTimeBlock(block.id).then(() => {
                          void refreshDashboardSummary()
                        })
                      }
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
                <Button onClick={() => void handleAddTimeBlock()}>Add Block</Button>
              </div>
            </div>
          </article>

          <div className={styles.splitCard}>
            <article className={pageStyles.card}>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <h2 className={pageStyles.cardTitle}>Habits</h2>
                  <p className={pageStyles.description}>
                    Fast binary check-ins for the habits that keep the system online.
                  </p>
                </div>
                <span className={pageStyles.pill}>{habits.length} tracked</span>
              </div>
              <div className={styles.toolbar}>
                <InputField
                  placeholder="New habit"
                  value={habitName}
                  onChange={(event) => setHabitName(event.target.value)}
                />
                <Button onClick={() => void handleCreateHabit()}>Add Habit</Button>
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
                          }).then(() => refreshDashboardSummary())
                        }
                      />
                      <span className={pageStyles.muted}>Done today</span>
                    </span>
                  </label>
                ))}
              </div>
            </article>

            <article className={pageStyles.card}>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <h2 className={pageStyles.cardTitle}>Countdown Trackers</h2>
                  <p className={pageStyles.description}>
                    Add, edit, and remove any runway or deadline tracker here.
                  </p>
                </div>
                <span className={pageStyles.pill}>{countdowns.length} active</span>
              </div>
              <div className={styles.countdownRow}>
                <div className={styles.countdownFields}>
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
                      setCountdownDraft((current) => ({
                        ...current,
                        target_date: event.target.value
                      }))
                    }
                  />
                  <InputField
                    placeholder="Category"
                    value={countdownDraft.category}
                    onChange={(event) =>
                      setCountdownDraft((current) => ({
                        ...current,
                        category: event.target.value
                      }))
                    }
                  />
                  <Button onClick={() => void handleCreateCountdown()}>Add</Button>
                </div>
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
                          }).then(() => refreshDashboardSummary())
                        }
                      />
                      <InputField
                        type="date"
                        defaultValue={countdown.target_date}
                        onBlur={(event) =>
                          void updateCountdown({
                            id: countdown.id,
                            target_date: event.target.value || countdown.target_date
                          }).then(() => refreshDashboardSummary())
                        }
                      />
                      <InputField
                        defaultValue={countdown.category}
                        onBlur={(event) =>
                          void updateCountdown({
                            id: countdown.id,
                            category: event.target.value.trim() || countdown.category
                          }).then(() => refreshDashboardSummary())
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          void deleteCountdown(countdown.id).then(() => {
                            void refreshDashboardSummary()
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}
