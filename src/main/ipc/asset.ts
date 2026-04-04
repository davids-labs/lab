import { ipcMain } from 'electron'
import type { Asset, AssetImportInput } from '../../preload/types'
import { assetQueries } from '../db/queries/assets'

export function registerAssetHandlers(): void {
  ipcMain.handle('asset:import', async (_event, input: AssetImportInput): Promise<Asset> =>
    assetQueries.import(input)
  )
  ipcMain.handle('asset:list', async (_event, projectId: string): Promise<Asset[]> =>
    assetQueries.list(projectId)
  )
  ipcMain.handle('asset:delete', async (_event, id: string): Promise<{ ok: boolean }> =>
    assetQueries.delete(id)
  )
  ipcMain.handle('asset:get-data-uri', async (_event, id: string): Promise<string> =>
    assetQueries.getDataUri(id)
  )
}
