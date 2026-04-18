import { buildHabitProgressById } from '@shared/habitProgress'
import type {
  MorningDirective,
  NextMove,
  ProjectConnectionSummary,
  SkillsPipelineEntry,
  WorkflowSnapshot,
  WorkflowView
} from '../../preload/types'
import { actionQueries } from '../db/queries/actions'
import { libraryQueries } from '../db/queries/library'
import { osQueries } from '../db/queries/os'
import { pipelineQueries } from '../db/queries/pipeline'
import { planQueries } from '../db/queries/plan'
import { presenceQueries } from '../db/queries/presence'
import { projectQueries } from '../db/queries/projects'
import { reviewQueries } from '../db/queries/review'
import { skillQueries } from '../db/queries/skills'
import { getDashboardSummary } from './dashboard'

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function getTodayUtc(): string {
  return toIsoDate(new Date())
}

function getCurrentWeekKey(): string {
  const date = new Date(`${getTodayUtc()}T00:00:00.000Z`)
  const day = date.getUTCDay()
  const delta = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + delta)
  return toIsoDate(date)
}

function getWeekWindow(weekKey: string): { startMs: number; endMs: number; endDate: string } {
  const start = new Date(`${weekKey}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 7)
  const lastDate = new Date(end)
  lastDate.setUTCDate(lastDate.getUTCDate() - 1)

  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
    endDate: toIsoDate(lastDate)
  }
}

function buildNextMoves(): NextMove[] {
  const today = getTodayUtc()
  const summary = getDashboardSummary()
  const habitProgress = buildHabitProgressById(osQueries.listHabits(), osQueries.listHabitLogs(), today)
  const pendingSuggestions = libraryQueries.listSuggestions().filter((item) => item.status === 'pending')
  const moves: NextMove[] = []

  for (const action of summary.actions.overdue.slice(0, 3)) {
    moves.push({
      id: `action:${action.id}`,
      title: action.title,
      reason: action.due_at
        ? `Overdue since ${new Date(action.due_at).toLocaleDateString('en-IE')}.`
        : 'Overdue action needs an owner.',
      target_route: '/execution',
      entity_type: 'action_item',
      entity_id: action.id,
      category: 'action',
      score: 100
    })
  }

  for (const application of summary.pipeline.next_actions.slice(0, 3)) {
    const dueAt = application.follow_up_at ?? application.deadline_at
    if (!dueAt || dueAt > Date.now() + 1000 * 60 * 60 * 24) {
      continue
    }

    moves.push({
      id: `application:${application.id}`,
      title: application.title,
      reason: 'Pipeline follow-up is due now.',
      target_route: '/pipeline',
      entity_type: 'application_record',
      entity_id: application.id,
      category: 'pipeline',
      score: 95
    })
  }

  for (const alert of summary.blocking_alerts.slice(0, 2)) {
    moves.push({
      id: `blocker:${alert.id}`,
      title: alert.node_title,
      reason: alert.reason,
      target_route: '/direction',
      entity_type: 'plan_node',
      entity_id: alert.node_id,
      category: 'plan',
      score: alert.severity === 'critical' ? 92 : 84
    })
  }

  for (const habit of osQueries.listHabits()) {
    if (habitProgress[habit.id]?.currentPeriodCompleted) {
      continue
    }

    moves.push({
      id: `habit:${habit.id}`,
      title: habit.name,
      reason: habit.trigger_context ?? `Still open ${habitProgress[habit.id]?.periodLabel ?? 'today'}.`,
      target_route: '/day',
      entity_type: 'os_habit',
      entity_id: habit.id,
      category: 'habit',
      score: habit.frequency === 'daily' ? 78 : 70
    })
  }

  for (const countdown of summary.countdowns.slice(0, 2)) {
    if (countdown.days_remaining > 14) {
      continue
    }

    moves.push({
      id: `countdown:${countdown.id}`,
      title: countdown.title,
      reason: `${countdown.days_remaining} days remaining.`,
      target_route: '/execution',
      entity_type: 'countdown_item',
      entity_id: countdown.id,
      category: 'countdown',
      score: countdown.days_remaining <= 7 ? 82 : 68
    })
  }

  if (pendingSuggestions.length > 0) {
    moves.push({
      id: 'library:pending',
      title: 'Resolve pending library suggestions',
      reason: `${pendingSuggestions.length} suggestions still need routing into the system.`,
      target_route: '/library',
      entity_type: 'extraction_suggestion',
      entity_id: pendingSuggestions[0]?.id ?? null,
      category: 'library',
      score: 66
    })
  }

  return moves
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
}

function buildMorningDirective(nextMoves: NextMove[]): MorningDirective | null {
  const summary = getDashboardSummary()
  const topMove = nextMoves[0]

  if (!topMove) {
    return null
  }

  const phaseLabel = summary.active_phase?.title
  const priorityLabel = summary.weekly_priorities.find((item) => item.status !== 'done')?.title
  const context = [phaseLabel ? `Phase: ${phaseLabel}` : null, priorityLabel ? `Week: ${priorityLabel}` : null]
    .filter((value): value is string => Boolean(value))
    .join(' · ')

  return {
    headline: `Start with ${topMove.title}.`,
    reason: context ? `${topMove.reason} ${context}` : topMove.reason,
    target_route: topMove.target_route,
    entity_type: topMove.entity_type,
    entity_id: topMove.entity_id
  }
}

export function getSkillsPipeline(targetRoleId?: string | null): SkillsPipelineEntry[] {
  const roles = pipelineQueries
    .listRoles()
    .filter((role) => !targetRoleId || role.id === targetRoleId)
  const requirements = pipelineQueries.listRoleRequirements()
  const requirementByRole = new Map<string, typeof requirements>()

  for (const requirement of requirements) {
    const current = requirementByRole.get(requirement.role_id) ?? []
    current.push(requirement)
    requirementByRole.set(requirement.role_id, current)
  }

  const skills = new Map(skillQueries.listNodes().map((skill) => [skill.id, skill]))
  const evidence = skillQueries.listEvidence()
  const evidenceBySkill = new Map<string, typeof evidence>()

  for (const entry of evidence) {
    const current = evidenceBySkill.get(entry.skill_id) ?? []
    current.push(entry)
    evidenceBySkill.set(entry.skill_id, current)
  }

  const variants = presenceQueries.listCvVariants()
  const sections = presenceQueries.listCvSections()
  const sectionSources = presenceQueries.listCvSectionSources()
  const applications = pipelineQueries.listApplications()
  const projects = new Map(projectQueries.list().map((project) => [project.id, project]))

  return roles.flatMap((role) =>
    (requirementByRole.get(role.id) ?? [])
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((requirement) => {
        const skill = skills.get(requirement.skill_id) ?? null
        const projectIds = new Set(
          (evidenceBySkill.get(requirement.skill_id) ?? [])
            .map((entry) => entry.project_id)
            .filter((value): value is string => Boolean(value))
        )
        const matchingProjects = Array.from(projectIds)
          .map((projectId) => projects.get(projectId) ?? null)
          .filter((project): project is NonNullable<typeof project> => Boolean(project))
        const matchingSections = sections
          .flatMap((section) => {
            const sources = sectionSources.filter(
              (source) =>
                source.section_id === section.id &&
                ((source.source_type === 'skill_node' && source.source_id === requirement.skill_id) ||
                  (source.source_type === 'project' && projectIds.has(source.source_id)))
            )
            const variant = variants.find((item) => item.id === section.cv_variant_id)

            return variant && sources.length > 0 ? [{ section, variant }] : []
          })
        const variantIds = new Set(matchingSections.map((entry) => entry.variant.id))
        const matchingApplications = applications.filter(
          (application) =>
            application.target_role_id === role.id &&
            (application.linked_skill_id === requirement.skill_id ||
              (application.linked_project_id ? projectIds.has(application.linked_project_id) : false) ||
              (application.cv_variant_id ? variantIds.has(application.cv_variant_id) : false))
        )
        const status =
          !skill
            ? 'missing_skill'
            : skill.state === 'unverified' || matchingProjects.length === 0
              ? 'needs_evidence'
              : matchingSections.length === 0
                ? 'needs_cv'
                : matchingApplications.some((application) =>
                      ['applied', 'interviewing', 'offer'].includes(application.status)
                    )
                  ? 'applied'
                  : 'ready_to_apply'

        return {
          id: `${role.id}:${requirement.id}`,
          role,
          requirement,
          skill,
          matching_projects: matchingProjects,
          cv_sections: matchingSections,
          applications: matchingApplications,
          status
        }
      })
  )
}

function buildWeeklyEvidenceQueue(skillsPipeline: SkillsPipelineEntry[]): ProjectConnectionSummary[] {
  const weekKey = getCurrentWeekKey()
  const { startMs, endMs } = getWeekWindow(weekKey)
  const completedProjectIds = new Set(
    actionQueries
      .list()
      .filter(
        (action) =>
          action.status === 'done' &&
          typeof action.completed_at === 'number' &&
          action.completed_at >= startMs &&
          action.completed_at < endMs &&
          Boolean(action.linked_project_id)
      )
      .map((action) => action.linked_project_id as string)
  )
  const candidateProjectIds = new Set(
    projectQueries
      .list()
      .filter((project) => project.updated_at >= startMs && project.updated_at < endMs)
      .map((project) => project.id)
  )

  for (const projectId of completedProjectIds) {
    candidateProjectIds.add(projectId)
  }

  for (const entry of skillsPipeline.filter((item) => item.status === 'needs_evidence' || item.status === 'needs_cv')) {
    for (const project of entry.matching_projects) {
      candidateProjectIds.add(project.id)
    }
  }

  return Array.from(candidateProjectIds)
    .map((projectId) => projectQueries.getConnections(projectId))
    .sort((left, right) => right.project.updated_at - left.project.updated_at)
}

function buildMonthlyPrompts(): { prompts: string[]; refreshes: ProjectConnectionSummary[] } {
  const recentProjects = projectQueries
    .list()
    .filter((project) => project.updated_at >= Date.now() - 1000 * 60 * 60 * 24 * 30)
    .slice(0, 6)
    .map((project) => projectQueries.getConnections(project.id))
  const pendingSuggestions = libraryQueries.listSuggestions().filter((item) => item.status === 'pending')
  const dueApplications = pipelineQueries
    .listApplications()
    .filter((application) => {
      const nextAt = application.follow_up_at ?? application.deadline_at
      return typeof nextAt === 'number' && nextAt <= Date.now() + 1000 * 60 * 60 * 24 * 30
    })

  const prompts = [
    recentProjects.some((project) => project.cv_sections.length === 0)
      ? 'Recent proof has not been promoted into CV structure yet.'
      : null,
    recentProjects.some((project) => project.narrative_fragments.length === 0)
      ? 'At least one recent project still needs a narrative fragment or profile update.'
      : null,
    dueApplications.length > 0
      ? `${dueApplications.length} pipeline items need follow-up or deadline coverage this month.`
      : null,
    pendingSuggestions.length > 0
      ? `${pendingSuggestions.length} pending library suggestions are still stranded in the source layer.`
      : null
  ].filter((value): value is string => Boolean(value))

  return {
    prompts,
    refreshes: recentProjects.filter(
      (project) =>
        project.cv_sections.length === 0 ||
        project.narrative_fragments.length === 0 ||
        project.applications.length === 0
    )
  }
}

export function getProjectConnections(projectId: string): ProjectConnectionSummary {
  return projectQueries.getConnections(projectId)
}

export function getWorkflowSnapshot(view: WorkflowView): WorkflowSnapshot {
  const dashboard = getDashboardSummary()
  const nextMoves = buildNextMoves()
  const weeklyReset = reviewQueries.getWeeklyReset(getCurrentWeekKey())
  const skillsPipeline = getSkillsPipeline()
  const monthly = buildMonthlyPrompts()

  return {
    view,
    generated_at: Date.now(),
    dashboard,
    morning_directive: buildMorningDirective(nextMoves),
    next_moves: nextMoves,
    weekly_reset: weeklyReset,
    weekly_review_prefill: weeklyReset.prefill,
    weekly_evidence_queue: buildWeeklyEvidenceQueue(skillsPipeline),
    monthly_prompts: monthly.prompts,
    monthly_project_refreshes: monthly.refreshes,
    skills_pipeline: skillsPipeline,
    arcs: planQueries.listNodes().filter((node) => node.kind === 'arc'),
    target_roles: pipelineQueries.listRoles()
  }
}
