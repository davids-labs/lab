import { and, asc, desc, eq, isNull, lt } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type { ActionItem, CreateActionItemInput, UpdateActionItemInput } from '../../../preload/types'
import { getDb } from '../index'
import { actionItemsTable, type ActionItemRow } from '../schema'

function clean(value: string | null | undefined): string | null {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function deserializeAction(row: ActionItemRow): ActionItem {
  return {
    ...row,
    details: row.details ?? null,
    status: row.status as ActionItem['status'],
    priority: row.priority as ActionItem['priority'],
    recurrence: row.recurrence as ActionItem['recurrence'],
    due_at: row.due_at ?? null,
    scheduled_for: row.scheduled_for ?? null,
    linked_plan_node_id: row.linked_plan_node_id ?? null,
    linked_project_id: row.linked_project_id ?? null,
    linked_application_id: row.linked_application_id ?? null,
    linked_contact_id: row.linked_contact_id ?? null,
    linked_note_id: row.linked_note_id ?? null,
    source_inbox_entry_id: row.source_inbox_entry_id ?? null,
    completed_at: row.completed_at ?? null
  }
}

export const actionQueries = {
  list(status?: ActionItem['status']): ActionItem[] {
    const db = getDb()
    const rows = status
      ? db
          .select()
          .from(actionItemsTable)
          .where(eq(actionItemsTable.status, status))
          .orderBy(asc(actionItemsTable.due_at), desc(actionItemsTable.updated_at))
          .all()
      : db
          .select()
          .from(actionItemsTable)
          .orderBy(desc(actionItemsTable.updated_at))
          .all()

    return rows.map(deserializeAction)
  },

  listOpen(): ActionItem[] {
    return this.list().filter((item) => item.status !== 'done' && item.status !== 'cancelled')
  },

  listOverdue(now = Date.now()): ActionItem[] {
    const db = getDb()
    return db
      .select()
      .from(actionItemsTable)
      .where(
        and(
          lt(actionItemsTable.due_at, now),
          isNull(actionItemsTable.completed_at)
        )
      )
      .orderBy(asc(actionItemsTable.due_at))
      .all()
      .map(deserializeAction)
      .filter((item) => item.status !== 'done' && item.status !== 'cancelled')
  },

  create(input: CreateActionItemInput): ActionItem {
    const db = getDb()
    const title = input.title.trim()

    if (!title) {
      throw new Error('Action title is required')
    }

    const now = Date.now()
    const id = ulid()

    db.insert(actionItemsTable)
      .values({
        id,
        title,
        details: clean(input.details),
        status: input.status ?? 'inbox',
        priority: input.priority ?? 'medium',
        recurrence: input.recurrence ?? 'none',
        due_at: input.due_at ?? null,
        scheduled_for: input.scheduled_for ?? null,
        linked_plan_node_id: input.linked_plan_node_id ?? null,
        linked_project_id: input.linked_project_id ?? null,
        linked_application_id: input.linked_application_id ?? null,
        linked_contact_id: input.linked_contact_id ?? null,
        linked_note_id: input.linked_note_id ?? null,
        source_inbox_entry_id: input.source_inbox_entry_id ?? null,
        completed_at:
          input.status === 'done' ? (input.due_at ?? now) : null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeAction(
      db.select().from(actionItemsTable).where(eq(actionItemsTable.id, id)).get()!
    )
  },

  update(input: UpdateActionItemInput): ActionItem {
    const db = getDb()
    const current = db.select().from(actionItemsTable).where(eq(actionItemsTable.id, input.id)).get()

    if (!current) {
      throw new Error('Action not found')
    }

    const nextStatus = input.status ?? current.status

    db.update(actionItemsTable)
      .set({
        title: input.title?.trim() || current.title,
        details: input.details === undefined ? current.details : clean(input.details),
        status: nextStatus,
        priority: input.priority ?? current.priority,
        recurrence: input.recurrence ?? current.recurrence,
        due_at: input.due_at === undefined ? current.due_at : input.due_at,
        scheduled_for:
          input.scheduled_for === undefined ? current.scheduled_for : input.scheduled_for,
        linked_plan_node_id:
          input.linked_plan_node_id === undefined
            ? current.linked_plan_node_id
            : input.linked_plan_node_id,
        linked_project_id:
          input.linked_project_id === undefined ? current.linked_project_id : input.linked_project_id,
        linked_application_id:
          input.linked_application_id === undefined
            ? current.linked_application_id
            : input.linked_application_id,
        linked_contact_id:
          input.linked_contact_id === undefined ? current.linked_contact_id : input.linked_contact_id,
        linked_note_id:
          input.linked_note_id === undefined ? current.linked_note_id : input.linked_note_id,
        completed_at:
          input.completed_at !== undefined
            ? input.completed_at
            : nextStatus === 'done'
              ? current.completed_at ?? Date.now()
              : nextStatus === 'cancelled'
                ? current.completed_at
                : null,
        updated_at: Date.now()
      })
      .where(eq(actionItemsTable.id, input.id))
      .run()

    return deserializeAction(
      db.select().from(actionItemsTable).where(eq(actionItemsTable.id, input.id)).get()!
    )
  },

  delete(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(actionItemsTable).where(eq(actionItemsTable.id, id)).run()
    return { ok: true }
  }
}
