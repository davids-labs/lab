import fs from 'node:fs'
import path from 'node:path'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import type { OpenFilesOptions, SaveFileOptions } from '../../preload/types'
import { validateOpenFilesOptions, validateSaveFileOptions } from '@shared/validation'
import { getProjectsDir, isPathInsideDirectory } from '../services/appPaths'

const allowedTextReads = new Set<string>()

function rememberReadablePaths(filePaths: string[]): void {
  for (const filePath of filePaths) {
    if (filePath) {
      allowedTextReads.add(path.resolve(filePath))
    }
  }

  if (allowedTextReads.size > 256) {
    const overflow = [...allowedTextReads].slice(0, allowedTextReads.size - 256)
    overflow.forEach((entry) => allowedTextReads.delete(entry))
  }
}

function canReadTextFile(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  return allowedTextReads.has(resolved) || isPathInsideDirectory(getProjectsDir(), resolved)
}

export function registerSystemHandlers(): void {
  ipcMain.handle(
    'system:open-files',
    async (_event, input?: OpenFilesOptions): Promise<string[]> => {
      const options = validateOpenFilesOptions(input)
      const result = await dialog.showOpenDialog({
        title: options.title,
        properties: options.properties ?? ['openFile'],
        filters: options.filters
      })

      if (result.canceled) {
        return []
      }

      rememberReadablePaths(result.filePaths)
      return result.filePaths
    }
  )

  ipcMain.handle(
    'system:save-file',
    async (_event, input?: SaveFileOptions): Promise<string | null> => {
      const options = validateSaveFileOptions(input)
      const result = await dialog.showSaveDialog({
        title: options.title,
        defaultPath: options.defaultPath,
        filters: options.filters
      })

      return result.canceled ? null : (result.filePath ?? null)
    }
  )

  ipcMain.handle(
    'system:read-text-file',
    async (_event, filePath: string): Promise<string> => {
      if (!canReadTextFile(filePath)) {
        throw new Error(
          'Refusing to read an arbitrary local file. Open the file through the picker first.'
        )
      }

      const resolved = path.resolve(filePath)
      const stat = fs.statSync(resolved)
      if (!stat.isFile()) {
        throw new Error('Selected path is not a file.')
      }

      return fs.readFileSync(resolved, 'utf8')
    }
  )

  ipcMain.handle('system:toggle-fullscreen', async (event): Promise<boolean> => {
    const window = BrowserWindow.fromWebContents(event.sender)

    if (!window) {
      return false
    }

    const next = !window.isFullScreen()
    window.setFullScreen(next)
    return next
  })

  ipcMain.handle('system:set-fullscreen', async (event, fullscreen: boolean): Promise<boolean> => {
    const window = BrowserWindow.fromWebContents(event.sender)

    if (!window) {
      return false
    }

    window.setFullScreen(fullscreen)
    return window.isFullScreen()
  })

  ipcMain.handle('system:is-fullscreen', async (event): Promise<boolean> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window?.isFullScreen() ?? false
  })
}
