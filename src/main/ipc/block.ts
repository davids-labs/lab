import { ipcMain } from 'electron'
import type { Block, ReorderBlocksInput, UpsertBlockInput } from '../../preload/types'
import { blockQueries } from '../db/queries/blocks'

export function registerBlockHandlers(): void {
  ipcMain.handle(
    'block:list',
    async (_event, projectId: string): Promise<Block[]> => blockQueries.list(projectId)
  )
  ipcMain.handle(
    'block:upsert',
    async (_event, input: UpsertBlockInput): Promise<Block> => blockQueries.upsert(input)
  )
  ipcMain.handle(
    'block:delete',
    async (_event, id: string): Promise<{ ok: boolean }> => blockQueries.delete(id)
  )
  ipcMain.handle(
    'block:reorder',
    async (_event, input: ReorderBlocksInput): Promise<{ ok: boolean }> =>
      blockQueries.reorder(input)
  )
}
