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
          <section className={pageStyles.lead}>
            <span className={pageStyles.eyebrow}>Home</span>
            <h1 className={pageStyles.title}>Loading the command surface</h1>
            <p className={pageStyles.description}>
              {isLoading ? 'Pulling the latest operating context…' : (error ?? 'Preparing the page…')}
            </p>
          </section>
        </div>
      </div>
    )
  }

  const homeLayout = bundle?.dashboard_preferences.preferred_home_layout ?? 'horizons'
  const horizonClass = homeLayout === 'focused' ? pageStyles.grid2 : pageStyles.grid3

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Home</span>
          <h1 className={pageStyles.title}>Three horizons, one operating page</h1>
          <p className={pageStyles.description}>
            Keep the day light, the week concrete, and the current phase honest. This page should
            tell you where to act next without making you parse a dashboard wall.
          </p>
        </section>

        {showStarterPrompt ? (
          <section className={pageStyles.callout}>
            <strong>Start with a real structure</strong>
            <p className={pageStyles.description}>
              Load the David starter system as editable local data, then make the roadmap, skills,
              rituals, and countdowns your own.
            </p>
            <div className={pageStyles.inlineActions}>
              <Button disabled={isLoading} onClick={() => void handleImportStarterTemplate()}>
                {isLoading ? 'Loading…' : "Load David's starter template"}
              </Button>
              <Button variant="outline" onClick={() => navigate('/library')}>
                Open Library
              </Button>
            </div>
          </section>
        ) : null}

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Quick capture</h2>
              <p className={pageStyles.sectionDescription}>
                Jump straight into the next operating move instead of hunting through the shell.
              </p>
            </div>
          </div>
          <div className={pageStyles.inlineActions}>
            <Button size="sm" onClick={() => navigate('/execution')}>
              Weekly priority
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/execution')}>
              Countdown
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/pipeline')}>
              Application
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/library')}>
              Import doc
            </Button>
          </div>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Three Horizons</h2>
              <p className={pageStyles.sectionDescription}>
                Today, this week, and the current phase are the three layers that should stay in
                tension.
              </p>
            </div>
          </div>

          <div className={horizonClass}>
            <article className={pageStyles.softSection}>
              <div className={pageStyles.sectionHeader}>
                <h3 className={pageStyles.cardTitle}>Today</h3>
                <span className={pageStyles.chip}>{summary.os.today ? 'Logged' : 'Open'}</span>
              </div>
              <div className={pageStyles.metricStrip}>
                <div className={pageStyles.metric}>
                  <span className={pageStyles.muted}>Deep work</span>
                  <div className={pageStyles.metricValue}>
                    {summary.os.today?.deep_work_minutes ?? 0}
                  </div>
                </div>
                <div className={pageStyles.metric}>
                  <span className={pageStyles.muted}>Sleep</span>
                  <div className={pageStyles.metricValue}>
                    {summary.os.today?.sleep_hours?.toFixed(1) ?? '0.0'}
                  </div>
                </div>
                <div className={pageStyles.metric}>
                  <span className={pageStyles.muted}>Habits</span>
                  <div className={pageStyles.metricValue}>
                    {todayCompletedHabits}/{summary.os.habits.length}
                  </div>
                </div>
              </div>
              <div className={pageStyles.list}>
                <div className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>Primary profile</span>
                  <span className={pageStyles.rowMeta}>
                    {summary.os.profiles.find(
                      (profile) => profile.id === summary.os.active_profile_id
                    )?.name ?? 'No profile selected'}
                  </span>
                </div>
                <div className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>Training</span>
                  <span className={pageStyles.rowMeta}>
                    {summary.os.today?.gym_done ? 'Completed today' : 'Still open'}
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/execution')}>
                Open execution
              </Button>
            </article>

            <article className={pageStyles.softSection}>
              <div className={pageStyles.sectionHeader}>
                <h3 className={pageStyles.cardTitle}>This week</h3>
                <span className={pageStyles.chip}>{summary.weekly_priorities.length} priorities</span>
              </div>
              <div className={pageStyles.list}>
                {summary.weekly_priorities.length > 0 ? (
                  summary.weekly_priorities.slice(0, 4).map((priority) => (
                    <div key={priority.id} className={pageStyles.row}>
                      <span className={pageStyles.rowTitle}>{priority.title}</span>
                      <span className={pageStyles.rowMeta}>
                        {priority.status.replace(/_/g, ' ')}
                        {priority.linked_plan_node_id ? ' · roadmap-linked' : ''}
                        {priority.linked_application_id ? ' · pipeline-linked' : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={pageStyles.emptyState}>
                    <strong>No weekly priorities yet</strong>
                    <span>Add 3 to 5 moves in Execution so the week has a concrete horizon.</span>
                  </div>
                )}
              </div>
              <div className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>Weekly review</span>
                <span className={pageStyles.rowMeta}>
                  {summary.weekly_review?.focus_next
                    ? 'Review captured and ready to steer the next week.'
                    : 'No weekly review written yet.'}
                </span>
              </div>
              <Button variant="outline" onClick={() => navigate('/execution')}>
                Plan the week
              </Button>
            </article>

            <article className={pageStyles.softSection}>
              <div className={pageStyles.sectionHeader}>
                <h3 className={pageStyles.cardTitle}>Current phase</h3>
                <span className={pageStyles.chip}>
                  {summary.active_phase?.status.replace(/_/g, ' ') ?? 'Unset'}
                </span>
              </div>
              {summary.active_phase ? (
                <>
                  <div className={pageStyles.row}>
                    <span className={pageStyles.rowTitle}>{summary.active_phase.title}</span>
                    <span className={pageStyles.rowMeta}>
                      {summary.active_phase.summary ?? 'Add a phase summary in Direction.'}
                    </span>
                  </div>
                  <div className={pageStyles.list}>
                    {summary.active_phase_children.slice(0, 3).map((child) => (
                      <div key={child.id} className={pageStyles.row}>
                        <span className={pageStyles.rowTitle}>{child.title}</span>
                        <span className={pageStyles.rowMeta}>
                          {child.kind.replace(/_/g, ' ')} · {child.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No active phase yet</strong>
                  <span>Direction is where the long-range plan becomes editable and real.</span>
                </div>
              )}
              <Button variant="outline" onClick={() => navigate('/direction')}>
                Open direction
              </Button>
            </article>
          </div>
        </section>

        <section className={pageStyles.twoColumn}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Attention</h2>
                <p className={pageStyles.sectionDescription}>
                  Time pressure and blockers should stay close to the surface.
                </p>
              </div>
            </div>
            <div className={pageStyles.list}>
              {summary.countdowns.slice(0, 3).map((countdown) => (
                <div key={countdown.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{countdown.title}</span>
                  <span className={pageStyles.rowMeta}>
                    {countdown.category} · {countdown.days_remaining} days remaining
                  </span>
                </div>
              ))}
              {summary.countdowns.length === 0 ? (
                <div className={pageStyles.emptyState}>
                  <strong>No countdowns yet</strong>
                  <span>Add runway trackers in Execution so the week stays time-bound.</span>
                </div>
              ) : null}
            </div>
            <div className={pageStyles.list}>
              {summary.blocking_alerts.length > 0 ? (
                summary.blocking_alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={pageStyles.row}>
                    <span className={pageStyles.rowTitle}>{alert.node_title}</span>
                    <span className={pageStyles.rowMeta}>{alert.reason}</span>
                  </div>
                ))
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No active blockers</strong>
                  <span>Once plans, skills, and projects are wired together, blockers show up here.</span>
                </div>
              )}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Proof and pipeline</h2>
                <p className={pageStyles.sectionDescription}>
                  Capability and opportunity should stay adjacent so finished work turns into motion.
                </p>
              </div>
            </div>
            <div className={pageStyles.metricStrip}>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Verified skills</span>
                <div className={pageStyles.metricValue}>{summary.skill_coverage.verified}</div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Completed projects</span>
                <div className={pageStyles.metricValue}>
                  {summary.ecosystem.by_execution_stage.completed}
                </div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Active applications</span>
                <div className={pageStyles.metricValue}>{summary.pipeline.active_applications}</div>
              </div>
            </div>
            <div className={pageStyles.list}>
              {summary.pipeline.next_actions.length > 0 ? (
                summary.pipeline.next_actions.slice(0, 3).map((application) => (
                  <div key={application.id} className={pageStyles.row}>
                    <span className={pageStyles.rowTitle}>{application.title}</span>
                    <span className={pageStyles.rowMeta}>
                      {application.status.replace(/_/g, ' ')}
                      {application.follow_up_at
                        ? ` · follow up ${formatDate(application.follow_up_at)}`
                        : application.deadline_at
                          ? ` · deadline ${formatDate(application.deadline_at)}`
                          : ''}
                    </span>
                  </div>
                ))
              ) : (
                summary.ecosystem.recently_updated.slice(0, 3).map((project) => (
                  <div key={project.id} className={pageStyles.row}>
                    <span className={pageStyles.rowTitle}>{project.name}</span>
                    <span className={pageStyles.rowMeta}>
                      {project.type} · {project.execution_stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className={pageStyles.inlineActions}>
              <Button onClick={() => navigate('/proof/projects')}>Open proof</Button>
              <Button variant="outline" onClick={() => navigate('/pipeline')}>
                Open pipeline
              </Button>
            </div>
          </article>
        </section>

        {bundle?.dashboard_preferences.show_onboarding && summary.onboarding.needs_setup ? (
          <section className={pageStyles.callout}>
            <strong>Still missing a few foundation pieces</strong>
            <div className={pageStyles.list}>
              {summary.onboarding.missing.slice(0, 4).map((item) => (
                <div key={item} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{item}</span>
                  <span className={pageStyles.rowMeta}>
                    Add this once and the rest of the system becomes more useful automatically.
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
