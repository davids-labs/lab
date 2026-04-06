import { ipcMain } from 'electron'
import type {
  CreateReviewSessionInput,
  ReviewSession,
  UpdateReviewSessionInput,
  WeeklyReset
} from '../../preload/types'
import { reviewQueries } from '../db/queries/review'

export function registerReviewHandlers(): void {
  ipcMain.handle('review:list-sessions', async (): Promise<ReviewSession[]> =>
    reviewQueries.listSessions()
  )
  ipcMain.handle(
    'review:create-session',
    async (_event, input: CreateReviewSessionInput): Promise<ReviewSession> =>
      reviewQueries.createSession(input)
  )
  ipcMain.handle(
    'review:update-session',
    async (_event, input: UpdateReviewSessionInput): Promise<ReviewSession> =>
      reviewQueries.updateSession(input)
  )
  ipcMain.handle(
    'review:get-weekly-reset',
    async (_event, weekKey: string): Promise<WeeklyReset> => reviewQueries.getWeeklyReset(weekKey)
  )
}
