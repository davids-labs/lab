import { desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CreateInboxEntryInput,
  InboxEntry,
  TriageInboxEntryInput,
  UpdateInboxEntryInput
} from '../../../preload/types'
import { getDb } from '../index'
import { inboxEntriesTable, type InboxEntryRow } from '../schema'
import { actionQueries } from './actions'
import { noteQueries } from './notes'
import { osQueries } from './os'
import { pipelineQueries } from './pipeline'
import { presenceQueries } from './presence'

function clean(value: string | null | undefined): string | null {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function deserializeEntry(row: InboxEntryRow): InboxEntry {
  return {
    ...row,
    body: row.body ?? null,
    kind: row.kind as InboxEntry['kind'],
    source: row.source as InboxEntry['source'],
    status: row.status as InboxEntry['status'],
    triage_target: (row.triage_target as InboxEntry['triage_target']) ?? null,
    linked_source_document_id: row.linked_source_document_id ?? null,
    linked_excerpt_id: row.linked_excerpt_id ?? null,
    linked_project_id: row.linked_project_id ?? null,
    linked_application_id: row.linked_application_id ?? null
  }
}

function startOfWeekKey(now = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = date.getUTCDay()
  const delta = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export const captureQueries = {
  list(status?: InboxEntry['status']): InboxEntry[] {
    const db = getDb()
    const rows = status
      ? db
          .select()
          .from(inboxEntriesTable)
          .where(eq(inboxEntriesTable.status, status))
          .orderBy(desc(inboxEntriesTable.updated_at))
          .all()
      : db
          .select()
          .from(inboxEntriesTable)
          .orderBy(desc(inboxEntriesTable.updated_at))
          .all()

    return rows.map(deserializeEntry)
  },

  create(input: CreateInboxEntryInput): InboxEntry {
    const db = getDb()
    const title = input.title.trim()

    if (!title) {
      throw new Error('Capture title is required')
    }

    const now = Date.now()
    const id = ulid()

    db.insert(inboxEntriesTable)
      .values({
        id,
        title,
        body: clean(input.body),
        kind: input.kind ?? 'note',
        source: input.source ?? 'manual',
        status: 'inbox',
        triage_target: null,
        linked_source_document_id: input.linked_source_document_id ?? null,
        linked_excerpt_id: input.linked_excerpt_id ?? null,
        linked_project_id: input.linked_project_id ?? null,
        linked_application_id: input.linked_application_id ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeEntry(db.select().from(inboxEntriesTable).where(eq(inboxEntriesTable.id, id)).get()!)
  },

  update(input: UpdateInboxEntryInput): InboxEntry {
    const db = getDb()
    const current = db.select().from(inboxEntriesTable).where(eq(inboxEntriesTable.id, input.id)).get()

    if (!current) {
      throw new Error('Capture entry not found')
    }

    db.update(inboxEntriesTable)
      .set({
        title: input.title?.trim() || current.title,
        body: input.body === undefined ? current.body : clean(input.body),
        kind: input.kind ?? current.kind,
        status: input.status ?? current.status,
        triage_target:
          input.triage_target === undefined ? current.triage_target : input.triage_target,
        linked_project_id:
          input.linked_project_id === undefined ? current.linked_project_id : input.linked_project_id,
        linked_application_id:
          input.linked_application_id === undefined
            ? current.linked_application_id
            : input.linked_application_id,
        updated_at: Date.now()
      })
      .where(eq(inboxEntriesTable.id, input.id))
      .run()

    return deserializeEntry(
      db.select().from(inboxEntriesTable).where(eq(inboxEntriesTable.id, input.id)).get()!
    )
  },

  triage(input: TriageInboxEntryInput): InboxEntry {
    const db = getDb()
    const entry = db.select().from(inboxEntriesTable).where(eq(inboxEntriesTable.id, input.id)).get()

    if (!entry) {
      throw new Error('Capture entry not found')
    }

    const current = deserializeEntry(entry)
    const title = current.title
    const body = current.body ?? ''

    if (input.create_follow_up === 'action') {
      actionQueries.create({
        title,
        details: body,
        status: input.target === 'execution' ? 'this_week' : 'inbox',
        source_inbox_entry_id: current.id,
        linked_application_id: current.linked_application_id,
        linked_project_id: current.linked_project_id
      })
    } else if (input.create_follow_up === 'note') {
      const note = noteQueries.create({
        title,
        body,
        type: input.target === 'direction' ? 'strategy' : 'brief',
        summary: current.body?.slice(0, 180) ?? null
      })
      if (current.linked_excerpt_id) {
        noteQueries.createLink({
          note_id: note.id,
          target_type: 'source_excerpt',
          target_id: current.linked_excerpt_id
        })
      }
    } else if (input.create_follow_up === 'application') {
      pipelineQueries.createApplication({
        title,
        notes: body || null,
        linked_project_id: current.linked_project_id
      })
    } else if (input.create_follow_up === 'narrative_fragment') {
      presenceQueries.createNarrativeFragment({
        title,
        body,
        fragment_type: 'story',
        source_document_id: current.linked_source_document_id,
        source_excerpt_id: current.linked_excerpt_id
      })
    } else if (input.create_follow_up === 'weekly_priority') {
      osQueries.createWeeklyPriority({
        week_key: startOfWeekKey(),
        title,
        notes: body || null
      })
    }

    db.update(inboxEntriesTable)
      .set({
        status: 'triaged',
        triage_target: input.target,
        updated_at: Date.now()
      })
      .where(eq(inboxEntriesTable.id, input.id))
      .run()

    return deserializeEntry(
      db.select().from(inboxEntriesTable).where(eq(inboxEntriesTable.id, input.id)).get()!
    )
  },

  delete(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(inboxEntriesTable).where(eq(inboxEntriesTable.id, id)).run()
    return { ok: true }
  }
}
