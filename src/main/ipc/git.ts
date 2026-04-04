import { ipcMain } from 'electron'
import type { GitCommitRecord } from '../../preload/types'

export function registerGitHandlers(): void {
  ipcMain.handle('git:init', async (): Promise<{ ok: boolean }> => ({ ok: false }))
  ipcMain.handle('git:commit', async (): Promise<{ hash: string }> => ({ hash: '' }))
  ipcMain.handle('git:log', async (): Promise<GitCommitRecord[]> => [])
  ipcMain.handle('git:push', async (): Promise<{ ok: boolean }> => ({ ok: false }))
  ipcMain.handle('git:restore', async (): Promise<{ ok: boolean }> => ({ ok: false }))
  ipcMain.handle('git:set-remote', async (): Promise<{ ok: boolean }> => ({ ok: false }))
}
