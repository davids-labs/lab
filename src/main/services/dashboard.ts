import type {
  ActionStatus,
  DashboardCountdown,
  DashboardSummary,
  DriftAlert,
  PlanNode,
  Project,
  ProofGap,
  Recommendation
} from '../../preload/types'
import { ACTION_STATUSES } from '../../preload/types'
import { actionQueries } from '../db/queries/actions'
import { calendarQueries } from '../db/queries/calendar'
import { captureQueries } from '../db/queries/capture'
import { exportQueries } from '../db/queries/exports'
import { buildBlockingAlert, getBlockingReasonsForNode } from './insights'
import { libraryQueries } from '../db/queries/library'
import { noteQueries } from '../db/queries/notes'
import { osQueries } from '../db/queries/os'
import { pipelineQueries } from '../db/queries/pipeline'
import { planQueries } from '../db/queries/plan'
import { presenceQueries } from '../db/queries/presence'
import { projectQueries } from '../db/queries/projects'
import { settingsQueries } from '../db/queries/settings'
import { skillQueries } from '../db/queries/skills'

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function addDays(date: Date, delta: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + delta)
  return next
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

function buildCountdowns(): DashboardCountdown[] {
  const today = new Date(`${getTodayUtc()}T00:00:00.000Z`).getTime()

  return osQueries
    .listCountdowns()
    .map((countdown) => {
      const target = new Date(`${countdown.target_date}T00:00:00.000Z`).getTime()
      return {
        id: countdown.id,
        title: countdown.title,
        target_date: countdown.target_date,
        category: countdown.category,
        days_remaining: Math.ceil((target - today) / (1000 * 60 * 60 * 24))
      }
    })
    .sort((left, right) => left.days_remaining - right.days_remaining)
    .slice(0, 6)
}

function buildActivePhase(nodes: PlanNode[]): { activePhase: PlanNode | null; children: PlanNode[] } {
  const phases = nodes
    .filter((node) => node.kind === 'phase')
    .sort((left, right) => left.sort_order - right.sort_order)
  const activePhase =
    phases.find((phase) => phase.status !== 'complete' && phase.status !== 'paused') ?? phases[0] ?? null

  return {
    activePhase,
    children: activePhase
      ? nodes
          .filter((node) => node.parent_id === activePhase.id)
          .sort((left, right) => left.sort_order - right.sort_order)
      : []
  }
}

function buildBlockingAlerts(): DashboardSummary['blocking_alerts'] {
  const nodes = planQueries.listNodes()
  const links = planQueries.listLinks()
  const projects = projectQueries.list()
  const countdowns = osQueries.listCountdowns()
  const skills = skillQueries.listNodes()
  const planNodeById = new Map(nodes.map((node) => [node.id, node]))
  const projectsById = new Map(projects.map((project) => [project.id, project]))
  const skillsById = new Map(skills.map((skill) => [skill.id, skill]))
  const countdownsById = new Map(countdowns.map((item) => [item.id, item]))
  const now = Date.now()

  return nodes
    .flatMap((node) => {
      const nodeLinks = links.filter((link) => link.node_id === node.id)
      const reasons = getBlockingReasonsForNode(
        node,
        nodeLinks,
        planNodeById,
        projectsById,
        skillsById,
        countdownsById
      )
      const severity = node.due_at && node.due_at - now <= 1000 * 60 * 60 * 24 * 10 ? 'critical' : 'warning'

      return reasons.map((reason) => buildBlockingAlert(node, reason, severity))
    })
    .slice(0, 8)
}

function buildOsSummary(): DashboardSummary['os'] {
  const today = getTodayUtc()
  const profiles = osQueries.listProfiles()
  const activeProfile = profiles.find((profile) => profile.is_default) ?? null
  const timeBlocks = activeProfile ? osQueries.listTimeBlocks(activeProfile.id) : []
  const todayLog = osQueries.getDailyLog(today)
  const habits = osQueries.listHabits()
  const todayHabitLogs = new Map(osQueries.getHabitLogsForDate(today).map((entry) => [entry.habit_id, entry]))
  const recentDates = Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(new Date(`${today}T00:00:00.000Z`), -index)))
  const recentLogSet = new Set(recentDates)
  const recentLogs = osQueries.listDailyLogs().filter((entry) => recentLogSet.has(entry.date))

  const totals = recentLogs.reduce(
    (accumulator, entry) => {
      accumulator.sleep += entry.sleep_hours
      accumulator.calories += entry.calories
      accumulator.protein += entry.protein_grams
      accumulator.water += entry.water_litres
      accumulator.deepWork += entry.deep_work_minutes
      accumulator.gym += entry.gym_done ? 1 : 0
      return accumulator
    },
    {
      sleep: 0,
      calories: 0,
      protein: 0,
      water: 0,
      deepWork: 0,
      gym: 0
    }
  )
  const divisor = recentLogs.length || 1

  return {
    today: todayLog,
    week: {
      days_logged: recentLogs.length,
      average_sleep_hours: totals.sleep / divisor,
      average_calories: totals.calories / divisor,
      average_protein_grams: totals.protein / divisor,
      average_water_litres: totals.water / divisor,
      average_deep_work_minutes: totals.deepWork / divisor,
      completed_gym_days: totals.gym
    },
    profiles,
    active_profile_id: activeProfile?.id ?? null,
    time_blocks: timeBlocks,
    habits: habits.map((habit) => ({
      ...habit,
      today_completed: todayHabitLogs.get(habit.id)?.completed ?? false
    }))
  }
}

function buildEcosystemSummary(projects: Project[]): DashboardSummary['ecosystem'] {
  return {
    total_projects: projects.length,
    by_type: {
      hero: projects.filter((project) => project.type === 'hero').length,
      build: projects.filter((project) => project.type === 'build').length,
      design: projects.filter((project) => project.type === 'design').length,
      concept: projects.filter((project) => project.type === 'concept').length
    },
    by_execution_stage: {
      ideation: projects.filter((project) => project.execution_stage === 'ideation').length,
      planning: projects.filter((project) => project.execution_stage === 'planning').length,
      prototyping: projects.filter((project) => project.execution_stage === 'prototyping').length,
      validation: projects.filter((project) => project.execution_stage === 'validation').length,
      completed: projects.filter((project) => project.execution_stage === 'completed').length,
      archived: projects.filter((project) => project.execution_stage === 'archived').length
    },
    recently_updated: [...projects].sort((left, right) => right.updated_at - left.updated_at).slice(0, 5)
  }
}

function buildInboxSummary(): DashboardSummary['inbox'] {
  const entries = captureQueries.list('inbox')
  return {
    open: entries.length,
    recent: entries.slice(0, 6)
  }
}

function buildActionSummary(): DashboardSummary['actions'] {
  const openActions = actionQueries.listOpen()
  const byStatus = ACTION_STATUSES.reduce(
    (accumulator, status) => ({
      ...accumulator,
      [status]: openActions.filter((item) => item.status === status).length
    }),
    {} as Record<ActionStatus, number>
  )

  return {
    by_status: byStatus,
    focus: openActions
      .filter((item) => ['today', 'this_week', 'next', 'waiting'].includes(item.status))
      .sort((left, right) => {
        const leftDate = left.due_at ?? left.updated_at
        const rightDate = right.due_at ?? right.updated_at
        return leftDate - rightDate
      })
      .slice(0, 8),
    overdue: actionQueries.listOverdue().slice(0, 6)
  }
}

function buildNoteSummary(): DashboardSummary['notes'] {
  const notes = noteQueries.list().filter((note) => !note.archived)
  return {
    count: notes.length,
    recent: notes.slice(0, 6)
  }
}

function buildCalendarSummary(): DashboardSummary['calendar'] {
  const now = Date.now()
  const upcomingLimit = now + 1000 * 60 * 60 * 24 * 21
  const upcoming = calendarQueries
    .listEvents()
    .filter((event) => event.starts_at >= now && event.starts_at <= upcomingLimit)
    .slice(0, 8)

  return {
    sources: calendarQueries.listSources().length,
    upcoming
  }
}

function buildDriftAlerts(): DriftAlert[] {
  const alerts: DriftAlert[] = []
  const activePhase =
    planQueries
      .listNodes()
      .find((node) => node.kind === 'phase' && node.status !== 'complete' && node.status !== 'paused') ??
    null
  const openActions = actionQueries.listOpen()
  const weeklyPriorities = osQueries.listWeeklyPriorities(getCurrentWeekKey())

  if (activePhase && !openActions.some((item) => item.linked_plan_node_id === activePhase.id)) {
    alerts.push({
      id: `phase-action:${activePhase.id}`,
      title: 'Current phase has no active action owner',
      body: `Link at least one active action to "${activePhase.title}" so the strategic layer is driving weekly work.`,
      severity: 'warning',
      entity_type: 'plan_node',
      entity_id: activePhase.id
    })
  }

  if (weeklyPriorities.length === 0) {
    alerts.push({
      id: 'weekly-priority-gap',
      title: 'The week has no operating priorities',
      body: 'Set weekly priorities so the execution layer has a clear horizon.',
      severity: 'warning',
      entity_type: 'weekly_priority',
      entity_id: getCurrentWeekKey()
    })
  }

  if (captureQueries.list('inbox').length > 8) {
    alerts.push({
      id: 'inbox-overflow',
      title: 'Inbox is starting to overflow',
      body: 'Triage the oldest captures into actions, notes, or pipeline records before they turn into noise.',
      severity: 'info',
      entity_type: 'inbox_entry',
      entity_id: 'inbox'
    })
  }

  return alerts.slice(0, 6)
}

function buildProofGaps(): ProofGap[] {
  const unverified = skillQueries
    .listNodes()
    .filter((node) => node.state !== 'verified')
    .slice(0, 5)

  return unverified.map((skill) => ({
    id: `skill-gap:${skill.id}`,
    title: `Missing verified proof for ${skill.title}`,
    body: 'Attach or confirm evidence from a completed project so this skill can move from asserted to verified.',
    target_role_id: null,
    target_organization_id: null,
    related_skill_id: skill.id,
    related_project_id: null,
    severity: skill.state === 'in_progress' ? 'warning' : 'critical'
  }))
}

function buildRecommendations(): Recommendation[] {
  const recommendations: Recommendation[] = []

  if (actionQueries.list('today').length === 0) {
    recommendations.push({
      id: 'rec-plan-today',
      title: 'Set today’s action lane',
      body: 'Move one or two actions into Today so Execution becomes the live operating surface.',
      target_route: '/execution'
    })
  }

  if (noteQueries.list().length === 0) {
    recommendations.push({
      id: 'rec-first-note',
      title: 'Start a strategy note',
      body: 'Use Notes for decision logs, planning memos, and meeting notes instead of burying them in other modules.',
      target_route: '/notes'
    })
  }

  if (calendarQueries.listSources().length === 0) {
    recommendations.push({
      id: 'rec-calendar',
      title: 'Import a calendar source',
      body: 'Bring your real time commitments into the app with an ICS calendar import.',
      target_route: '/settings'
    })
  }

  return recommendations.slice(0, 4)
}

export function getDashboardSummary(): DashboardSummary {
  const nodes = planQueries.listNodes()
  const { activePhase, children } = buildActivePhase(nodes)
  const projects = projectQueries.list()
  const weekKey = getCurrentWeekKey()
  const weeklyPriorities = osQueries.listWeeklyPriorities(weekKey)
  const weeklyReview = osQueries.getWeeklyReview(weekKey)
  const organizations = pipelineQueries.listOrganizations()
  const applications = pipelineQueries.listApplications()
  const profileAssets = presenceQueries.listProfileAssets()
  const contentIdeas = presenceQueries.listContentIdeas()
  const documents = libraryQueries.listDocuments()
  const suggestions = libraryQueries.listSuggestions()
  const settings = settingsQueries.getBundle()
  const skillCoverage = skillQueries.getCoverageSummary()
  const inboxSummary = buildInboxSummary()
  const actionSummary = buildActionSummary()
  const noteSummary = buildNoteSummary()
  const calendarSummary = buildCalendarSummary()
  const driftAlerts = buildDriftAlerts()
  const proofGaps = buildProofGaps()
  const recommendations = buildRecommendations()
  const missing: string[] = []

  if (!settings.user_profile.linkedin_url && !settings.integration_settings.linkedin_profile_url) {
    missing.push('LinkedIn profile')
  }

  if (!settings.user_profile.github_url) {
    missing.push('GitHub profile')
  }

  if (organizations.length === 0) {
    missing.push('Target organizations')
  }

  if (documents.length === 0) {
    missing.push('Source documents')
  }

  if (projects.length === 0) {
    missing.push('Projects')
  }

  if (noteSummary.count === 0) {
    missing.push('Notes')
  }

  return {
    counts: {
      plan_nodes: nodes.length,
      skills: skillQueries.listNodes().length,
      projects: projects.length,
      countdowns: osQueries.listCountdowns().length,
      os_logs: osQueries.listDailyLogs().length,
      inbox_entries: inboxSummary.open,
      actions: actionQueries.list().length,
      notes: noteSummary.count
    },
    active_phase: activePhase,
    active_phase_children: children,
    countdowns: buildCountdowns(),
    blocking_alerts: buildBlockingAlerts(),
    skill_coverage: skillCoverage,
    os: buildOsSummary(),
    ecosystem: buildEcosystemSummary(projects),
    weekly_priorities: weeklyPriorities,
    weekly_review: weeklyReview,
    pipeline: {
      organizations: organizations.length,
      active_applications: applications.filter(
        (entry) => entry.status !== 'rejected' && entry.status !== 'paused'
      ).length,
      next_actions: applications
        .filter((entry) => entry.follow_up_at !== null || entry.deadline_at !== null)
        .sort((left, right) => {
          const leftDate = left.follow_up_at ?? left.deadline_at ?? Number.MAX_SAFE_INTEGER
          const rightDate = right.follow_up_at ?? right.deadline_at ?? Number.MAX_SAFE_INTEGER
          return leftDate - rightDate
        })
        .slice(0, 5)
    },
    presence: {
      ready_assets: profileAssets.filter((entry) => entry.status === 'ready').length,
      open_ideas: contentIdeas.filter((entry) => entry.status !== 'posted').length,
      prompts: [
        weeklyPriorities.length === 0
          ? 'Set this week’s priorities so the dashboard has a clear operating horizon.'
          : 'Review whether your weekly priorities still match the current phase.',
        skillCoverage.unverified > 0
          ? 'Promote one project move into proof or narrative this week.'
          : 'You have verified skill coverage to turn into public narrative assets.',
        profileAssets.length === 0
          ? 'Create a LinkedIn or CV asset so Presence becomes a real output surface.'
          : 'Refresh one public-facing asset with your latest proof.'
      ].slice(0, 3)
    },
    library: {
      documents: documents.length,
      pending_suggestions: suggestions.filter((entry) => entry.status === 'pending').length
    },
    inbox: inboxSummary,
    actions: actionSummary,
    notes: noteSummary,
    calendar: calendarSummary,
    insights: {
      drift_alerts: driftAlerts,
      proof_gaps: proofGaps,
      recommendations
    },
    exports: {
      recent: exportQueries.listBundles().slice(0, 5)
    },
    onboarding: {
      needs_setup: settings.dashboard_preferences.show_onboarding || missing.length > 0,
      missing
    }
  }
}
