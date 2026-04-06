import { ipcMain } from 'electron'
import type {
  CreateIntegrationAccountInput,
  CreateWatchFolderInput,
  GitHubCliStatus,
  GoogleCalendarConnectionResult,
  IntegrationAccount,
  SyncGitHubReposInput,
  SyncJob,
  UpdateIntegrationAccountInput,
  UpdateWatchFolderInput,
  WatchFolder
} from '../../preload/types'
import { integrationQueries } from '../db/queries/integrations'

export function registerIntegrationHandlers(): void {
  ipcMain.handle('integrations:list-accounts', async (): Promise<IntegrationAccount[]> =>
    integrationQueries.listAccounts()
  )
  ipcMain.handle(
    'integrations:create-account',
    async (_event, input: CreateIntegrationAccountInput): Promise<IntegrationAccount> =>
      integrationQueries.createAccount(input)
  )
  ipcMain.handle(
    'integrations:update-account',
    async (_event, input: UpdateIntegrationAccountInput): Promise<IntegrationAccount> =>
      integrationQueries.updateAccount(input)
  )
  ipcMain.handle(
    'integrations:delete-account',
    async (_event, id: string): Promise<{ ok: boolean }> => integrationQueries.deleteAccount(id)
  )
  ipcMain.handle(
    'integrations:get-github-cli-status',
    async (): Promise<GitHubCliStatus> => integrationQueries.getGitHubCliStatus()
  )
  ipcMain.handle(
    'integrations:sync-github-repos',
    async (_event, input?: SyncGitHubReposInput): Promise<SyncJob> =>
      integrationQueries.syncGitHubRepos(input)
  )
  ipcMain.handle(
    'integrations:connect-google-calendar',
    async (_event, clientId?: string): Promise<GoogleCalendarConnectionResult> =>
      integrationQueries.connectGoogleCalendar(clientId)
  )
  ipcMain.handle(
    'integrations:sync-google-calendar',
    async (_event, accountId?: string): Promise<SyncJob> =>
      integrationQueries.syncGoogleCalendar(accountId)
  )
  ipcMain.handle(
    'integrations:disconnect-google-calendar',
    async (_event, accountId: string): Promise<{ ok: boolean }> =>
      integrationQueries.disconnectGoogleCalendar(accountId)
  )
  ipcMain.handle('integrations:list-watch-folders', async (): Promise<WatchFolder[]> =>
    integrationQueries.listWatchFolders()
  )
  ipcMain.handle(
    'integrations:create-watch-folder',
    async (_event, input: CreateWatchFolderInput): Promise<WatchFolder> =>
      integrationQueries.createWatchFolder(input)
  )
  ipcMain.handle(
    'integrations:update-watch-folder',
    async (_event, input: UpdateWatchFolderInput): Promise<WatchFolder> =>
      integrationQueries.updateWatchFolder(input)
  )
  ipcMain.handle(
    'integrations:delete-watch-folder',
    async (_event, id: string): Promise<{ ok: boolean }> => integrationQueries.deleteWatchFolder(id)
  )
  ipcMain.handle('integrations:list-sync-jobs', async (): Promise<SyncJob[]> =>
    integrationQueries.listSyncJobs()
  )
  ipcMain.handle(
    'integrations:sync-watch-folder',
    async (_event, id: string): Promise<SyncJob> => integrationQueries.syncWatchFolder(id)
  )
}
