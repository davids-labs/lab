import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import pageStyles from './CommandCenterPages.module.css'

export function ProofWorkspace(): JSX.Element {
  const navigate = useNavigate()
  const { loadSummary, summary } = useDashboardStore()

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Proof</span>
          <h1 className={pageStyles.title}>Capability Engine</h1>
          <p className={pageStyles.description}>
            Projects, skill evidence, and public case studies all live here. This workspace is where
            work becomes undeniable proof.
          </p>
        </section>

        <section className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Proof Surfaces</h2>
              <p className={pageStyles.description}>
                Open the portfolio architecture or the evidence matrix depending on whether
                you&apos;re shaping projects or turning them into verified skill signal.
              </p>
            </div>
            <div className={pageStyles.inlineRow}>
              <Button onClick={() => navigate('/proof/projects')}>Project Ecosystem</Button>
              <Button variant="outline" onClick={() => navigate('/proof/skills')}>
                Skill Matrix
              </Button>
            </div>
          </div>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Project Readiness</h2>
              <span className={pageStyles.pill}>
                {summary?.ecosystem.total_projects ?? 0} tracked
              </span>
            </div>
            <div className={pageStyles.metricGrid}>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>HERO</span>
                <div className={pageStyles.metricValue}>{summary?.ecosystem.by_type.hero ?? 0}</div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>BUILD</span>
                <div className={pageStyles.metricValue}>
                  {summary?.ecosystem.by_type.build ?? 0}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Validation</span>
                <div className={pageStyles.metricValue}>
                  {summary?.ecosystem.by_execution_stage.validation ?? 0}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Completed</span>
                <div className={pageStyles.metricValue}>
                  {summary?.ecosystem.by_execution_stage.completed ?? 0}
                </div>
              </div>
            </div>
            <div className={pageStyles.list}>
              {(summary?.ecosystem.recently_updated ?? []).map((project) => (
                <div key={project.id} className={pageStyles.listRow}>
                  <strong>{project.name}</strong>
                  <span className={pageStyles.muted}>
                    {project.type} · {project.execution_stage.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Proof Gaps</h2>
              <span className={pageStyles.pill}>
                {summary?.skill_coverage.unverified ?? 0} unverified skills
              </span>
            </div>
            <div className={pageStyles.metricGrid}>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Verified</span>
                <div className={pageStyles.metricValue}>
                  {summary?.skill_coverage.verified ?? 0}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>In Progress</span>
                <div className={pageStyles.metricValue}>
                  {summary?.skill_coverage.in_progress ?? 0}
                </div>
              </div>
              <div className={pageStyles.metricCard}>
                <span className={pageStyles.muted}>Unverified</span>
                <div className={pageStyles.metricValue}>
                  {summary?.skill_coverage.unverified ?? 0}
                </div>
              </div>
            </div>
            <div className={pageStyles.list}>
              {(summary?.skill_coverage.domains ?? []).map((domain) => (
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
      </div>
    </div>
  )
}
