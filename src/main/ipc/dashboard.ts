import { ipcMain } from 'electron'
import type { DashboardSummary } from '../../preload/types'
import { getDashboardSummary } from '../services/dashboard'
import { importStarterTemplate } from '../services/starterTemplate'

export function registerDashboardHandlers(): void {
  ipcMain.handle('dashboard:summary', async (): Promise<DashboardSummary> => getDashboardSummary())
  ipcMain.handle(
    'dashboard:import-starter-template',
    async (): Promise<{ ok: boolean }> => importStarterTemplate()
  )
}
