import fs from 'node:fs'
import path from 'node:path'
import { asc, desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CalendarEvent,
  CalendarSource,
  CreateCalendarSourceInput,
  ImportCalendarSourceInput,
  UpdateCalendarSourceInput
} from '../../../preload/types'
import { getDb } from '../index'
import {
  calendarEventsTable,
  calendarSourcesTable,
  type CalendarEventRow,
  type CalendarSourceRow
} from '../schema'

function clean(value: string | null | undefined): string | null {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function deserializeSource(row: CalendarSourceRow): CalendarSource {
  return {
    ...row,
    kind: row.kind as CalendarSource['kind'],
    sync_status: row.sync_status as CalendarSource['sync_status'],
    last_synced_at: row.last_synced_at ?? null,
    last_error: row.last_error ?? null
  }
}

function deserializeEvent(row: CalendarEventRow): CalendarEvent {
  return {
    ...row,
    ends_at: row.ends_at ?? null,
    location: row.location ?? null,
    notes: row.notes ?? null
  }
}

function unfoldIcs(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const unfolded: string[] = []

  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.trim()
    } else {
      unfolded.push(line.trimEnd())
    }
  }

  return unfolded
}

function parseIcsTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const raw = value.trim()
  if (/^\d{8}$/.test(raw)) {
    return new Date(
      `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000Z`
    ).getTime()
  }

  if (/^\d{8}T\d{6}Z$/.test(raw)) {
    return new Date(
      `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(
        9,
        11
      )}:${raw.slice(11, 13)}:${raw.slice(13, 15)}.000Z`
    ).getTime()
  }

  if (/^\d{8}T\d{6}$/.test(raw)) {
    return new Date(
      `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(
        9,
        11
      )}:${raw.slice(11, 13)}:${raw.slice(13, 15)}`
    ).getTime()
  }

  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? null : parsed
}

function parseIcsEvents(text: string): Array<{
  external_id: string
  title: string
  starts_at: number
  ends_at: number | null
  location: string | null
  notes: string | null
}> {
  const lines = unfoldIcs(text)
  const events: Array<{
    external_id: string
    title: string
    starts_at: number
    ends_at: number | null
    location: string | null
    notes: string | null
  }> = []
  let current: Record<string, string> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
      continue
    }

    if (line === 'END:VEVENT') {
      const startsAt = parseIcsTimestamp(current?.DTSTART)
      if (current && startsAt) {
        events.push({
          external_id: current.UID ?? ulid(),
          title: current.SUMMARY ?? 'Untitled event',
          starts_at: startsAt,
          ends_at: parseIcsTimestamp(current.DTEND),
          location: clean(current.LOCATION),
          notes: clean(current.DESCRIPTION)
        })
      }
      current = null
      continue
    }

    if (!current) {
      continue
    }

    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).split(';')[0]
    const value = line.slice(separatorIndex + 1).replace(/\\n/g, '\n').trim()
    current[key] = value
  }

  return events
}

function syncIcsSource(sourceId: string): void {
  const db = getDb()
  const source = db
    .select()
    .from(calendarSourcesTable)
    .where(eq(calendarSourcesTable.id, sourceId))
    .get()

  if (!source) {
    throw new Error('Calendar source not found')
  }

  const now = Date.now()
  try {
    const text = fs.readFileSync(source.source_value, 'utf8')
    const events = parseIcsEvents(text)

    db.delete(calendarEventsTable).where(eq(calendarEventsTable.source_id, sourceId)).run()

    for (const event of events) {
      db.insert(calendarEventsTable)
        .values({
          id: ulid(),
          source_id: sourceId,
          external_id: event.external_id,
          title: event.title,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          location: event.location,
          notes: event.notes,
          created_at: now,
          updated_at: now
        })
        .run()
    }

    db.update(calendarSourcesTable)
      .set({
        sync_status: 'ready',
        last_synced_at: now,
        last_error: null,
        updated_at: now
      })
      .where(eq(calendarSourcesTable.id, sourceId))
      .run()
  } catch (error) {
    db.update(calendarSourcesTable)
      .set({
        sync_status: 'error',
        last_error: error instanceof Error ? error.message : 'Failed to sync ICS source.',
        updated_at: now
      })
      .where(eq(calendarSourcesTable.id, sourceId))
      .run()
  }
}

export const calendarQueries = {
  listSources(): CalendarSource[] {
    const db = getDb()
    return db
      .select()
      .from(calendarSourcesTable)
      .orderBy(desc(calendarSourcesTable.updated_at))
      .all()
      .map(deserializeSource)
  },

  createSource(input: CreateCalendarSourceInput): CalendarSource {
    const db = getDb()
    const label = input.label.trim()

    if (!label || !input.source_value.trim()) {
      throw new Error('Calendar source label and source value are required')
    }

    const id = ulid()
    const now = Date.now()
    db.insert(calendarSourcesTable)
      .values({
        id,
        label,
        kind: input.kind ?? 'ics',
        source_value: input.source_value.trim(),
        sync_status: 'idle',
        last_synced_at: null,
        last_error: null,
        created_at: now,
        updated_at: now
      })
      .run()

    if ((input.kind ?? 'ics') === 'ics') {
      syncIcsSource(id)
    }

    return deserializeSource(
      db.select().from(calendarSourcesTable).where(eq(calendarSourcesTable.id, id)).get()!
    )
  },

  updateSource(input: UpdateCalendarSourceInput): CalendarSource {
    const db = getDb()
    const current = db
      .select()
      .from(calendarSourcesTable)
      .where(eq(calendarSourcesTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Calendar source not found')
    }

    db.update(calendarSourcesTable)
      .set({
        label: input.label?.trim() || current.label,
        kind: input.kind ?? current.kind,
        source_value: input.source_value?.trim() || current.source_value,
        sync_status: input.sync_status ?? current.sync_status,
        last_error: input.last_error === undefined ? current.last_error : clean(input.last_error),
        updated_at: Date.now()
      })
      .where(eq(calendarSourcesTable.id, input.id))
      .run()

    if ((input.kind ?? current.kind) === 'ics') {
      syncIcsSource(input.id)
    }

    return deserializeSource(
      db.select().from(calendarSourcesTable).where(eq(calendarSourcesTable.id, input.id)).get()!
    )
  },

  deleteSource(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(calendarSourcesTable).where(eq(calendarSourcesTable.id, id)).run()
    return { ok: true }
  },

  importIcs(input: ImportCalendarSourceInput): CalendarSource {
    const filePath = input.file_path.trim()
    if (!filePath || path.extname(filePath).toLowerCase() !== '.ics') {
      throw new Error('Please choose a valid ICS file')
    }

    return this.createSource({
      label: input.label?.trim() || path.basename(filePath, path.extname(filePath)),
      kind: 'ics',
      source_value: filePath
    })
  },

  listEvents(sourceId?: string): CalendarEvent[] {
    const db = getDb()
    const rows = sourceId
      ? db
          .select()
          .from(calendarEventsTable)
          .where(eq(calendarEventsTable.source_id, sourceId))
          .orderBy(asc(calendarEventsTable.starts_at))
          .all()
      : db
          .select()
          .from(calendarEventsTable)
          .orderBy(asc(calendarEventsTable.starts_at))
          .all()

    return rows.map(deserializeEvent)
  }
}
