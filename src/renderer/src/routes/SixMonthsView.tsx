import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Block, CvVariantSectionSourceType } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import { usePresenceStore } from '@renderer/stores/presenceStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSkillsStore } from '@renderer/stores/skillsStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import { useWorkflowStore } from '@renderer/stores/workflowStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './WorkflowViews.module.css'

export function SixMonthsView(): JSX.Element {
  const navigate = useNavigate()
  const snapshot = useWorkflowStore((state) => state.snapshots.six_months)
  const skillsPipeline = useWorkflowStore((state) => state.skillsPipeline)
  const loadSnapshot = useWorkflowStore((state) => state.loadSnapshot)
  const loadSkillsPipeline = useWorkflowStore((state) => state.loadSkillsPipeline)
  const {
    applications,
    createRoleRequirement,
    deleteRoleRequirement,
    loadAll: loadPipeline,
    roles,
    updateApplication,
    updateRoleRequirement
  } = usePipelineStore()
  const {
    createCvSection,
    createCvSectionSource,
    createCvVariant,
    cvSections,
    cvSectionSources,
    cvVariants,
    deleteCvSection,
    deleteCvSectionSource,
    loadAll: loadPresence,
    syncCvVariantContent,
    updateCvSection
  } = usePresenceStore()
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const skills = useSkillsStore((state) => state.nodes)
  const loadSkills = useSkillsStore((state) => state.loadNodes)
  const pushToast = useToastStore((state) => state.push)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [roleRequirementDraft, setRoleRequirementDraft] = useState({
    skill_id: '',
    minimum_state: 'verified',
    priority: 'high'
  })
  const [variantTitle, setVariantTitle] = useState('')
  const [sectionDraft, setSectionDraft] = useState({ title: '', summary: '' })
  const [sourceDraft, setSourceDraft] = useState<{
    source_type: CvVariantSectionSourceType
    source_id: string
    notes: string
  }>({
    source_type: 'skill_node',
    source_id: '',
    notes: ''
  })
  const [blocksByProjectId, setBlocksByProjectId] = useState<Record<string, Block[]>>({})

  useEffect(() => {
    void loadSnapshot('six_months')
    void loadPipeline()
    void loadPresence()
    void loadProjects()
    void loadSkills(null)
  }, [loadPipeline, loadPresence, loadProjects, loadSkills, loadSnapshot])

  useEffect(() => {
    if (!selectedRoleId && (snapshot?.target_roles[0]?.id ?? roles[0]?.id)) {
      setSelectedRoleId(snapshot?.target_roles[0]?.id ?? roles[0]?.id ?? null)
    }
  }, [roles, selectedRoleId, snapshot?.target_roles])

  useEffect(() => {
    if (!selectedRoleId) {
      return
    }

    void loadSkillsPipeline(selectedRoleId)
  }, [loadSkillsPipeline, selectedRoleId])

  const roleEntries = useMemo(
    () => skillsPipeline.filter((entry) => entry.role.id === selectedRoleId),
    [selectedRoleId, skillsPipeline]
  )
  const role = useMemo(
    () => roles.find((item) => item.id === selectedRoleId) ?? snapshot?.target_roles.find((item) => item.id === selectedRoleId) ?? null,
    [roles, selectedRoleId, snapshot?.target_roles]
  )
  const variantsForRole = useMemo(
    () => cvVariants.filter((variant) => variant.target_role_id === selectedRoleId),
    [cvVariants, selectedRoleId]
  )
  const selectedVariant =
    variantsForRole.find((variant) => variant.id === selectedVariantId) ?? variantsForRole[0] ?? null
  const sectionsForVariant = useMemo(
    () =>
      selectedVariant
        ? cvSections.filter((section) => section.cv_variant_id === selectedVariant.id)
        : [],
    [cvSections, selectedVariant]
  )
  const selectedSection =
    sectionsForVariant.find((section) => section.id === selectedSectionId) ?? sectionsForVariant[0] ?? null
  const sourcesForSelectedSection = useMemo(
    () =>
      selectedSection
        ? cvSectionSources.filter((source) => source.section_id === selectedSection.id)
        : [],
    [cvSectionSources, selectedSection]
  )
  const applicationsForRole = useMemo(
    () => applications.filter((application) => application.target_role_id === selectedRoleId),
    [applications, selectedRoleId]
  )
  const roleProjects = useMemo(
    () =>
      roleEntries.flatMap((entry) => entry.matching_projects).filter(
        (project, index, list) => list.findIndex((item) => item.id === project.id) === index
      ),
    [roleEntries]
  )
  const roleProjectIds = useMemo(() => new Set(roleProjects.map((project) => project.id)), [roleProjects])

  useEffect(() => {
    if (!selectedVariantId || !variantsForRole.some((variant) => variant.id === selectedVariantId)) {
      setSelectedVariantId(variantsForRole[0]?.id ?? null)
    }
  }, [selectedVariantId, variantsForRole])

  useEffect(() => {
    if (!selectedSectionId || !sectionsForVariant.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(sectionsForVariant[0]?.id ?? null)
    }
  }, [sectionsForVariant, selectedSectionId])

  useEffect(() => {
    const targetProjectIds = Array.from(roleProjectIds).filter((projectId) => !(projectId in blocksByProjectId))
    if (targetProjectIds.length === 0) {
      return
    }

    let cancelled = false

    async function loadBlocks(): Promise<void> {
      const entries = await Promise.all(
        targetProjectIds.map(async (projectId) => [projectId, await window.lab.block.list(projectId)] as const)
      )

      if (!cancelled) {
        setBlocksByProjectId((current) => ({
          ...current,
          ...Object.fromEntries(entries)
        }))
      }
    }

    void loadBlocks()

    return () => {
      cancelled = true
    }
  }, [blocksByProjectId, roleProjectIds])

  const sourceOptions = useMemo(() => {
    if (sourceDraft.source_type === 'skill_node') {
      return roleEntries
        .filter((entry) => entry.skill)
        .map((entry) => ({ id: entry.skill!.id, label: entry.skill!.title }))
    }

    if (sourceDraft.source_type === 'project') {
      return roleProjects.map((project) => ({ id: project.id, label: project.name }))
    }

    return roleProjects.flatMap((project) =>
      (blocksByProjectId[project.id] ?? []).map((block) => ({
        id: block.id,
        label: `${project.name} · ${block.type.replace(/_/g, ' ')}`
      }))
    )
  }, [blocksByProjectId, roleEntries, roleProjects, sourceDraft.source_type])

  async function refreshBoard(): Promise<void> {
    await Promise.all([
      loadSnapshot('six_months'),
      loadPipeline(),
      loadPresence(),
      loadProjects(),
      loadSkills(null),
      loadSkillsPipeline(selectedRoleId)
    ])
  }

  async function handleCreateRequirement(): Promise<void> {
    if (!selectedRoleId || !roleRequirementDraft.skill_id) {
      return
    }

    await createRoleRequirement({
      role_id: selectedRoleId,
      skill_id: roleRequirementDraft.skill_id,
      minimum_state: roleRequirementDraft.minimum_state as 'unverified' | 'in_progress' | 'verified',
      priority: roleRequirementDraft.priority as 'critical' | 'high' | 'medium' | 'low'
    })
    setRoleRequirementDraft({ skill_id: '', minimum_state: 'verified', priority: 'high' })
    await refreshBoard()
    pushToast({ message: 'Added role requirement.', type: 'success' })
  }

  async function handleCreateVariant(): Promise<void> {
    if (!selectedRoleId || !variantTitle.trim() || !role) {
      return
    }

    await createCvVariant({
      title: variantTitle.trim(),
      target_role: role.title,
      target_role_id: selectedRoleId,
      content: ''
    })
    setVariantTitle('')
    await refreshBoard()
    pushToast({ message: 'Created role-linked CV variant.', type: 'success' })
  }

  async function handleCreateSection(): Promise<void> {
    if (!selectedVariant || !sectionDraft.title.trim()) {
      return
    }

    await createCvSection({
      cv_variant_id: selectedVariant.id,
      title: sectionDraft.title.trim(),
      summary: sectionDraft.summary.trim() || null
    })
    setSectionDraft({ title: '', summary: '' })
    await refreshBoard()
    pushToast({ message: 'Added CV section.', type: 'success' })
  }

  async function handleCreateSource(): Promise<void> {
    if (!selectedSection || !sourceDraft.source_id) {
      return
    }

    await createCvSectionSource({
      section_id: selectedSection.id,
      source_type: sourceDraft.source_type,
      source_id: sourceDraft.source_id,
      notes: sourceDraft.notes.trim() || null
    })
    setSourceDraft({ source_type: 'skill_node', source_id: '', notes: '' })
    await refreshBoard()
    pushToast({ message: 'Added CV section source.', type: 'success' })
  }

  if (!snapshot) {
    return (
      <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
        <div className={pageStyles.stack}>
          <section className={pageStyles.lead}>
            <span className={pageStyles.eyebrow}>Six Months</span>
            <h1 className={pageStyles.title}>Loading the skills pipeline board</h1>
            <p className={pageStyles.description}>
              Pulling together target roles, skills, projects, CV structure, and applications.
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
          <span className={pageStyles.eyebrow}>Six Months</span>
          <h1 className={pageStyles.title}>Skill → proof → CV → application</h1>
          <p className={pageStyles.description}>
            This is the explicit chain the app was missing: target role requirements, the project
            work that evidences them, the CV structure that packages them, and the applications that
            consume that package.
          </p>
        </section>

        <section className={styles.boardColumns}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Target roles</h2>
                <p className={pageStyles.sectionDescription}>
                  Choose the role horizon you want the chain to optimize for.
                </p>
              </div>
            </div>
            <div className={pageStyles.list}>
              {snapshot.target_roles.map((entry) => (
                <button
                  key={entry.id}
                  className={`${pageStyles.rowButton} ${selectedRoleId === entry.id ? pageStyles.rowActive : ''}`}
                  onClick={() => setSelectedRoleId(entry.id)}
                  type="button"
                >
                  <span className={pageStyles.rowTitle}>{entry.title}</span>
                  <span className={pageStyles.rowMeta}>{entry.season ?? 'No season'} · {entry.location ?? 'No location'}</span>
                </button>
              ))}
            </div>
            <div className={styles.panelNote}>
              Manage the role list in Pipeline studio. This board focuses on the cross-domain chain
              once the role exists.
            </div>
          </article>

          <div className={styles.stackedSections}>
            <article className={pageStyles.section}>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <h2 className={pageStyles.sectionTitle}>Role requirements</h2>
                  <p className={pageStyles.sectionDescription}>
                    Define the explicit skill requirements that need evidence before the role is ready.
                  </p>
                </div>
                <span className={pageStyles.chip}>{roleEntries.length} tracked</span>
              </div>
              <div className={styles.inlineSelects}>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Skill</span>
                  <select
                    value={roleRequirementDraft.skill_id}
                    onChange={(event) =>
                      setRoleRequirementDraft((current) => ({ ...current, skill_id: event.target.value }))
                    }
                  >
                    <option value="">Select a skill</option>
                    {skills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Minimum state</span>
                  <select
                    value={roleRequirementDraft.minimum_state}
                    onChange={(event) =>
                      setRoleRequirementDraft((current) => ({
                        ...current,
                        minimum_state: event.target.value
                      }))
                    }
                  >
                    <option value="unverified">unverified</option>
                    <option value="in_progress">in progress</option>
                    <option value="verified">verified</option>
                  </select>
                </label>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Priority</span>
                  <select
                    value={roleRequirementDraft.priority}
                    onChange={(event) =>
                      setRoleRequirementDraft((current) => ({ ...current, priority: event.target.value }))
                    }
                  >
                    <option value="critical">critical</option>
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
                  </select>
                </label>
                <Button onClick={() => void handleCreateRequirement()}>Add requirement</Button>
              </div>
              <div className={styles.denseList}>
                {roleEntries.map((entry) => (
                  <div key={entry.id} className={styles.pipelineRow}>
                    <div className={styles.rowHeader}>
                      <div>
                        <div className={styles.moveTitle}>{entry.skill?.title ?? 'Missing skill node'}</div>
                        <div className={styles.moveReason}>
                          {entry.matching_projects.length} projects · {entry.cv_sections.length} CV sections ·{' '}
                          {entry.applications.length} applications
                        </div>
                      </div>
                      <span className={styles.statusPill} data-status={entry.status}>
                        {entry.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className={styles.inlineSelects}>
                      <label className={pageStyles.formGrid}>
                        <span className={pageStyles.eyebrow}>Minimum state</span>
                        <select
                          value={entry.requirement.minimum_state}
                          onChange={(event) =>
                            void updateRoleRequirement({
                              id: entry.requirement.id,
                              minimum_state: event.target.value as 'unverified' | 'in_progress' | 'verified'
                            }).then(() => refreshBoard())
                          }
                        >
                          <option value="unverified">unverified</option>
                          <option value="in_progress">in progress</option>
                          <option value="verified">verified</option>
                        </select>
                      </label>
                      <label className={pageStyles.formGrid}>
                        <span className={pageStyles.eyebrow}>Priority</span>
                        <select
                          value={entry.requirement.priority}
                          onChange={(event) =>
                            void updateRoleRequirement({
                              id: entry.requirement.id,
                              priority: event.target.value as 'critical' | 'high' | 'medium' | 'low'
                            }).then(() => refreshBoard())
                          }
                        >
                          <option value="critical">critical</option>
                          <option value="high">high</option>
                          <option value="medium">medium</option>
                          <option value="low">low</option>
                        </select>
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void deleteRoleRequirement(entry.requirement.id).then(() => refreshBoard())}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <h2 className={pageStyles.sectionTitle}>CV structure for this role</h2>
                  <p className={pageStyles.sectionDescription}>
                    Create role-linked CV variants, break them into sections, and cite skills,
                    projects, or proof blocks as explicit sources.
                  </p>
                </div>
              </div>
              <div className={pageStyles.inlineActions}>
                <InputField
                  placeholder="New CV variant title"
                  value={variantTitle}
                  onChange={(event) => setVariantTitle(event.target.value)}
                />
                <Button onClick={() => void handleCreateVariant()}>Create variant</Button>
              </div>
              <div className={pageStyles.chipRow}>
                {variantsForRole.map((variant) => (
                  <button
                    key={variant.id}
                    className={`${pageStyles.chip} ${selectedVariant?.id === variant.id ? pageStyles.chipActive : ''}`}
                    onClick={() => setSelectedVariantId(variant.id)}
                    type="button"
                  >
                    {variant.title}
                  </button>
                ))}
              </div>
              {selectedVariant ? (
                <div className={styles.stackedSections}>
                  <div className={styles.inlineSelects}>
                    <InputField
                      placeholder="Section title"
                      value={sectionDraft.title}
                      onChange={(event) =>
                        setSectionDraft((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                    <InputField
                      placeholder="Short section summary"
                      value={sectionDraft.summary}
                      onChange={(event) =>
                        setSectionDraft((current) => ({ ...current, summary: event.target.value }))
                      }
                    />
                    <Button onClick={() => void handleCreateSection()}>Add section</Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        void syncCvVariantContent(selectedVariant.id).then(() => refreshBoard())
                      }
                    >
                      Regenerate content
                    </Button>
                  </div>
                  <div className={styles.sourceGrid}>
                    {sectionsForVariant.map((section) => (
                      <div key={section.id} className={styles.sectionCard}>
                        <div className={styles.rowHeader}>
                          <div>
                            <div className={styles.moveTitle}>{section.title}</div>
                            <div className={styles.moveReason}>{section.summary ?? 'No section summary yet.'}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void deleteCvSection(section.id).then(() => refreshBoard())}
                          >
                            Remove
                          </Button>
                        </div>
                        <TextareaField
                          rows={3}
                          value={section.summary ?? ''}
                          onChange={(event) =>
                            void updateCvSection({
                              id: section.id,
                              summary: event.target.value
                            }).then(() => refreshBoard())
                          }
                        />
                        <Button size="sm" variant="outline" onClick={() => setSelectedSectionId(section.id)}>
                          Edit sources
                        </Button>
                      </div>
                    ))}
                  </div>
                  {selectedSection ? (
                    <div className={styles.fieldCard}>
                      <h3 className={styles.fieldLabel}>Sources for {selectedSection.title}</h3>
                      <div className={styles.inlineSelects}>
                        <label className={pageStyles.formGrid}>
                          <span className={pageStyles.eyebrow}>Source type</span>
                          <select
                            value={sourceDraft.source_type}
                            onChange={(event) =>
                              setSourceDraft((current) => ({
                                ...current,
                                source_type: event.target.value as CvVariantSectionSourceType,
                                source_id: ''
                              }))
                            }
                          >
                            <option value="skill_node">skill</option>
                            <option value="project">project</option>
                            <option value="block">proof block</option>
                          </select>
                        </label>
                        <label className={pageStyles.formGrid}>
                          <span className={pageStyles.eyebrow}>Source</span>
                          <select
                            value={sourceDraft.source_id}
                            onChange={(event) =>
                              setSourceDraft((current) => ({ ...current, source_id: event.target.value }))
                            }
                          >
                            <option value="">Select source</option>
                            {sourceOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <InputField
                          placeholder="Optional note"
                          value={sourceDraft.notes}
                          onChange={(event) =>
                            setSourceDraft((current) => ({ ...current, notes: event.target.value }))
                          }
                        />
                        <Button onClick={() => void handleCreateSource()}>Add source</Button>
                      </div>
                      <div className={styles.denseList}>
                        {sourcesForSelectedSection.map((source) => (
                          <div key={source.id} className={styles.moveRow}>
                            <div className={styles.rowHeader}>
                              <div>
                                <div className={styles.moveTitle}>
                                  {source.source_type.replace(/_/g, ' ')} · {source.source_id}
                                </div>
                                <div className={styles.moveReason}>{source.notes ?? 'No note'}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => void deleteCvSectionSource(source.id).then(() => refreshBoard())}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No CV variant linked to this role yet</strong>
                  <span>Create one here, or link an existing variant in the Presence studio.</span>
                </div>
              )}
            </article>

            <article className={pageStyles.section}>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <h2 className={pageStyles.sectionTitle}>Application usage</h2>
                  <p className={pageStyles.sectionDescription}>
                    The last step in the chain is explicit: which role-linked CV variant is
                    actually being used by each application.
                  </p>
                </div>
              </div>
              <div className={styles.denseList}>
                {applicationsForRole.map((application) => (
                  <div key={application.id} className={styles.moveRow}>
                    <div className={styles.rowHeader}>
                      <div>
                        <div className={styles.moveTitle}>{application.title}</div>
                        <div className={styles.moveReason}>{application.status.replace(/_/g, ' ')}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate('/pipeline')}>
                        Open pipeline
                      </Button>
                    </div>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>CV variant</span>
                      <select
                        value={application.cv_variant_id ?? ''}
                        onChange={(event) =>
                          void updateApplication({
                            id: application.id,
                            cv_variant_id: event.target.value || null
                          }).then(() => refreshBoard())
                        }
                      >
                        <option value="">No CV linked</option>
                        {variantsForRole.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
                {applicationsForRole.length === 0 ? (
                  <div className={pageStyles.emptyState}>
                    <strong>No applications linked to this role yet</strong>
                    <span>The chain is ready, but nothing is consuming it yet.</span>
                  </div>
                ) : null}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}
