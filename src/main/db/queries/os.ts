import { asc, desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CountdownItem,
  CreateCountdownInput,
  CreateOsHabitInput,
  CreateOsProfileInput,
  OsDailyLog,
  OsHabit,
  OsHabitLog,
  OsProfile,
  OsTimeBlock,
  UpdateCountdownInput,
  UpdateOsHabitInput,
  UpdateOsProfileInput,
  UpsertOsDailyLogInput,
  UpsertOsHabitLogInput,
  UpsertOsTimeBlockInput
} from '../../../preload/types'
import {
  validateCreateCountdownInput,
  validateCreateOsHabitInput,
  validateCreateOsProfileInput,
  validateUpdateCountdownInput,
  validateUpdateOsHabitInput,
  validateUpdateOsProfileInput,
  validateUpsertOsDailyLogInput,
  validateUpsertOsHabitLogInput,
  validateUpsertOsTimeBlockInput
} from '@shared/commandValidation'
import { getDb } from '../index'
import {
  countdownItemsTable,
  osDailyLogsTable,
  osHabitLogsTable,
  osHabitsTable,
  osProfilesTable,
  osTimeBlocksTable,
  type CountdownItemRow,
  type OsDailyLogRow,
  type OsHabitLogRow,
  type OsHabitRow,
  type OsProfileRow,
  type OsTimeBlockRow
} from '../schema'

function deserializeProfile(row: OsProfileRow): OsProfile {
  return {
    ...row,
    is_default: Boolean(row.is_default)
  }
}

function deserializeTimeBlock(row: OsTimeBlockRow): OsTimeBlock {
  return row
}

function deserializeDailyLog(row: OsDailyLogRow): OsDailyLog {
  return {
    ...row,
    profile_id: row.profile_id ?? null,
    notes: row.notes ?? null,
    gym_done: Boolean(row.gym_done)
  }
}

function deserializeHabit(row: OsHabitRow): OsHabit {
  return {
    ...row,
    description: row.description ?? null,
    frequency: row.frequency as OsHabit['frequency']
  }
}

function deserializeHabitLog(row: OsHabitLogRow): OsHabitLog {
  return {
    ...row,
    completed: Boolean(row.completed),
    notes: row.notes ?? null
  }
}

function deserializeCountdown(row: CountdownItemRow): CountdownItem {
  return {
    ...row,
    notes: row.notes ?? null
  }
}

function nextSortOrder(entries: Array<{ sort_order: number }>): number {
  if (entries.length === 0) {
    return 0
  }

  return Math.max(...entries.map((entry) => entry.sort_order)) + 1
}

function clearDefaultProfiles(exceptId?: string): void {
  const db = getDb()
  if (exceptId) {
    db.update(osProfilesTable)
      .set({ is_default: false, updated_at: Date.now() })
      .where(eq(osProfilesTable.is_default, true))
      .run()
    db.update(osProfilesTable)
      .set({ is_default: true, updated_at: Date.now() })
      .where(eq(osProfilesTable.id, exceptId))
      .run()
    return
  }

  db.update(osProfilesTable)
    .set({ is_default: false, updated_at: Date.now() })
    .where(eq(osProfilesTable.is_default, true))
    .run()
}

export const osQueries = {
  listProfiles(): OsProfile[] {
    const db = getDb()
    return db.select().from(osProfilesTable).orderBy(desc(osProfilesTable.is_default), asc(osProfilesTable.name)).all().map(deserializeProfile)
  },

  getDefaultProfile(): OsProfile | null {
    return this.listProfiles().find((profile) => profile.is_default) ?? null
  },

  createProfile(input: CreateOsProfileInput): OsProfile {
    const db = getDb()
    const parsed = validateCreateOsProfileInput(input)
    const now = Date.now()
    const id = ulid()
    const hasProfiles = this.listProfiles().length > 0
    const isDefault = parsed.is_default ?? !hasProfiles

    db.insert(osProfilesTable)
      .values({
        id,
        name: parsed.name,
        is_default: isDefault,
        created_at: now,
        updated_at: now
      })
      .run()

    if (isDefault) {
      clearDefaultProfiles(id)
    }

    return deserializeProfile(db.select().from(osProfilesTable).where(eq(osProfilesTable.id, id)).get()!)
  },

  updateProfile(input: UpdateOsProfileInput): OsProfile {
    const db = getDb()
    const parsed = validateUpdateOsProfileInput(input)
    const current = db.select().from(osProfilesTable).where(eq(osProfilesTable.id, parsed.id)).get()

    if (!current) {
      throw new Error('Profile not found')
    }

    db.update(osProfilesTable)
      .set({
        name: parsed.name ?? current.name,
        is_default: parsed.is_default ?? current.is_default,
        updated_at: Date.now()
      })
      .where(eq(osProfilesTable.id, parsed.id))
      .run()

    if (parsed.is_default) {
      clearDefaultProfiles(parsed.id)
    }

    return deserializeProfile(db.select().from(osProfilesTable).where(eq(osProfilesTable.id, parsed.id)).get()!)
  },

  deleteProfile(id: string): { ok: boolean } {
    const db = getDb()
    const current = db.select().from(osProfilesTable).where(eq(osProfilesTable.id, id)).get()
    db.delete(osProfilesTable).where(eq(osProfilesTable.id, id)).run()

    if (current?.is_default) {
      const next = this.listProfiles()[0]
      if (next) {
        clearDefaultProfiles(next.id)
      }
    }

    return { ok: true }
  },

  listTimeBlocks(profileId: string): OsTimeBlock[] {
    const db = getDb()
    return db
      .select()
      .from(osTimeBlocksTable)
      .where(eq(osTimeBlocksTable.profile_id, profileId))
      .orderBy(asc(osTimeBlocksTable.sort_order))
      .all()
      .map(deserializeTimeBlock)
  },

  upsertTimeBlock(input: UpsertOsTimeBlockInput): OsTimeBlock {
    const db = getDb()
    const parsed = validateUpsertOsTimeBlockInput(input)
    const now = Date.now()

    if (parsed.id) {
      const current = db.select().from(osTimeBlocksTable).where(eq(osTimeBlocksTable.id, parsed.id)).get()

      if (!current) {
        throw new Error('Time block not found')
      }

      db.update(osTimeBlocksTable)
        .set({
          profile_id: parsed.profile_id,
          label: parsed.label,
          hours: parsed.hours,
          color: parsed.color,
          sort_order: parsed.sort_order ?? current.sort_order,
          updated_at: now
        })
        .where(eq(osTimeBlocksTable.id, parsed.id))
        .run()

      return deserializeTimeBlock(
        db.select().from(osTimeBlocksTable).where(eq(osTimeBlocksTable.id, parsed.id)).get()!
      )
    }

    const id = ulid()
    const existing = this.listTimeBlocks(parsed.profile_id)
    db.insert(osTimeBlocksTable)
      .values({
        id,
        profile_id: parsed.profile_id,
        label: parsed.label,
        hours: parsed.hours,
        color: parsed.color,
        sort_order: parsed.sort_order ?? nextSortOrder(existing),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeTimeBlock(
      db.select().from(osTimeBlocksTable).where(eq(osTimeBlocksTable.id, id)).get()!
    )
  },

  deleteTimeBlock(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(osTimeBlocksTable).where(eq(osTimeBlocksTable.id, id)).run()
    return { ok: true }
  },

  listDailyLogs(): OsDailyLog[] {
    const db = getDb()
    return db
      .select()
      .from(osDailyLogsTable)
      .orderBy(desc(osDailyLogsTable.date))
      .all()
      .map(deserializeDailyLog)
  },

  getDailyLog(date: string): OsDailyLog | null {
    const db = getDb()
    const row = db.select().from(osDailyLogsTable).where(eq(osDailyLogsTable.date, date)).get()
    return row ? deserializeDailyLog(row) : null
  },

  upsertDailyLog(input: UpsertOsDailyLogInput): OsDailyLog {
    const db = getDb()
    const parsed = validateUpsertOsDailyLogInput(input)
    const now = Date.now()
    const current = db.select().from(osDailyLogsTable).where(eq(osDailyLogsTable.date, parsed.date)).get()

    if (current) {
      db.update(osDailyLogsTable)
        .set({
          profile_id: parsed.profile_id === undefined ? current.profile_id : parsed.profile_id,
          sleep_hours: parsed.sleep_hours ?? current.sleep_hours,
          calories: parsed.calories ?? current.calories,
          protein_grams: parsed.protein_grams ?? current.protein_grams,
          water_litres: parsed.water_litres ?? current.water_litres,
          deep_work_minutes: parsed.deep_work_minutes ?? current.deep_work_minutes,
          gym_done: parsed.gym_done ?? current.gym_done,
          notes: parsed.notes === undefined ? current.notes : parsed.notes,
          updated_at: now
        })
        .where(eq(osDailyLogsTable.id, current.id))
        .run()

      return deserializeDailyLog(
        db.select().from(osDailyLogsTable).where(eq(osDailyLogsTable.id, current.id)).get()!
      )
    }

    const id = parsed.id ?? ulid()
    db.insert(osDailyLogsTable)
      .values({
        id,
        date: parsed.date,
        profile_id: parsed.profile_id ?? null,
        sleep_hours: parsed.sleep_hours ?? 0,
        calories: parsed.calories ?? 0,
        protein_grams: parsed.protein_grams ?? 0,
        water_litres: parsed.water_litres ?? 0,
        deep_work_minutes: parsed.deep_work_minutes ?? 0,
        gym_done: parsed.gym_done ?? false,
        notes: parsed.notes ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeDailyLog(db.select().from(osDailyLogsTable).where(eq(osDailyLogsTable.id, id)).get()!)
  },

  listHabits(): OsHabit[] {
    const db = getDb()
    return db.select().from(osHabitsTable).orderBy(asc(osHabitsTable.sort_order)).all().map(deserializeHabit)
  },

  createHabit(input: CreateOsHabitInput): OsHabit {
    const db = getDb()
    const parsed = validateCreateOsHabitInput(input)
    const now = Date.now()
    const id = ulid()
    const existing = this.listHabits()

    db.insert(osHabitsTable)
      .values({
        id,
        name: parsed.name,
        description: parsed.description ?? null,
        frequency: parsed.frequency ?? 'daily',
        target_count: parsed.target_count ?? 1,
        sort_order: parsed.sort_order ?? nextSortOrder(existing),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeHabit(db.select().from(osHabitsTable).where(eq(osHabitsTable.id, id)).get()!)
  },

  updateHabit(input: UpdateOsHabitInput): OsHabit {
    const db = getDb()
    const parsed = validateUpdateOsHabitInput(input)
    const current = db.select().from(osHabitsTable).where(eq(osHabitsTable.id, parsed.id)).get()

    if (!current) {
      throw new Error('Habit not found')
    }

    db.update(osHabitsTable)
      .set({
        name: parsed.name ?? current.name,
        description: parsed.description === undefined ? current.description : parsed.description,
        frequency: parsed.frequency ?? current.frequency,
        target_count: parsed.target_count ?? current.target_count,
        sort_order: parsed.sort_order ?? current.sort_order,
        updated_at: Date.now()
      })
      .where(eq(osHabitsTable.id, parsed.id))
      .run()

    return deserializeHabit(db.select().from(osHabitsTable).where(eq(osHabitsTable.id, parsed.id)).get()!)
  },

  deleteHabit(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(osHabitsTable).where(eq(osHabitsTable.id, id)).run()
    return { ok: true }
  },

  upsertHabitLog(input: UpsertOsHabitLogInput): OsHabitLog {
    const db = getDb()
    const parsed = validateUpsertOsHabitLogInput(input)
    const now = Date.now()
    const current = db
      .select()
      .from(osHabitLogsTable)
      .where(eq(osHabitLogsTable.habit_id, parsed.habit_id))
      .all()
      .find((entry) => entry.date === parsed.date)

    if (current) {
      db.update(osHabitLogsTable)
        .set({
          completed: parsed.completed,
          notes: parsed.notes ?? null,
          updated_at: now
        })
        .where(eq(osHabitLogsTable.id, current.id))
        .run()

      return deserializeHabitLog(
        db.select().from(osHabitLogsTable).where(eq(osHabitLogsTable.id, current.id)).get()!
      )
    }

    const id = parsed.id ?? ulid()
    db.insert(osHabitLogsTable)
      .values({
        id,
        habit_id: parsed.habit_id,
        date: parsed.date,
        completed: parsed.completed,
        notes: parsed.notes ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeHabitLog(
      db.select().from(osHabitLogsTable).where(eq(osHabitLogsTable.id, id)).get()!
    )
  },

  getHabitLogsForDate(date: string): OsHabitLog[] {
    const db = getDb()
    return db
      .select()
      .from(osHabitLogsTable)
      .all()
      .filter((entry) => entry.date === date)
      .map(deserializeHabitLog)
  },

  listCountdowns(): CountdownItem[] {
    const db = getDb()
    return db
      .select()
      .from(countdownItemsTable)
      .orderBy(asc(countdownItemsTable.target_date))
      .all()
      .map(deserializeCountdown)
  },

  createCountdown(input: CreateCountdownInput): CountdownItem {
    const db = getDb()
    const parsed = validateCreateCountdownInput(input)
    const now = Date.now()
    const id = ulid()

    db.insert(countdownItemsTable)
      .values({
        id,
        title: parsed.title,
        target_date: parsed.target_date,
        category: parsed.category?.trim() || 'General',
        notes: parsed.notes ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeCountdown(
      db.select().from(countdownItemsTable).where(eq(countdownItemsTable.id, id)).get()!
    )
  },

  updateCountdown(input: UpdateCountdownInput): CountdownItem {
    const db = getDb()
    const parsed = validateUpdateCountdownInput(input)
    const current = db.select().from(countdownItemsTable).where(eq(countdownItemsTable.id, parsed.id)).get()

    if (!current) {
      throw new Error('Countdown not found')
    }

    db.update(countdownItemsTable)
      .set({
        title: parsed.title ?? current.title,
        target_date: parsed.target_date ?? current.target_date,
        category: parsed.category ?? current.category,
        notes: parsed.notes === undefined ? current.notes : parsed.notes,
        updated_at: Date.now()
      })
      .where(eq(countdownItemsTable.id, parsed.id))
      .run()

    return deserializeCountdown(
      db.select().from(countdownItemsTable).where(eq(countdownItemsTable.id, parsed.id)).get()!
    )
  },

  deleteCountdown(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(countdownItemsTable).where(eq(countdownItemsTable.id, id)).run()
    return { ok: true }
  }
}
