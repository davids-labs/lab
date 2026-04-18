import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { useOsStore, type HabitProgress } from '@renderer/stores/osStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import { useWorkflowStore } from '@renderer/stores/workflowStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './WorkflowViews.module.css'

function formatHabitStreak(progress: HabitProgress | undefined): string | null {
  if (!progress || progress.currentStreak === 0) {
    return null
  }

  const unit = progress.streakUnit === 'week' ? 'week' : 'day'
  const suffix = progress.currentStreak === 1 ? '' : 's'
  return `${progress.currentStreak}-${unit}${suffix}`
}

function formatHabitContext(
  description: string | null,
  triggerContext: string | null,
  progress: HabitProgress | undefined
): string {
  const parts = [
    description,
    triggerContext,
    progress?.anchorLabel ? `After ${progress.anchorLabel}` : null
  ].filter((value): value is string => Boolean(value))

  return parts.length > 0 ? parts.join(' · ') : `Still open ${progress?.periodLabel ?? 'today'}`
}

export function DayView(): JSX.Element {
  const navigate = useNavigate()
  const snapshot = useWorkflowStore((state) => state.snapshots.day)
  const loadSnapshot = useWorkflowStore((state) => state.loadSnapshot)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const { habitProgressById, habits, loadHabitLogs, loadHabits, toggleHabitCompletion } = useOsStore()
  const pushToast = useToastStore((state) => state.push)

  useEffect(() => {
    void loadSnapshot('day')
    void loadHabits()
    void loadHabitLogs()
  }, [loadHabitLogs, loadHabits, loadSnapshot])

  const todayCompletedHabits = useMemo(
    () => habits.filter((habit) => habitProgressById[habit.id]?.currentPeriodCompleted).length,
    [habitProgressById, habits]
  )

  async function handleToggleHabit(habitId: string, completed: boolean): Promise<void> {
    const { habit, progress } = await toggleHabitCompletion(habitId, completed)
    await loadSnapshot('day')
    pushToast({
      message: completed
        ? `Logged ${habit.name}.${progress.currentStreak > 0 ? ` ${formatHabitStreak(progress)} streak.` : ''}`
        : `Cleared ${habit.name} for ${progress.periodLabel}.`,
      type: 'success'
    })
  }

  if (!snapshot) {
    return (
      <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
        <div className={pageStyles.stack}>
          <section className={pageStyles.lead}>
            <span className={pageStyles.eyebrow}>Day</span>
            <h1 className={pageStyles.title}>Loading the operating surface</h1>
            <p className={pageStyles.description}>
              Pulling together the cross-system context for today.
            </p>
          </section>
        </div>
      </div>
    )
  }

  const directive = snapshot.morning_directive
  const weeklyDone = snapshot.dashboard.weekly_priorities.filter((item) => item.status === 'done').length

  return (
    <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Day</span>
          <h1 className={pageStyles.title}>What matters now</h1>
          <p className={pageStyles.description}>
            One page for the live operating loop: directive, next moves, habits, and the pressure
            coming from the week and the phase.
          </p>
        </section>

        <section className={styles.directiveCard}>
          <span className={pageStyles.eyebrow}>Morning synthesis</span>
          <h2 className={styles.directiveHeadline}>
            {directive?.headline ?? 'No directive yet.'}
          </h2>
          <p className={pageStyles.description}>
            {directive?.reason ??
              'The system does not have enough cross-domain pressure to pick a lead move yet.'}
          </p>
          {directive ? (
            <div className={pageStyles.inlineActions}>
              <Button onClick={() => navigate(directive.target_route)}>Open the lead surface</Button>
              <Button variant="outline" onClick={() => void loadSnapshot('day')}>
                Refresh synthesis
              </Button>
            </div>
          ) : null}
        </section>

        <section className={pageStyles.twoColumn}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Next 3 moves</h2>
                <p className={pageStyles.sectionDescription}>
                  Ranked from overdue execution, pipeline urgency, blockers, habits, deadlines, and
                  unresolved source work.
                </p>
              </div>
            </div>
            <div className={styles.denseList}>
              {snapshot.next_moves.slice(0, 3).map((move) => (
                <div key={move.id} className={styles.moveRow}>
                  <div className={styles.moveHeader}>
                    <div>
                      <div className={styles.moveTitle}>{move.title}</div>
                      <div className={styles.moveReason}>{move.reason}</div>
                    </div>
                    <span className={styles.scorePill}>{move.score}</span>
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <Button size="sm" onClick={() => navigate(move.target_route)}>
                      Open
                    </Button>
                    <span className={styles.miniPill}>{move.category.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Day in system context</h2>
                <p className={pageStyles.sectionDescription}>
                  The day is only useful when the week, the current phase, and the nearest pressure
                  are visible at the same time.
                </p>
              </div>
            </div>
            <div className={pageStyles.metricStrip}>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Weekly priorities</span>
                <div className={pageStyles.metricValue}>
                  {weeklyDone}/{snapshot.dashboard.weekly_priorities.length}
                </div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Open blockers</span>
                <div className={pageStyles.metricValue}>{snapshot.dashboard.blocking_alerts.length}</div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Follow-ups due</span>
                <div className={pageStyles.metricValue}>{snapshot.dashboard.pipeline.next_actions.length}</div>
              </div>
            </div>
            <div className={pageStyles.list}>
              <div className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>Current phase</span>
                <span className={pageStyles.rowMeta}>
                  {snapshot.dashboard.active_phase?.title ?? 'No active phase'}
                </span>
              </div>
              <div className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>Nearest countdown</span>
                <span className={pageStyles.rowMeta}>
                  {snapshot.dashboard.countdowns[0]
                    ? `${snapshot.dashboard.countdowns[0].title} · ${snapshot.dashboard.countdowns[0].days_remaining}d`
                    : 'No countdown pressure tracked'}
                </span>
              </div>
              <div className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>Library pending</span>
                <span className={pageStyles.rowMeta}>
                  {snapshot.dashboard.library.pending_suggestions} suggestions waiting to be routed
                </span>
              </div>
            </div>
          </article>
        </section>

        <section className={pageStyles.twoColumn}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Today&apos;s habits</h2>
                <p className={pageStyles.sectionDescription}>
                  Quick-log the repeatable behaviors directly from the day surface.
                </p>
              </div>
              <span className={pageStyles.chip}>
                {todayCompletedHabits}/{habits.length} complete
              </span>
            </div>
            <div className={pageStyles.list}>
              {habits.map((habit) => (
                <div key={habit.id} className={pageStyles.row}>
                  <div className={pageStyles.inlineActions}>
                    <label className={pageStyles.inlineRow}>
                      <input
                        checked={habitProgressById[habit.id]?.currentPeriodCompleted ?? false}
                        type="checkbox"
                        onChange={(event) =>
                          void handleToggleHabit(habit.id, event.target.checked)
                        }
                      />
                      <span>
                        <span className={pageStyles.rowTitle}>{habit.name}</span>
                        <span className={pageStyles.rowMeta}>
                          {formatHabitContext(
                            habit.description,
                            habit.trigger_context,
                            habitProgressById[habit.id]
                          )}
                        </span>
                      </span>
                    </label>
                    <div className={pageStyles.chipRow}>
                      {formatHabitStreak(habitProgressById[habit.id]) ? (
                        <span className={pageStyles.chip}>
                          {formatHabitStreak(habitProgressById[habit.id])}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Pressure feed</h2>
                <p className={pageStyles.sectionDescription}>
                  The day should keep overdue follow-ups and blockers close without making you hunt
                  through separate workspaces.
                </p>
              </div>
            </div>
            <div className={pageStyles.list}>
              {snapshot.dashboard.pipeline.next_actions.slice(0, 3).map((application) => (
                <div key={application.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{application.title}</span>
                  <span className={pageStyles.rowMeta}>
                    {application.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
              {snapshot.dashboard.blocking_alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{alert.node_title}</span>
                  <span className={pageStyles.rowMeta}>{alert.reason}</span>
                </div>
              ))}
            </div>
            <div className={pageStyles.inlineActions}>
              <Button variant="outline" onClick={() => navigate('/week')}>
                Open week view
              </Button>
              <Button variant="outline" onClick={() => navigate('/execution')}>
                Open execution studio
              </Button>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
