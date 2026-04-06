import { ipcMain } from 'electron'
import type {
  CreateInboxEntryInput,
  InboxEntry,
  TriageInboxEntryInput,
  UpdateInboxEntryInput
} from '../../preload/types'
import { captureQueries } from '../db/queries/capture'

export function registerCaptureHandlers(): void {
  ipcMain.handle('capture:list', async (_event, status?: InboxEntry['status']): Promise<InboxEntry[]> =>
    captureQueries.list(status)
  )
  ipcMain.handle(
    'capture:create',
    async (_event, input: CreateInboxEntryInput): Promise<InboxEntry> => captureQueries.create(input)
  )
  ipcMain.handle(
    'capture:update',
    async (_event, input: UpdateInboxEntryInput): Promise<InboxEntry> => captureQueries.update(input)
  )
  ipcMain.handle(
    'capture:triage',
    async (_event, input: TriageInboxEntryInput): Promise<InboxEntry> => captureQueries.triage(input)
  )
  ipcMain.handle(
    'capture:delete',
    async (_event, id: string): Promise<{ ok: boolean }> => captureQueries.delete(id)
  )
}
