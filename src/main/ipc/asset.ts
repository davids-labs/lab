import { ipcMain } from 'electron'
import type { Asset, AssetImportInput } from '../../preload/types'
import { assetQueries } from '../db/queries/assets'
import { scheduleProjectAutoCommit } from '../services/gitSync'

export function registerAssetHandlers(): void {
  ipcMain.handle('asset:import', async (_event, input: AssetImportInput): Promise<Asset> => {
    const asset = assetQueries.import(input)
    scheduleProjectAutoCommit(asset.project_id)
    return asset
  })
  ipcMain.handle(
    'asset:list',
    async (_event, projectId: string): Promise<Asset[]> => assetQueries.list(projectId)
  )
  ipcMain.handle('asset:delete', async (_event, id: string): Promise<{ ok: boolean }> => {
    const projectId = assetQueries.get(id).project_id
    const result = assetQueries.delete(id)
    scheduleProjectAutoCommit(projectId)
    return result
  })
  ipcMain.handle(
    'asset:get-data-uri',
    async (_event, id: string): Promise<string> => assetQueries.getDataUri(id)
  )
}
