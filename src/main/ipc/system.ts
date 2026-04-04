import fs from 'node:fs'
import { dialog, ipcMain } from 'electron'
import type { OpenFilesOptions, SaveFileOptions } from '../../preload/types'
import { validateOpenFilesOptions, validateSaveFileOptions } from '@shared/validation'

export function registerSystemHandlers(): void {
  ipcMain.handle('system:open-files', async (_event, input?: OpenFilesOptions): Promise<string[]> => {
    const options = validateOpenFilesOptions(input)
    const result = await dialog.showOpenDialog({
      title: options.title,
      properties: options.properties ?? ['openFile'],
      filters: options.filters
    })

    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('system:save-file', async (_event, input?: SaveFileOptions): Promise<string | null> => {
    const options = validateSaveFileOptions(input)
    const result = await dialog.showSaveDialog({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters
    })

    return result.canceled ? null : result.filePath ?? null
  })

  ipcMain.handle('system:read-text-file', async (_event, filePath: string): Promise<string> =>
    fs.readFileSync(filePath, 'utf8')
  )
}
