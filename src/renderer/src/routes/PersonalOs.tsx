import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, ArcElement, DoughnutController, Legend, Tooltip } from 'chart.js'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useOsStore } from '@renderer/stores/osStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'

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

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    chartRef.current?.destroy()
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
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              color: '#515154',
              font: {
                family: 'Inter, Segoe UI, sans-serif',
                size: 11
              }
            }
          }
        }
      }
    })

    return () => chartRef.current?.destroy()
  }, [chartBlocks])

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
    await loadSummary()
    pushToast({ message: 'Today’s Personal OS log saved.', type: 'success' })
  }

  async function handleCreateProfile(): Promise<void> {
    if (!profileName.trim()) {
      return
    }

    const profile = await createProfile({ name: profileName.trim() })
    setProfileName('')
    await setActiveProfileId(profile.id)
    await loadSummary()
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
    await loadSummary()
  }

  async function handleCreateHabit(): Promise<void> {
    if (!habitName.trim()) {
      return
    }

    await createHabit({ name: habitName.trim() })
    setHabitName('')
    await loadSummary()
  }

  async function handleCreateCountdown(): Promise<void> {
    if (!countdownDraft.title.trim() || !countdownDraft.target_date) {
      return
    }

    await createCountdown({
      title: countdownDraft.title.trim(),
      target_date: countdownDraft.target_date,
      category: countdownDraft.category
    })
    setCountdownDraft({ title: '', target_date: '', category: 'General' })
    await loadSummary()
  }

  const habitStatuses = new Map((summary?.os.habits ?? []).map((habit) => [habit.id, habit.today_completed]))

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Personal OS</span>
          <h1 className={pageStyles.title}>Daily Execution</h1>
          <p className={pageStyles.description}>
            Track the operating constraints that make the long-range plan executable.
          </p>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Schedule Profile</h2>
              <span className={pageStyles.pill}>{activeProfile?.name ?? 'No profile'}</span>
            </div>
            <div style={{ height: 320 }}>
              <canvas ref={canvasRef} />
            </div>
            <div className={pageStyles.pillRow}>
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className={pageStyles.pill}
                  onClick={() => void setActiveProfileId(profile.id)}
                  type="button"
                  style={{
                    background:
                      profile.id === activeProfileId ? 'rgba(0, 113, 227, 0.08)' : 'var(--lab-surface-muted)'
                  }}
                >
                  {profile.name}
                </button>
              ))}
            </div>
            <div className={pageStyles.inlineRow}>
              <InputField
                placeholder="New profile"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
              <Button onClick={() => void handleCreateProfile()}>Add Profile</Button>
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Today</h2>
              <span className={pageStyles.pill}>{today}</span>
            </div>
            <div className={pageStyles.grid2}>
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
                <span className={pageStyles.eyebrow}>Gym Done</span>
                <select
                  value={logDraft.gym_done ? 'yes' : 'no'}
                  onChange={(event) =>
                    setLogDraft((current) => ({
                      ...current,
                      gym_done: event.target.value === 'yes'
                    }))
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
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

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Profile Blocks</h2>
              <span className={pageStyles.pill}>{timeBlocks.length} items</span>
            </div>
            <div className={pageStyles.list}>
              {timeBlocks.map((block) => (
                <div key={block.id} className={pageStyles.listRow}>
                  <strong>{block.label}</strong>
                  <span className={pageStyles.muted}>{block.hours} hours</span>
                  <div className={pageStyles.inlineRow}>
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
                        }).then(() => loadSummary())
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
                          hours: Number(event.target.value || 0),
                          color: block.color,
                          sort_order: block.sort_order
                        }).then(() => loadSummary())
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
                        }).then(() => loadSummary())
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void deleteTimeBlock(block.id).then(() => {
                          void loadSummary()
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className={pageStyles.inlineRow}>
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
                placeholder="Color"
                value={timeBlockDraft.color}
                onChange={(event) =>
                  setTimeBlockDraft((current) => ({ ...current, color: event.target.value }))
                }
              />
              <Button onClick={() => void handleAddTimeBlock()}>Add Block</Button>
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Habits & Countdowns</h2>
              <span className={pageStyles.pill}>{countdowns.length} countdowns</span>
            </div>
            <div className={pageStyles.list}>
              {habits.map((habit) => (
                <label key={habit.id} className={pageStyles.listRow}>
                  <strong>{habit.name}</strong>
                  <span className={pageStyles.muted}>{habit.description ?? 'Daily operating habit'}</span>
                  <div className={pageStyles.inlineRow}>
                    <input
                      checked={habitStatuses.get(habit.id) ?? false}
                      type="checkbox"
                      onChange={(event) =>
                        void upsertHabitLog({
                          habit_id: habit.id,
                          date: today,
                          completed: event.target.checked
                        }).then(() => loadSummary())
                      }
                    />
                    <span className={pageStyles.muted}>Done today</span>
                  </div>
                </label>
              ))}
            </div>
            <div className={pageStyles.inlineRow}>
              <InputField
                placeholder="New habit"
                value={habitName}
                onChange={(event) => setHabitName(event.target.value)}
              />
              <Button onClick={() => void handleCreateHabit()}>Add Habit</Button>
            </div>
            <div className={pageStyles.list}>
              {countdowns.map((countdown) => (
                <div key={countdown.id} className={pageStyles.listRow}>
                  <strong>{countdown.title}</strong>
                  <span className={pageStyles.muted}>
                    {countdown.target_date} · {countdown.category}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => void deleteCountdown(countdown.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className={pageStyles.inlineRow}>
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
                  setCountdownDraft((current) => ({ ...current, category: event.target.value }))
                }
              />
              <Button onClick={() => void handleCreateCountdown()}>Add Countdown</Button>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
