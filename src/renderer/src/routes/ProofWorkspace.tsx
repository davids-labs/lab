import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useExportStore } from '@renderer/stores/exportStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'

export function ProofWorkspace(): JSX.Element {
  const navigate = useNavigate()
  const { loadSummary, summary } = useDashboardStore()
  const { generatePack } = useExportStore()
  const pushToast = useToastStore((state) => state.push)

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Proof</span>
          <h1 className={pageStyles.title}>Projects and skill evidence</h1>
          <p className={pageStyles.description}>
            Proof is where private work becomes undeniable signal: projects move toward portfolio
            readiness and skill nodes move from attached evidence to verified capability.
          </p>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Proof surfaces</h2>
              <p className={pageStyles.sectionDescription}>
                Use projects when shaping the actual work. Use skills when turning completed work
                into verified readiness.
              </p>
            </div>
            <div className={pageStyles.inlineActions}>
              <Button onClick={() => navigate('/proof/projects')}>Projects</Button>
              <Button variant="outline" onClick={() => navigate('/proof/skills')}>
                Skills
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  void generatePack({ target: 'narrative_signal', format: 'markdown' }).then(() =>
                    pushToast({ message: 'Generated narrative signal pack.', type: 'success' })
                  )
                }
              >
                Narrative pack
              </Button>
            </div>
          </div>
        </section>

        <section className={pageStyles.twoColumn}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Project readiness</h2>
                <p className={pageStyles.sectionDescription}>
                  A quick read on how much finished, portfolio-grade work exists right now.
                </p>
              </div>
              <span className={pageStyles.chip}>{summary?.ecosystem.total_projects ?? 0} tracked</span>
            </div>
            <div className={pageStyles.metricStrip}>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>HERO</span>
                <div className={pageStyles.metricValue}>{summary?.ecosystem.by_type.hero ?? 0}</div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>BUILD</span>
                <div className={pageStyles.metricValue}>
                  {summary?.ecosystem.by_type.build ?? 0}
                </div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Validation</span>
                <div className={pageStyles.metricValue}>
                  {summary?.ecosystem.by_execution_stage.validation ?? 0}
                </div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Completed</span>
                <div className={pageStyles.metricValue}>
                  {summary?.ecosystem.by_execution_stage.completed ?? 0}
                </div>
              </div>
            </div>
            <div className={pageStyles.list}>
              {(summary?.ecosystem.recently_updated ?? []).map((project) => (
                <div key={project.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{project.name}</span>
                  <span className={pageStyles.rowMeta}>
                    {project.type} · {project.execution_stage.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Evidence gaps</h2>
                <p className={pageStyles.sectionDescription}>
                  Readiness should stay grounded in domain coverage, not self-scoring.
                </p>
              </div>
              <span className={pageStyles.chip}>
                {summary?.skill_coverage.unverified ?? 0} unverified
              </span>
            </div>
            <div className={pageStyles.metricStrip}>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Verified</span>
                <div className={pageStyles.metricValue}>
                  {summary?.skill_coverage.verified ?? 0}
                </div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>In progress</span>
                <div className={pageStyles.metricValue}>
                  {summary?.skill_coverage.in_progress ?? 0}
                </div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Unverified</span>
                <div className={pageStyles.metricValue}>
                  {summary?.skill_coverage.unverified ?? 0}
                </div>
              </div>
            </div>
            <div className={pageStyles.list}>
              {(summary?.insights.proof_gaps ?? []).slice(0, 4).map((gap) => (
                <div key={gap.id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{gap.title}</span>
                  <span className={pageStyles.rowMeta}>{gap.body}</span>
                </div>
              ))}
              {(summary?.skill_coverage.domains ?? []).map((domain) => (
                <div key={domain.domain_id} className={pageStyles.row}>
                  <span className={pageStyles.rowTitle}>{domain.title}</span>
                  <span className={pageStyles.rowMeta}>
                    {domain.verified}/{domain.total} verified
                  </span>
                </div>
              ))}
            </div>
            {summary?.ecosystem.recently_updated[0] ? (
              <div className={pageStyles.inlineActions}>
                <Button
                  variant="outline"
                  onClick={() =>
                    void generatePack({
                      target: 'project_proof',
                      project_id: summary.ecosystem.recently_updated[0].id,
                      format: 'markdown'
                    }).then(() =>
                      pushToast({ message: 'Generated project proof packet.', type: 'success' })
                    )
                  }
                >
                  Proof pack for latest project
                </Button>
              </div>
            ) : null}
          </article>
        </section>
      </div>
    </div>
  )
}
