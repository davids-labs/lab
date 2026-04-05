import type { DashboardCountdown, DashboardSummary, PlanNode, Project } from '../../preload/types'
import { buildBlockingAlert, getBlockingReasonsForNode } from './insights'
import { osQueries } from '../db/queries/os'
import { planQueries } from '../db/queries/plan'
import { projectQueries } from '../db/queries/projects'
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

export function getDashboardSummary(): DashboardSummary {
  const nodes = planQueries.listNodes()
  const { activePhase, children } = buildActivePhase(nodes)
  const projects = projectQueries.list()

  return {
    counts: {
      plan_nodes: nodes.length,
      skills: skillQueries.listNodes().length,
      projects: projects.length,
      countdowns: osQueries.listCountdowns().length,
      os_logs: osQueries.listDailyLogs().length
    },
    active_phase: activePhase,
    active_phase_children: children,
    countdowns: buildCountdowns(),
    blocking_alerts: buildBlockingAlerts(),
    skill_coverage: skillQueries.getCoverageSummary(),
    os: buildOsSummary(),
    ecosystem: buildEcosystemSummary(projects)
  }
}
