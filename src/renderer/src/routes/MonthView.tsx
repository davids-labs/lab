import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { useUiStore } from '@renderer/stores/uiStore'
import { useWorkflowStore } from '@renderer/stores/workflowStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './WorkflowViews.module.css'

export function MonthView(): JSX.Element {
  const navigate = useNavigate()
  const snapshot = useWorkflowStore((state) => state.snapshots.month)
  const loadSnapshot = useWorkflowStore((state) => state.loadSnapshot)
  const reducedChrome = useUiStore((state) => state.reducedChrome)

  useEffect(() => {
    void loadSnapshot('month')
  }, [loadSnapshot])

  if (!snapshot) {
    return (
      <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
        <div className={pageStyles.stack}>
          <section className={pageStyles.lead}>
            <span className={pageStyles.eyebrow}>Month</span>
            <h1 className={pageStyles.title}>Loading the monthly synthesis</h1>
            <p className={pageStyles.description}>
              Pulling together proof, presence, pipeline, and source maintenance.
            </p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Month</span>
          <h1 className={pageStyles.title}>Synthesis and stale-signal cleanup</h1>
          <p className={pageStyles.description}>
            This horizon is for updating the outward-facing surfaces that should move when proof
            moves: CVs, narrative fragments, applications, and unresolved library inflows.
          </p>
        </section>

        <section className={pageStyles.twoColumn}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Monthly prompts</h2>
                <p className={pageStyles.sectionDescription}>
                  The cross-domain prompts that keep recent work from dying as private context.
                </p>
              </div>
            </div>
            <div className={styles.denseList}>
              {snapshot.monthly_prompts.map((prompt) => (
                <div key={prompt} className={styles.moveRow}>
                  <div className={styles.moveReason}>{prompt}</div>
                </div>
              ))}
              {snapshot.monthly_prompts.length === 0 ? (
                <div className={pageStyles.emptyState}>
                  <strong>No monthly cleanup pressure</strong>
                  <span>The recent proof and presence layers are relatively in sync.</span>
                </div>
              ) : null}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Monthly pressure</h2>
                <p className={pageStyles.sectionDescription}>
                  The app should make looming pipeline and source-maintenance work visible at month scale.
                </p>
              </div>
            </div>
            <div className={pageStyles.metricStrip}>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Pending suggestions</span>
                <div className={pageStyles.metricValue}>{snapshot.dashboard.library.pending_suggestions}</div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Active applications</span>
                <div className={pageStyles.metricValue}>{snapshot.dashboard.pipeline.active_applications}</div>
              </div>
              <div className={pageStyles.metric}>
                <span className={pageStyles.muted}>Ready assets</span>
                <div className={pageStyles.metricValue}>{snapshot.dashboard.presence.ready_assets}</div>
              </div>
            </div>
            <div className={pageStyles.inlineActions}>
              <Button variant="outline" onClick={() => navigate('/presence')}>
                Open presence studio
              </Button>
              <Button variant="outline" onClick={() => navigate('/pipeline')}>
                Open pipeline studio
              </Button>
              <Button variant="outline" onClick={() => navigate('/library')}>
                Open library studio
              </Button>
            </div>
          </article>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Projects needing outward promotion</h2>
              <p className={pageStyles.sectionDescription}>
                Recent projects that still need CV structure, narrative fragments, or application
                links to feel alive in the rest of the system.
              </p>
            </div>
          </div>
          <div className={styles.sourceGrid}>
            {snapshot.monthly_project_refreshes.map((connection) => (
              <div key={connection.project.id} className={styles.sectionCard}>
                <div className={styles.moveTitle}>{connection.project.name}</div>
                <div className={styles.moveReason}>
                  {connection.cv_sections.length} CV sections · {connection.narrative_fragments.length} narrative fragments ·{' '}
                  {connection.applications.length} applications
                </div>
                <div className={pageStyles.inlineActions}>
                  <Button size="sm" onClick={() => navigate(`/project/${connection.project.id}`)}>
                    Open project
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate('/presence')}>
                    Promote to presence
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
