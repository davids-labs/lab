import { useEffect, useMemo, useState } from 'react'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import { usePlanStore } from '@renderer/stores/planStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import { useWorkflowStore } from '@renderer/stores/workflowStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './WorkflowViews.module.css'

export function YearArcView(): JSX.Element {
  const snapshot = useWorkflowStore((state) => state.snapshots.year_arc)
  const loadSnapshot = useWorkflowStore((state) => state.loadSnapshot)
  const { createNode, loadNodes, nodes } = usePlanStore()
  const roleRequirements = usePipelineStore((state) => state.roleRequirements)
  const loadPipeline = usePipelineStore((state) => state.loadAll)
  const pushToast = useToastStore((state) => state.push)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null)
  const [arcTitle, setArcTitle] = useState('')
  const [arcYear, setArcYear] = useState(String(new Date().getUTCFullYear()))
  const [phaseTitle, setPhaseTitle] = useState('')

  useEffect(() => {
    void loadSnapshot('year_arc')
    void loadNodes()
    void loadPipeline()
  }, [loadNodes, loadPipeline, loadSnapshot])

  const arcs = useMemo(() => nodes.filter((node) => node.kind === 'arc'), [nodes])
  const selectedArc = arcs.find((arc) => arc.id === selectedArcId) ?? arcs[0] ?? null
  const phasesByArc = useMemo(
    () =>
      new Map(
        arcs.map((arc) => [
          arc.id,
          nodes.filter((node) => node.kind === 'phase' && node.parent_id === arc.id)
        ])
      ),
    [arcs, nodes]
  )

  useEffect(() => {
    if (!selectedArcId && arcs[0]) {
      setSelectedArcId(arcs[0].id)
    }
  }, [arcs, selectedArcId])

  async function refreshYearArc(): Promise<void> {
    await Promise.all([loadSnapshot('year_arc'), loadNodes(), loadPipeline()])
  }

  async function handleCreateArc(): Promise<void> {
    if (!arcTitle.trim()) {
      return
    }

    await createNode({
      title: arcTitle.trim(),
      kind: 'arc',
      status: 'in_progress',
      horizon_year: Number(arcYear) || null
    })
    setArcTitle('')
    await refreshYearArc()
    pushToast({ message: 'Added arc.', type: 'success' })
  }

  async function handleCreatePhase(): Promise<void> {
    if (!selectedArc || !phaseTitle.trim()) {
      return
    }

    await createNode({
      title: phaseTitle.trim(),
      kind: 'phase',
      parent_id: selectedArc.id,
      status: 'not_started',
      horizon_year: selectedArc.horizon_year
    })
    setPhaseTitle('')
    await refreshYearArc()
    pushToast({ message: 'Added phase to arc.', type: 'success' })
  }

  if (!snapshot) {
    return (
      <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
        <div className={pageStyles.stack}>
          <section className={pageStyles.lead}>
            <span className={pageStyles.eyebrow}>Year + Arc</span>
            <h1 className={pageStyles.title}>Loading the long-range structure</h1>
            <p className={pageStyles.description}>
              Pulling together arcs, phases, and role dependency pressure.
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
          <span className={pageStyles.eyebrow}>Year + Arc</span>
          <h1 className={pageStyles.title}>Permanent structure above the phase layer</h1>
          <p className={pageStyles.description}>
            Arc nodes give the multi-year story a durable home, while target-role requirements show
            which capability dependencies still need to be turned into proof.
          </p>
        </section>

        <section className={styles.yearGrid}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Arc structure</h2>
                <p className={pageStyles.sectionDescription}>
                  Arcs sit above phases and hold the long-range story the rest of the graph should support.
                </p>
              </div>
            </div>
            <div className={styles.inlineSelects}>
              <InputField
                placeholder="New arc title"
                value={arcTitle}
                onChange={(event) => setArcTitle(event.target.value)}
              />
              <InputField
                placeholder="Horizon year"
                value={arcYear}
                onChange={(event) => setArcYear(event.target.value)}
              />
              <Button onClick={() => void handleCreateArc()}>Add arc</Button>
            </div>
            <div className={styles.tree}>
              {arcs.map((arc) => (
                <div key={arc.id} className={styles.arcCard}>
                  <div className={styles.rowHeader}>
                    <div>
                      <div className={styles.moveTitle}>{arc.title}</div>
                      <div className={styles.moveReason}>
                        {arc.horizon_year ? `Horizon ${arc.horizon_year}` : 'No horizon year'} ·{' '}
                        {arc.status.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedArcId(arc.id)}>
                      Select
                    </Button>
                  </div>
                  <div className={styles.treeChildren}>
                    {(phasesByArc.get(arc.id) ?? []).map((phase) => (
                      <div key={phase.id} className={styles.moveRow}>
                        <div className={styles.moveTitle}>{phase.title}</div>
                        <div className={styles.moveReason}>
                          {phase.status.replace(/_/g, ' ')}
                          {phase.horizon_year ? ` · ${phase.horizon_year}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Selected arc actions</h2>
                <p className={pageStyles.sectionDescription}>
                  Add new phases under the current arc and keep role dependencies visible at the same time.
                </p>
              </div>
            </div>
            <div className={styles.inlineSelects}>
              <InputField
                placeholder="New phase title"
                value={phaseTitle}
                onChange={(event) => setPhaseTitle(event.target.value)}
              />
              <Button onClick={() => void handleCreatePhase()}>Add phase</Button>
            </div>
            <div className={pageStyles.callout}>
              <strong>{selectedArc?.title ?? 'No arc selected'}</strong>
              <p className={pageStyles.description}>
                {selectedArc?.summary ?? 'Select an arc to keep the current long-range structure in focus.'}
              </p>
            </div>
            <div className={styles.denseList}>
              {snapshot.target_roles.map((role) => (
                <div key={role.id} className={styles.moveRow}>
                  <div className={styles.moveTitle}>{role.title}</div>
                  <div className={styles.moveReason}>
                    {roleRequirements.filter((requirement) => requirement.role_id === role.id).length} tracked requirements
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
