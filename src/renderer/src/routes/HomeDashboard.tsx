import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'

export function HomeDashboard(): JSX.Element {
  const navigate = useNavigate()
  const { error, importStarterTemplate, isLoading, loadSummary, summary } = useDashboardStore()
  const pushToast = useToastStore((state) => state.push)

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const showStarterPrompt =
    summary &&
    summary.counts.plan_nodes === 0 &&
    summary.counts.skills === 0 &&
    summary.counts.countdowns === 0 &&
    summary.os.profiles.length === 0

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
          <div className={pageStyles.hero}>
            <span className={pageStyles.eyebrow}>Home</span>
            <h1 className={pageStyles.title}>davids.lab</h1>
            <p className={pageStyles.description}>
              {isLoading ? 'Loading command center…' : (error ?? 'Preparing your command center…')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Home</span>
          <h1 className={pageStyles.title}>Command Center</h1>
          <p className={pageStyles.description}>
            A local-first operating surface for trajectory, evidence, execution, and portfolio
            output.
          </p>
        </section>

        {showStarterPrompt ? (
          <section className={`${pageStyles.card} ${pageStyles.cardTight}`}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.cardTitle}>Load Starter Template</h2>
                <p className={pageStyles.description}>
                  Bring in the TCD → Columbia → Apple starter structure as editable local data.
                </p>
              </div>
              <Button disabled={isLoading} onClick={() => void handleImportStarterTemplate()}>
                {isLoading ? 'Loading…' : "Load David's starter template"}
              </Button>
            </div>
          </section>
        ) : null}

        <section className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Where To Edit Things</h2>
              <p className={pageStyles.description}>
                Timeline and dependencies live in Master Plan. Schedules, habits, and countdowns
                live in Personal OS. Skills and evidence live in Skill Matrix. Projects and public
                pages live in Project Ecosystem.
              </p>
            </div>
            <div className={pageStyles.inlineRow}>
              <Button variant="outline" onClick={() => navigate('/plan')}>
                Master Plan
              </Button>
              <Button variant="outline" onClick={() => navigate('/os')}>
                Personal OS
              </Button>
              <Button variant="outline" onClick={() => navigate('/skills')}>
                Skill Matrix
              </Button>
              <Button variant="outline" onClick={() => navigate('/ecosystem')}>
                Ecosystem
              </Button>
            </div>
          </div>
        </section>

        <section className={pageStyles.grid3}>
          {summary.countdowns.map((countdown) => (
            <article key={countdown.id} className={pageStyles.card}>
              <div className={pageStyles.eyebrow}>{countdown.category}</div>
              <h2 className={pageStyles.cardTitle}>{countdown.title}</h2>
              <div className={pageStyles.metricValue}>{countdown.days_remaining}</div>
              <div className={pageStyles.muted}>days remaining</div>
            </article>
          ))}
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Active Phase</h2>
              <span className={pageStyles.pill}>
                {summary.active_phase?.status.replace(/_/g, ' ') ?? 'none'}
              </span>
            </div>
            {summary.active_phase ? (
              <>
                <div>
                  <strong>{summary.active_phase.title}</strong>
                  <p className={pageStyles.description}>
                    {summary.active_phase.summary ?? 'No summary yet.'}
                  </p>
                </div>
                <div className={pageStyles.list}>
                  {summary.active_phase_children.map((child) => (
                    <div key={child.id} className={pageStyles.listRow}>
                      <strong>{child.title}</strong>
                      <span className={pageStyles.muted}>{child.status.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className={pageStyles.description}>
                No roadmap phases yet. Add one in Master Plan or load the starter template.
              </p>
            )}
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Blocking Alerts</h2>
              <span className={pageStyles.pill}>{summary.blocking_alerts.length} active</span>
            </div>
            <div className={pageStyles.list}>
              {summary.blocking_alerts.length > 0 ? (
                summary.blocking_alerts.map((alert) => (
                  <div key={alert.id} className={pageStyles.listRow}>
                    <strong>{alert.node_title}</strong>
                    <span className={pageStyles.muted}>{alert.reason}</span>
                  </div>
                ))
              ) : (
                <div className={pageStyles.listRow}>
                  <strong>No blockers right now</strong>
                  <span className={pageStyles.muted}>
                    As you wire dependencies, skills, and projects together, alerts will appear
                    here.
                  </span>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Personal OS Today</h2>
              <span className={pageStyles.pill}>{summary.os.week.days_logged} logs this week</span>
            </div>
            <div className={pageStyles.metricGrid}>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Sleep</span>
                <div className={pageStyles.metricValue}>
                  {summary.os.today?.sleep_hours?.toFixed(1) ?? '0.0'}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Deep Work</span>
                <div className={pageStyles.metricValue}>
                  {summary.os.today?.deep_work_minutes ?? 0}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Protein</span>
                <div className={pageStyles.metricValue}>{summary.os.today?.protein_grams ?? 0}</div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Gym</span>
                <div className={pageStyles.metricValue}>
                  {summary.os.today?.gym_done ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
            <div className={pageStyles.pillRow}>
              {summary.os.habits.map((habit) => (
                <span key={habit.id} className={pageStyles.pill}>
                  {habit.today_completed ? 'Done' : 'Open'} · {habit.name}
                </span>
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Skill Readiness</h2>
              <span className={pageStyles.pill}>{summary.skill_coverage.total} tracked</span>
            </div>
            <div className={pageStyles.metricGrid}>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Verified</span>
                <div className={pageStyles.metricValue}>{summary.skill_coverage.verified}</div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>In Progress</span>
                <div className={pageStyles.metricValue}>{summary.skill_coverage.in_progress}</div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Unverified</span>
                <div className={pageStyles.metricValue}>{summary.skill_coverage.unverified}</div>
              </div>
            </div>
            <div className={pageStyles.list}>
              {summary.skill_coverage.domains.map((domain) => (
                <div key={domain.domain_id} className={pageStyles.listRow}>
                  <strong>{domain.title}</strong>
                  <span className={pageStyles.muted}>
                    {domain.verified}/{domain.total} verified
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.cardTitle}>Project Ecosystem</h2>
            <span className={pageStyles.pill}>
              {summary.ecosystem.total_projects} total projects
            </span>
          </div>
          <div className={pageStyles.metricGrid}>
            <div className={pageStyles.metricCard}>
              <span className={pageStyles.muted}>HERO</span>
              <div className={pageStyles.metricValue}>{summary.ecosystem.by_type.hero}</div>
            </div>
            <div className={pageStyles.metricCard}>
              <span className={pageStyles.muted}>BUILD</span>
              <div className={pageStyles.metricValue}>{summary.ecosystem.by_type.build}</div>
            </div>
            <div className={pageStyles.metricCard}>
              <span className={pageStyles.muted}>DESIGN</span>
              <div className={pageStyles.metricValue}>{summary.ecosystem.by_type.design}</div>
            </div>
            <div className={pageStyles.metricCard}>
              <span className={pageStyles.muted}>COMPLETED</span>
              <div className={pageStyles.metricValue}>
                {summary.ecosystem.by_execution_stage.completed}
              </div>
            </div>
          </div>
          <div className={pageStyles.list}>
            {summary.ecosystem.recently_updated.map((project) => (
              <div key={project.id} className={pageStyles.listRow}>
                <strong>{project.name}</strong>
                <span className={pageStyles.muted}>
                  {project.type} · {project.execution_stage.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
