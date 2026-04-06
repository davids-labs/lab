import { ipcMain } from 'electron'
import type {
  ContextPack,
  ExportBundle,
  GenerateContextPackInput,
  SaveContextPackInput
} from '../../preload/types'
import { exportQueries } from '../db/queries/exports'

export function registerExportHandlers(): void {
  ipcMain.handle('exports:list-bundles', async (): Promise<ExportBundle[]> =>
    exportQueries.listBundles()
  )
  ipcMain.handle(
    'exports:generate-context-pack',
    async (_event, input: GenerateContextPackInput): Promise<ContextPack> =>
      exportQueries.generateContextPack(input)
  )
  ipcMain.handle(
    'exports:save-context-pack',
    async (_event, input: SaveContextPackInput): Promise<{ ok: boolean; path?: string }> =>
      exportQueries.saveContextPack(input)
  )
}
