import { ipcMain } from 'electron'
import type { Block, ReorderBlocksInput, UpsertBlockInput } from '../../preload/types'
import { blockQueries } from '../db/queries/blocks'
import { scheduleProjectAutoCommit } from '../services/gitSync'

export function registerBlockHandlers(): void {
  ipcMain.handle(
    'block:list',
    async (_event, projectId: string): Promise<Block[]> => blockQueries.list(projectId)
  )
  ipcMain.handle('block:upsert', async (_event, input: UpsertBlockInput): Promise<Block> => {
    const block = blockQueries.upsert(input)
    scheduleProjectAutoCommit(block.project_id)
    return block
  })
  ipcMain.handle('block:delete', async (_event, id: string): Promise<{ ok: boolean }> => {
    const projectId = blockQueries.get(id).project_id
    const result = blockQueries.delete(id)
    scheduleProjectAutoCommit(projectId)
    return result
  })
  ipcMain.handle(
    'block:reorder',
    async (_event, input: ReorderBlocksInput): Promise<{ ok: boolean }> => {
      const result = blockQueries.reorder(input)
      scheduleProjectAutoCommit(input.projectId)
      return result
    }
  )
}
