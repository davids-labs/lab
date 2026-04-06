import { desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CreateReviewSessionInput,
  ReviewArtifact,
  ReviewPrompt,
  ReviewSession,
  UpdateReviewSessionInput,
  WeeklyReset
} from '../../../preload/types'
import { getDb } from '../index'
import { reviewSessionsTable, type ReviewSessionRow } from '../schema'
import { actionQueries } from './actions'
import { osQueries } from './os'
import { pipelineQueries } from './pipeline'
import { planQueries } from './plan'

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

    return {
      week_key: weekKey,
      prompts: buildPrompts(weekKey),
      artifacts: buildArtifacts(weekKey),
      review: osQueries.getWeeklyReview(weekKey),
      priorities: osQueries.listWeeklyPriorities(weekKey),
      actions: actionQueries
        .listOpen()
        .filter((action) =>
          ['today', 'this_week', 'waiting'].includes(action.status) ||
          action.scheduled_for === weekKey
        )
        .slice(0, 12)
        .sort((left, right) => left.updated_at - right.updated_at),
      // touch the session so the week shows up as active
      ...(existing && {})
    }
  }
}
