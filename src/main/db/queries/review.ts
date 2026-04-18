import { desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CreateReviewSessionInput,
  ReviewArtifact,
  ReviewPrompt,
  ReviewSession,
  UpdateReviewSessionInput,
  WeeklyReviewPrefill,
  WeeklyReviewSuggestion,
  WeeklyReset
} from '../../../preload/types'
import { getDb } from '../index'
import { reviewSessionsTable, type ReviewSessionRow } from '../schema'
import { actionQueries } from './actions'
import { osQueries } from './os'
import { pipelineQueries } from './pipeline'
import { planQueries } from './plan'
import { projectQueries } from './projects'

function deserializeSession(row: ReviewSessionRow): ReviewSession {
  return {
    ...row,
    status: row.status as ReviewSession['status'],
    summary: row.summary ?? null
  }
}

function buildPrompts(weekKey: string): ReviewPrompt[] {
  const priorities = osQueries.listWeeklyPriorities(weekKey)
  const review = osQueries.getWeeklyReview(weekKey)
  const actions = actionQueries.listOpen()
  const prompts: ReviewPrompt[] = []

  if (priorities.length === 0) {
    prompts.push({
      id: 'priorities',
      title: 'Set weekly priorities',
      body: 'Choose the 3–5 moves that define the week before it starts reacting to everything else.',
      priority: 'high'
    })
  }

  if (!review?.focus_next) {
    prompts.push({
      id: 'review',
      title: 'Write the weekly review',
      body: 'Capture wins, friction, and the next focus so the operating loop actually closes.',
      priority: 'high'
    })
  }

  if (!actions.some((item) => item.status === 'today' || item.status === 'this_week')) {
    prompts.push({
      id: 'actions',
      title: 'Promote actions into this week',
      body: 'Move the most important next actions out of inbox/next and into a real operating lane.',
      priority: 'normal'
    })
  }

  return prompts
}

function toWeekWindow(weekKey: string): { startMs: number; endMs: number; endDate: string } {
  const start = new Date(`${weekKey}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 7)
  const endDate = new Date(end)
  endDate.setUTCDate(endDate.getUTCDate() - 1)

  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
    endDate: endDate.toISOString().slice(0, 10)
  }
}

function isDateInWeek(date: string, weekKey: string, endDate: string): boolean {
  return date >= weekKey && date <= endDate
}

function buildSuggestion(text: string | null, sourceLabels: string[]): WeeklyReviewSuggestion {
  return {
    text: text && text.trim().length > 0 ? text.trim() : null,
    source_labels: sourceLabels
  }
}

function buildWeeklyReviewPrefill(weekKey: string): WeeklyReviewPrefill {
  const { startMs, endMs, endDate } = toWeekWindow(weekKey)
  const priorities = osQueries.listWeeklyPriorities(weekKey)
  const closedActions = actionQueries
    .list()
    .filter(
      (item) =>
        item.status === 'done' &&
        typeof item.completed_at === 'number' &&
        item.completed_at >= startMs &&
        item.completed_at < endMs
    )
  const blockedNodes = planQueries
    .listNodes()
    .filter(
      (node) =>
        (node.status === 'blocked' || node.status === 'at_risk') &&
        node.updated_at >= startMs &&
        node.updated_at < endMs
    )
  const dailyLogs = osQueries
    .listDailyLogs()
    .filter((entry) => isDateInWeek(entry.date, weekKey, endDate))
  const deepWorkMinutes = dailyLogs.reduce((total, entry) => total + entry.deep_work_minutes, 0)
  const gymDays = dailyLogs.filter((entry) => entry.gym_done).length
  const habitLogs = osQueries
    .listHabitLogs()
    .filter((entry) => entry.completed && isDateInWeek(entry.date, weekKey, endDate))
  const habits = osQueries.listHabits()
  const habitLabelById = new Map(habits.map((habit) => [habit.id, habit.name]))
  const completedProjects = projectQueries
    .list()
    .filter((project) => project.updated_at >= startMs && project.updated_at < endMs)
  const dueApplications = pipelineQueries
    .listApplications()
    .filter((application) => {
      const dueAt = application.follow_up_at ?? application.deadline_at
      return typeof dueAt === 'number' && dueAt >= startMs && dueAt < endMs
    })
  const openFocusAction =
    actionQueries
      .listOpen()
      .find((item) => item.status === 'today' || item.status === 'this_week') ??
    actionQueries.listOpen()[0] ??
    null
  const openPriority =
    priorities.find((priority) => priority.status !== 'done' && priority.status !== 'dropped') ?? null
  const completedPriorityCount = priorities.filter((priority) => priority.status === 'done').length
  const closedActionSummary =
    closedActions.length > 0
      ? `${closedActions.length} actions closed: ${closedActions
          .slice(0, 3)
          .map((item) => item.title)
          .join(', ')}${closedActions.length > 3 ? '…' : ''}.`
      : null
  const habitSummary =
    habitLogs.length > 0
      ? `${habitLogs.length} habit completions across ${new Set(habitLogs.map((entry) => entry.habit_id)).size} rituals.`
      : null
  const projectSummary =
    completedProjects.length > 0
      ? `Projects moved this week: ${completedProjects
          .slice(0, 2)
          .map((project) => project.name)
          .join(', ')}${completedProjects.length > 2 ? '…' : ''}.`
      : null
  const frictionSummary =
    blockedNodes.length > 0
      ? `Blocked or at-risk nodes: ${blockedNodes
          .slice(0, 2)
          .map((node) => node.title)
          .join(', ')}${blockedNodes.length > 2 ? '…' : ''}.`
      : deepWorkMinutes > 0
        ? `Deep work totaled ${Math.round(deepWorkMinutes / 60)}h this week${gymDays > 0 ? ` with ${gymDays} gym days` : ''}.`
        : null
  const focusSummary = openPriority
    ? `Keep ${openPriority.title} at the center of next week.`
    : openFocusAction
      ? `Promote ${openFocusAction.title} into the first move of next week.`
      : null
  const proofMoveSummary =
    completedProjects.length > 0
      ? `Turn ${completedProjects[0].name} into skill evidence or a sharper case-study proof block.`
      : habitLogs.length > 0
        ? `Capture this week's operating consistency in one proof-facing narrative fragment.`
        : null
  const pipelineMoveSummary =
    dueApplications.length > 0
      ? `Advance ${dueApplications[0].title}${dueApplications.length > 1 ? ` and ${dueApplications.length - 1} other pipeline items` : ''}.`
      : openFocusAction?.linked_application_id
        ? `Close the application follow-up loop tied to ${openFocusAction.title}.`
        : null

  return {
    week_key: weekKey,
    wins: buildSuggestion(
      [closedActionSummary, completedPriorityCount > 0 ? `${completedPriorityCount} weekly priorities completed.` : null, habitSummary]
        .filter((value): value is string => Boolean(value))
        .join(' '),
      [
        ...closedActions.slice(0, 3).map((item) => `Action: ${item.title}`),
        ...habitLogs.slice(0, 2).map((entry) => `Habit: ${habitLabelById.get(entry.habit_id) ?? entry.habit_id}`)
      ]
    ),
    friction: buildSuggestion(
      frictionSummary,
      blockedNodes.slice(0, 3).map((node) => `Node: ${node.title}`)
    ),
    focus_next: buildSuggestion(
      focusSummary,
      [
        ...(openPriority ? [`Priority: ${openPriority.title}`] : []),
        ...(openFocusAction ? [`Action: ${openFocusAction.title}`] : [])
      ]
    ),
    proof_move: buildSuggestion(
      [projectSummary, proofMoveSummary].filter((value): value is string => Boolean(value)).join(' '),
      completedProjects.slice(0, 3).map((project) => `Project: ${project.name}`)
    ),
    pipeline_move: buildSuggestion(
      pipelineMoveSummary,
      dueApplications.slice(0, 3).map((application) => `Application: ${application.title}`)
    )
  }
}

function buildArtifacts(weekKey: string): ReviewArtifact[] {
  const priorities = osQueries.listWeeklyPriorities(weekKey)
  const applications = pipelineQueries.listApplications().slice(0, 3)
  const activePhase = planQueries
    .listNodes()
    .find((node) => node.kind === 'phase' && node.status !== 'complete' && node.status !== 'paused')

  return [
    ...priorities.map((priority) => ({
      id: `priority:${priority.id}`,
      label: `Priority · ${priority.title}`,
      body: priority.notes ?? priority.status.replace(/_/g, ' '),
      entity_type: 'weekly_priority',
      entity_id: priority.id
    })),
    ...applications.map((application) => ({
      id: `application:${application.id}`,
      label: `Pipeline · ${application.title}`,
      body: application.notes ?? application.status.replace(/_/g, ' '),
      entity_type: 'application_record',
      entity_id: application.id
    })),
    ...(activePhase
      ? [
          {
            id: `phase:${activePhase.id}`,
            label: `Current phase · ${activePhase.title}`,
            body: activePhase.summary ?? activePhase.status.replace(/_/g, ' '),
            entity_type: 'plan_node',
            entity_id: activePhase.id
          }
        ]
      : [])
  ]
}

export const reviewQueries = {
  listSessions(): ReviewSession[] {
    const db = getDb()
    return db
      .select()
      .from(reviewSessionsTable)
      .orderBy(desc(reviewSessionsTable.week_key))
      .all()
      .map(deserializeSession)
  },

  createSession(input: CreateReviewSessionInput): ReviewSession {
    const db = getDb()
    const current = db
      .select()
      .from(reviewSessionsTable)
      .where(eq(reviewSessionsTable.week_key, input.week_key))
      .get()

    if (current) {
      return deserializeSession(current)
    }

    const now = Date.now()
    const id = ulid()
    db.insert(reviewSessionsTable)
      .values({
        id,
        week_key: input.week_key,
        status: 'open',
        summary: input.summary ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeSession(
      db.select().from(reviewSessionsTable).where(eq(reviewSessionsTable.id, id)).get()!
    )
  },

  updateSession(input: UpdateReviewSessionInput): ReviewSession {
    const db = getDb()
    const current = db
      .select()
      .from(reviewSessionsTable)
      .where(eq(reviewSessionsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Review session not found')
    }

    db.update(reviewSessionsTable)
      .set({
        status: input.status ?? current.status,
        summary: input.summary === undefined ? current.summary : input.summary,
        updated_at: Date.now()
      })
      .where(eq(reviewSessionsTable.id, input.id))
      .run()

    return deserializeSession(
      db.select().from(reviewSessionsTable).where(eq(reviewSessionsTable.id, input.id)).get()!
    )
  },

  getWeeklyReset(weekKey: string): WeeklyReset {
    const existing =
      this.listSessions().find((session) => session.week_key === weekKey) ??
      this.createSession({ week_key: weekKey })
    const prefill = buildWeeklyReviewPrefill(weekKey)
    const review = osQueries.getWeeklyReview(weekKey)
    const seededReview =
      !review ||
      !review.wins ||
      !review.friction ||
      !review.focus_next ||
      !review.proof_move ||
      !review.pipeline_move
        ? osQueries.upsertWeeklyReview({
            week_key: weekKey,
            wins: review?.wins?.trim() ? review.wins : prefill.wins.text,
            friction: review?.friction?.trim() ? review.friction : prefill.friction.text,
            focus_next: review?.focus_next?.trim() ? review.focus_next : prefill.focus_next.text,
            proof_move: review?.proof_move?.trim() ? review.proof_move : prefill.proof_move.text,
            pipeline_move:
              review?.pipeline_move?.trim() ? review.pipeline_move : prefill.pipeline_move.text,
            notes: review?.notes ?? null
          })
        : review

    return {
      week_key: weekKey,
      prompts: buildPrompts(weekKey),
      artifacts: buildArtifacts(weekKey),
      review: seededReview,
      priorities: osQueries.listWeeklyPriorities(weekKey),
      actions: actionQueries
        .listOpen()
        .filter((action) =>
          ['today', 'this_week', 'waiting'].includes(action.status) ||
          action.scheduled_for === weekKey
        )
        .slice(0, 12)
        .sort((left, right) => left.updated_at - right.updated_at),
      prefill,
      // touch the session so the week shows up as active
      ...(existing && {})
    }
  }
}
