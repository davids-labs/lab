import { create } from 'zustand'
import type {
  CreateIntegrationAccountInput,
  CreateWatchFolderInput,
  GitHubCliStatus,
  IntegrationAccount,
  SyncGitHubReposInput,
  SyncJob,
  UpdateIntegrationAccountInput,
  UpdateWatchFolderInput,
  WatchFolder
} from '@preload/types'

interface IntegrationStore {
  accounts: IntegrationAccount[]
  watchFolders: WatchFolder[]
  syncJobs: SyncJob[]
  githubCliStatus: GitHubCliStatus | null
  isLoading: boolean
  error: string | null
  loadAll: () => Promise<void>
  createAccount: (input: CreateIntegrationAccountInput) => Promise<IntegrationAccount>
  updateAccount: (input: UpdateIntegrationAccountInput) => Promise<IntegrationAccount>
  deleteAccount: (id: string) => Promise<void>
  loadGitHubCliStatus: () => Promise<void>
  syncGitHubRepos: (input?: SyncGitHubReposInput) => Promise<SyncJob>
  connectGoogleCalendar: (clientId?: string) => Promise<void>
  syncGoogleCalendar: (accountId?: string) => Promise<SyncJob>
  disconnectGoogleCalendar: (accountId: string) => Promise<void>
  createWatchFolder: (input: CreateWatchFolderInput) => Promise<WatchFolder>
  updateWatchFolder: (input: UpdateWatchFolderInput) => Promise<WatchFolder>
  deleteWatchFolder: (id: string) => Promise<void>
  syncWatchFolder: (id: string) => Promise<SyncJob>
}

export const useIntegrationStore = create<IntegrationStore>((set, get) => ({
  accounts: [],
  watchFolders: [],
  syncJobs: [],
  githubCliStatus: null,
  isLoading: false,
  error: null,

  async loadAll() {
    set({ isLoading: true, error: null })
    try {
      const [accounts, watchFolders, syncJobs] = await Promise.all([
        window.lab.integrations.listAccounts(),
        window.lab.integrations.listWatchFolders(),
        window.lab.integrations.listSyncJobs()
      ])
      const githubCliStatus = await window.lab.integrations.getGitHubCliStatus()
      set({ accounts, watchFolders, syncJobs, githubCliStatus, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load integrations.',
        isLoading: false
      })
    }
  },

  async createAccount(input) {
    const account = await window.lab.integrations.createAccount(input)
    await get().loadAll()
    return account
  },

  async updateAccount(input) {
    const account = await window.lab.integrations.updateAccount(input)
    await get().loadAll()
    return account
  },

  async deleteAccount(id) {
    await window.lab.integrations.deleteAccount(id)
    await get().loadAll()
  },

  async loadGitHubCliStatus() {
    const githubCliStatus = await window.lab.integrations.getGitHubCliStatus()
    set({ githubCliStatus })
  },

  async syncGitHubRepos(input) {
    const job = await window.lab.integrations.syncGitHubRepos(input)
    await get().loadAll()
    return job
  },

  async connectGoogleCalendar(clientId) {
    await window.lab.integrations.connectGoogleCalendar(clientId)
    await get().loadAll()
  },

  async syncGoogleCalendar(accountId) {
    const job = await window.lab.integrations.syncGoogleCalendar(accountId)
    await get().loadAll()
    return job
  },

  async disconnectGoogleCalendar(accountId) {
    await window.lab.integrations.disconnectGoogleCalendar(accountId)
    await get().loadAll()
  },

  async createWatchFolder(input) {
    const folder = await window.lab.integrations.createWatchFolder(input)
    await get().loadAll()
    return folder
  },

  async updateWatchFolder(input) {
    const folder = await window.lab.integrations.updateWatchFolder(input)
    await get().loadAll()
    return folder
  },

  async deleteWatchFolder(id) {
    await window.lab.integrations.deleteWatchFolder(id)
    await get().loadAll()
  },

  async syncWatchFolder(id) {
    const job = await window.lab.integrations.syncWatchFolder(id)
    await get().loadAll()
    return job
  }
}))
