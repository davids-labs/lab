import { ipcMain } from 'electron'
import type {
  CountdownItem,
  CreateCountdownInput,
  CreateOsHabitInput,
  CreateOsProfileInput,
  CreateWeeklyPriorityInput,
  OsDailyLog,
  OsHabit,
  OsHabitLog,
  OsProfile,
  OsTimeBlock,
  UpdateWeeklyPriorityInput,
  UpdateCountdownInput,
  UpdateOsHabitInput,
  UpdateOsProfileInput,
  UpsertWeeklyReviewInput,
  WeeklyPriority,
  WeeklyReview,
  UpsertOsDailyLogInput,
  UpsertOsHabitLogInput,
  UpsertOsTimeBlockInput
} from '../../preload/types'
import { osQueries } from '../db/queries/os'

export function registerOsHandlers(): void {
  ipcMain.handle('os:list-profiles', async (): Promise<OsProfile[]> => osQueries.listProfiles())
  ipcMain.handle(
    'os:create-profile',
    async (_event, input: CreateOsProfileInput): Promise<OsProfile> =>
      osQueries.createProfile(input)
  )
  ipcMain.handle(
    'os:update-profile',
    async (_event, input: UpdateOsProfileInput): Promise<OsProfile> =>
      osQueries.updateProfile(input)
  )
  ipcMain.handle(
    'os:delete-profile',
    async (_event, id: string): Promise<{ ok: boolean }> => osQueries.deleteProfile(id)
  )
  ipcMain.handle(
    'os:list-time-blocks',
    async (_event, profileId: string): Promise<OsTimeBlock[]> => osQueries.listTimeBlocks(profileId)
  )
  ipcMain.handle(
    'os:upsert-time-block',
    async (_event, input: UpsertOsTimeBlockInput): Promise<OsTimeBlock> =>
      osQueries.upsertTimeBlock(input)
  )
  ipcMain.handle(
    'os:delete-time-block',
    async (_event, id: string): Promise<{ ok: boolean }> => osQueries.deleteTimeBlock(id)
  )
  ipcMain.handle('os:list-daily-logs', async (): Promise<OsDailyLog[]> => osQueries.listDailyLogs())
  ipcMain.handle(
    'os:get-daily-log',
    async (_event, date: string): Promise<OsDailyLog | null> => osQueries.getDailyLog(date)
  )
  ipcMain.handle(
    'os:upsert-daily-log',
    async (_event, input: UpsertOsDailyLogInput): Promise<OsDailyLog> =>
      osQueries.upsertDailyLog(input)
  )
  ipcMain.handle('os:list-habits', async (): Promise<OsHabit[]> => osQueries.listHabits())
  ipcMain.handle(
    'os:create-habit',
    async (_event, input: CreateOsHabitInput): Promise<OsHabit> => osQueries.createHabit(input)
  )
  ipcMain.handle(
    'os:update-habit',
    async (_event, input: UpdateOsHabitInput): Promise<OsHabit> => osQueries.updateHabit(input)
  )
  ipcMain.handle(
    'os:delete-habit',
    async (_event, id: string): Promise<{ ok: boolean }> => osQueries.deleteHabit(id)
  )
  ipcMain.handle('os:list-habit-logs', async (): Promise<OsHabitLog[]> => osQueries.listHabitLogs())
  ipcMain.handle(
    'os:upsert-habit-log',
    async (_event, input: UpsertOsHabitLogInput): Promise<OsHabitLog> =>
      osQueries.upsertHabitLog(input)
  )
  ipcMain.handle(
    'os:list-countdowns',
    async (): Promise<CountdownItem[]> => osQueries.listCountdowns()
  )
  ipcMain.handle(
    'os:create-countdown',
    async (_event, input: CreateCountdownInput): Promise<CountdownItem> =>
      osQueries.createCountdown(input)
  )
  ipcMain.handle(
    'os:update-countdown',
    async (_event, input: UpdateCountdownInput): Promise<CountdownItem> =>
      osQueries.updateCountdown(input)
  )
  ipcMain.handle(
    'os:delete-countdown',
    async (_event, id: string): Promise<{ ok: boolean }> => osQueries.deleteCountdown(id)
  )
  ipcMain.handle(
    'os:list-weekly-priorities',
    async (_event, weekKey?: string): Promise<WeeklyPriority[]> =>
      osQueries.listWeeklyPriorities(weekKey)
  )
  ipcMain.handle(
    'os:create-weekly-priority',
    async (_event, input: CreateWeeklyPriorityInput): Promise<WeeklyPriority> =>
      osQueries.createWeeklyPriority(input)
  )
  ipcMain.handle(
    'os:update-weekly-priority',
    async (_event, input: UpdateWeeklyPriorityInput): Promise<WeeklyPriority> =>
      osQueries.updateWeeklyPriority(input)
  )
  ipcMain.handle(
    'os:delete-weekly-priority',
    async (_event, id: string): Promise<{ ok: boolean }> => osQueries.deleteWeeklyPriority(id)
  )
  ipcMain.handle(
    'os:get-weekly-review',
    async (_event, weekKey: string): Promise<WeeklyReview | null> =>
      osQueries.getWeeklyReview(weekKey)
  )
  ipcMain.handle(
    'os:upsert-weekly-review',
    async (_event, input: UpsertWeeklyReviewInput): Promise<WeeklyReview> =>
      osQueries.upsertWeeklyReview(input)
  )
}
