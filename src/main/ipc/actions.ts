import { ipcMain } from 'electron'
import type { ActionItem, ActionStatus, CreateActionItemInput, UpdateActionItemInput } from '../../preload/types'
import { actionQueries } from '../db/queries/actions'

export function registerActionHandlers(): void {
  ipcMain.handle('actions:list', async (_event, status?: ActionStatus): Promise<ActionItem[]> =>
    actionQueries.list(status)
  )
  ipcMain.handle(
    'actions:create',
    async (_event, input: CreateActionItemInput): Promise<ActionItem> => actionQueries.create(input)
  )
  ipcMain.handle(
    'actions:update',
    async (_event, input: UpdateActionItemInput): Promise<ActionItem> => actionQueries.update(input)
  )
  ipcMain.handle(
    'actions:delete',
    async (_event, id: string): Promise<{ ok: boolean }> => actionQueries.delete(id)
  )
}
