import type { OsHabit, OsHabitLog } from '../preload/types'

export type HabitStreakUnit = 'day' | 'week'

export interface HabitProgressSummary {
  currentPeriodCompleted: boolean
  currentPeriodLogDate: string | null
  currentStreak: number
  streakUnit: HabitStreakUnit
  periodLabel: 'today' | 'this week'
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function getTodayDate(date = new Date()): string {
  return toIsoDate(date)
}

export function getWeekKey(value: string | Date): string {
  const date =
    typeof value === 'string'
      ? new Date(`${value}T00:00:00.000Z`)
      : new Date(`${toIsoDate(value)}T00:00:00.000Z`)
  const day = date.getUTCDay()
  const delta = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + delta)
  return toIsoDate(date)
}

function getCompletedDates(logs: OsHabitLog[]): string[] {
  return logs
    .filter((log) => log.completed)
    .map((log) => log.date)
    .sort((left, right) => left.localeCompare(right))
}

function getDailyProgress(logs: OsHabitLog[], today: string): HabitProgressSummary {
  const completedDates = new Set(getCompletedDates(logs))
  const currentPeriodCompleted = completedDates.has(today)
  let currentStreak = 0

  if (currentPeriodCompleted) {
    const cursor = new Date(`${today}T00:00:00.000Z`)

    while (completedDates.has(toIsoDate(cursor))) {
      currentStreak += 1
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    }
  }

  return {
    currentPeriodCompleted,
    currentPeriodLogDate: currentPeriodCompleted ? today : null,
    currentStreak,
    streakUnit: 'day',
    periodLabel: 'today'
  }
}

function getWeeklyProgress(logs: OsHabitLog[], today: string): HabitProgressSummary {
  const completedLogs = logs
    .filter((log) => log.completed)
    .sort((left, right) => left.date.localeCompare(right.date))
  const currentWeekKey = getWeekKey(today)
  const currentWeekLogs = completedLogs.filter((log) => getWeekKey(log.date) === currentWeekKey)
  const completedWeekKeys = new Set(currentWeekLogs.map((log) => getWeekKey(log.date)))

  completedLogs.forEach((log) => {
    completedWeekKeys.add(getWeekKey(log.date))
  })

  const currentPeriodCompleted = currentWeekLogs.length > 0
  let currentStreak = 0

  if (currentPeriodCompleted) {
    const cursor = new Date(`${currentWeekKey}T00:00:00.000Z`)

    while (completedWeekKeys.has(toIsoDate(cursor))) {
      currentStreak += 1
      cursor.setUTCDate(cursor.getUTCDate() - 7)
    }
  }

  return {
    currentPeriodCompleted,
    currentPeriodLogDate:
      currentWeekLogs.length > 0 ? currentWeekLogs[currentWeekLogs.length - 1].date : null,
    currentStreak,
    streakUnit: 'week',
    periodLabel: 'this week'
  }
}

export function getHabitProgress(
  habit: Pick<OsHabit, 'frequency'>,
  logs: OsHabitLog[],
  today = getTodayDate()
): HabitProgressSummary {
  if (habit.frequency === 'weekly') {
    return getWeeklyProgress(logs, today)
  }

  return getDailyProgress(logs, today)
}

export function buildHabitProgressById(
  habits: OsHabit[],
  logs: OsHabitLog[],
  today = getTodayDate()
): Record<string, HabitProgressSummary> {
  return Object.fromEntries(
    habits.map((habit) => [
      habit.id,
      getHabitProgress(
        habit,
        logs.filter((log) => log.habit_id === habit.id),
        today
      )
    ])
  )
}
