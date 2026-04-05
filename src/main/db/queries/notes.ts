import { asc, desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CreateNoteLinkInput,
  CreateNotePageInput,
  NoteLink,
  NotePage,
  UpdateNotePageInput
} from '../../../preload/types'
import { getDb } from '../index'
import {
  noteLinksTable,
  notePagesTable,
  type NoteLinkRow,
  type NotePageRow
} from '../schema'

function clean(value: string | null | undefined): string | null {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function deserializePage(row: NotePageRow): NotePage {
  return {
    ...row,
    type: row.type as NotePage['type'],
    summary: row.summary ?? null,
    archived: Boolean(row.archived)
  }
}

function deserializeLink(row: NoteLinkRow): NoteLink {
  return row
}

export const noteQueries = {
  list(): NotePage[] {
    const db = getDb()
    return db
      .select()
      .from(notePagesTable)
      .orderBy(desc(notePagesTable.updated_at))
      .all()
      .map(deserializePage)
  },

  get(id: string): NotePage {
    const db = getDb()
    const row = db.select().from(notePagesTable).where(eq(notePagesTable.id, id)).get()

    if (!row) {
      throw new Error('Note not found')
    }

    return deserializePage(row)
  },

  create(input: CreateNotePageInput): NotePage {
    const db = getDb()
    const title = input.title.trim()

    if (!title) {
      throw new Error('Note title is required')
    }

    const id = ulid()
    const now = Date.now()

    db.insert(notePagesTable)
      .values({
        id,
        title,
        body: input.body ?? '',
        type: input.type ?? 'strategy',
        summary: clean(input.summary),
        archived: false,
        created_at: now,
        updated_at: now
      })
      .run()

    return this.get(id)
  },

  update(input: UpdateNotePageInput): NotePage {
    const db = getDb()
    const current = this.get(input.id)

    db.update(notePagesTable)
      .set({
        title: input.title?.trim() || current.title,
        body: input.body === undefined ? current.body : input.body,
        type: input.type ?? current.type,
        summary: input.summary === undefined ? current.summary : clean(input.summary),
        archived: input.archived ?? current.archived,
        updated_at: Date.now()
      })
      .where(eq(notePagesTable.id, input.id))
      .run()

    return this.get(input.id)
  },

  delete(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(notePagesTable).where(eq(notePagesTable.id, id)).run()
    return { ok: true }
  },

  listLinks(noteId?: string): NoteLink[] {
    const db = getDb()
    const rows = noteId
      ? db
          .select()
          .from(noteLinksTable)
          .where(eq(noteLinksTable.note_id, noteId))
          .orderBy(asc(noteLinksTable.created_at))
          .all()
      : db
          .select()
          .from(noteLinksTable)
          .orderBy(desc(noteLinksTable.created_at))
          .all()

    return rows.map(deserializeLink)
  },

  createLink(input: CreateNoteLinkInput): NoteLink {
    const db = getDb()
    const id = ulid()
    db.insert(noteLinksTable)
      .values({
        id,
        note_id: input.note_id,
        target_type: input.target_type,
        target_id: input.target_id,
        created_at: Date.now()
      })
      .run()

    return deserializeLink(db.select().from(noteLinksTable).where(eq(noteLinksTable.id, id)).get()!)
  },

  deleteLink(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(noteLinksTable).where(eq(noteLinksTable.id, id)).run()
    return { ok: true }
  }
}
