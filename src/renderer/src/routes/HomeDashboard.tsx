import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'

function formatDate(value: number | null | undefined): string {
  if (!value) {
    return 'No date set'
  }

  return new Date(value).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short'
  })
}

export function HomeDashboard(): JSX.Element {
  const navigate = useNavigate()
  const { error, importStarterTemplate, isLoading, loadSummary, summary } = useDashboardStore()
  const bundle = useSettingsStore((state) => state.bundle)
  const loadBundle = useSettingsStore((state) => state.loadBundle)
  const pushToast = useToastStore((state) => state.push)

  useEffect(() => {
    void loadSummary()
    void loadBundle()
  }, [loadBundle, loadSummary])

  const showStarterPrompt =
    summary &&
    summary.counts.plan_nodes === 0 &&
    summary.counts.skills === 0 &&
    summary.counts.countdowns === 0 &&
    summary.os.profiles.length === 0

  const todayCompletedHabits = useMemo(
    () => (summary?.os.habits ?? []).filter((habit) => habit.today_completed).length,
    [summary]
  )

  async function handleImportStarterTemplate(): Promise<void> {
    try {
      await importStarterTemplate()
      pushToast({
        message: "Loaded David's starter template.",
        type: 'success'
      })
    } catch (importError) {
      pushToast({
        message:
          importError instanceof Error ? importError.message : 'Failed to import starter template.',
        type: 'error'
      })
    }
  }

  if (!summary) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.stack}>
          <section className={pageStyles.hero}>
            <span className={pageStyles.eyebrow}>Home</span>
            <h1 className={pageStyles.title}>Command Surface</h1>
            <p className={pageStyles.description}>
              {isLoading ? 'Loading the operating dashboard…' : (error ?? 'Preparing the system…')}
            </p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Home</span>
          <h1 className={pageStyles.title}>Three Horizons</h1>
          <p className={pageStyles.description}>
            Keep the day light, the week concrete, and the current phase honest. This page is the
            overview that tells you where to act next.
          </p>
        </section>

        {showStarterPrompt ? (
          <section className={`${pageStyles.card} ${pageStyles.cardTight}`}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Bootstrap the system</h2>
                <p className={pageStyles.description}>
                  Bring in the TCD → Columbia → Apple starter structure as editable local data, then
                  customize every piece from there.
                </p>
              </div>
              <Button disabled={isLoading} onClick={() => void handleImportStarterTemplate()}>
                {isLoading ? 'Loading…' : "Load David's starter template"}
              </Button>
            </div>
          </section>
        ) : null}

        <section className={pageStyles.grid3}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Today</h2>
              <span className={pageStyles.pill}>{summary.os.today ? 'logged' : 'not logged'}</span>
            </div>
            <div className={pageStyles.metricGrid}>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Deep Work</span>
                <div className={pageStyles.metricValue}>
                  {summary.os.today?.deep_work_minutes ?? 0}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Sleep</span>
                <div className={pageStyles.metricValue}>
                  {summary.os.today?.sleep_hours?.toFixed(1) ?? '0.0'}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Habits</span>
                <div className={pageStyles.metricValue}>
                  {todayCompletedHabits}/{summary.os.habits.length}
                </div>
              </div>
            </div>
            <div className={pageStyles.list}>
              <div className={pageStyles.listRow}>
                <strong>Primary profile</strong>
                <span className={pageStyles.muted}>
                  {summary.os.profiles.find(
                    (profile) => profile.id === summary.os.active_profile_id
                  )?.name ?? 'No profile selected'}
                </span>
              </div>
              <div className={pageStyles.listRow}>
                <strong>Training</strong>
                <span className={pageStyles.muted}>
                  {summary.os.today?.gym_done ? 'Done today' : 'Still open'}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/execution')}>
              Open Execution
            </Button>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>This Week</h2>
              <span className={pageStyles.pill}>{summary.weekly_priorities.length} priorities</span>
            </div>
            <div className={pageStyles.list}>
              {summary.weekly_priorities.length > 0 ? (
                summary.weekly_priorities.slice(0, 4).map((priority) => (
                  <div key={priority.id} className={pageStyles.listRow}>
                    <strong>{priority.title}</strong>
                    <span className={pageStyles.muted}>
                      {priority.status.replace(/_/g, ' ')}
                      {priority.linked_plan_node_id ? ' · phase-linked' : ''}
                      {priority.linked_application_id ? ' · pipeline-linked' : ''}
                    </span>
                  </div>
                ))
              ) : (
                <div className={pageStyles.listRow}>
                  <strong>No weekly priorities set</strong>
                  <span className={pageStyles.muted}>
                    Add 3–5 concrete priorities in Execution so the week has a real operating
                    horizon.
                  </span>
                </div>
              )}
            </div>
            <div className={pageStyles.list}>
              <div className={pageStyles.listRow}>
                <strong>Weekly review</strong>
                <span className={pageStyles.muted}>
                  {summary.weekly_review?.focus_next
                    ? 'Review captured and ready to guide the next move.'
                    : 'No weekly review written yet.'}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/execution')}>
              Plan the week
            </Button>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Current Phase</h2>
              <span className={pageStyles.pill}>
                {summary.active_phase?.status.replace(/_/g, ' ') ?? 'unset'}
              </span>
            </div>
            {summary.active_phase ? (
              <>
                <div className={pageStyles.listRow}>
                  <strong>{summary.active_phase.title}</strong>
                  <span className={pageStyles.muted}>
                    {summary.active_phase.summary ?? 'Add a phase summary in Direction.'}
                  </span>
                </div>
                <div className={pageStyles.list}>
                  {summary.active_phase_children.slice(0, 3).map((child) => (
                    <div key={child.id} className={pageStyles.listRow}>
                      <strong>{child.title}</strong>
                      <span className={pageStyles.muted}>
                        {child.kind.replace(/_/g, ' ')} · {child.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={pageStyles.listRow}>
                <strong>No active phase yet</strong>
                <span className={pageStyles.muted}>
                  Direction is where the long-range plan becomes a real editable system.
                </span>
              </div>
            )}
            <Button variant="outline" onClick={() => navigate('/direction')}>
              Open Direction
            </Button>
          </article>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Pressure Points</h2>
              <span className={pageStyles.pill}>
                {summary.countdowns.length} deadlines · {summary.blocking_alerts.length} blockers
              </span>
            </div>
            <div className={pageStyles.list}>
              {summary.countdowns.slice(0, 3).map((countdown) => (
                <div key={countdown.id} className={pageStyles.listRow}>
                  <strong>{countdown.title}</strong>
                  <span className={pageStyles.muted}>
                    {countdown.category} · {countdown.days_remaining} days remaining
                  </span>
                </div>
              ))}
              {summary.countdowns.length === 0 ? (
                <div className={pageStyles.listRow}>
                  <strong>No countdowns yet</strong>
                  <span className={pageStyles.muted}>
                    Add runway trackers in Execution so the week can feel time-bound.
                  </span>
                </div>
              ) : null}
            </div>
            <div className={pageStyles.list}>
              {summary.blocking_alerts.length > 0 ? (
                summary.blocking_alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={pageStyles.listRow}>
                    <strong>{alert.node_title}</strong>
                    <span className={pageStyles.muted}>{alert.reason}</span>
                  </div>
                ))
              ) : (
                <div className={pageStyles.listRow}>
                  <strong>No active blockers</strong>
                  <span className={pageStyles.muted}>
                    Blockers will appear here once phases, skills, and projects are wired together.
                  </span>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => navigate('/execution')}>
              Review Execution
            </Button>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Proof and Pipeline</h2>
              <span className={pageStyles.pill}>
                {summary.ecosystem.total_projects} projects · {summary.pipeline.active_applications}{' '}
                active applications
              </span>
            </div>
            <div className={pageStyles.metricGrid}>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Verified Skills</span>
                <div className={pageStyles.metricValue}>{summary.skill_coverage.verified}</div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Completed Projects</span>
                <div className={pageStyles.metricValue}>
                  {summary.ecosystem.by_execution_stage.completed}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Ready Assets</span>
                <div className={pageStyles.metricValue}>{summary.presence.ready_assets}</div>
              </div>
            </div>
            <div className={pageStyles.list}>
              {summary.pipeline.next_actions.length > 0 ? (
                summary.pipeline.next_actions.slice(0, 3).map((application) => (
                  <div key={application.id} className={pageStyles.listRow}>
                    <strong>{application.title}</strong>
                    <span className={pageStyles.muted}>
                      {application.status.replace(/_/g, ' ')}
                      {application.follow_up_at
                        ? ` · follow up ${formatDate(application.follow_up_at)}`
                        : application.deadline_at
                          ? ` · deadline ${formatDate(application.deadline_at)}`
                          : ''}
                    </span>
                  </div>
                ))
              ) : summary.ecosystem.recently_updated.slice(0, 3).map((project) => (
                  <div key={project.id} className={pageStyles.listRow}>
                    <strong>{project.name}</strong>
                    <span className={pageStyles.muted}>
                      {project.type} · {project.execution_stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
            </div>
            <Button onClick={() => navigate('/proof/projects')}>Open Proof</Button>
          </article>
        </section>

        {bundle?.dashboard_preferences.show_onboarding && summary.onboarding.needs_setup ? (
          <section className={`${pageStyles.card} ${pageStyles.cardTight}`}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Onboarding Signals</h2>
              <span className={pageStyles.pill}>{summary.onboarding.missing.length} missing</span>
            </div>
            <div className={pageStyles.list}>
              {summary.onboarding.missing.map((item) => (
                <div key={item} className={pageStyles.listRow}>
                  <strong>{item}</strong>
                  <span className={pageStyles.muted}>
                    Add this so the dashboard can behave like a real life operating system instead
                    of a partial shell.
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
