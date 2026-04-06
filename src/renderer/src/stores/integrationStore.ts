import { create } from 'zustand'
import type {
  CreateIntegrationAccountInput,
  CreateWatchFolderInput,
  IntegrationAccount,
  SyncJob,
  UpdateIntegrationAccountInput,
  UpdateWatchFolderInput,
  WatchFolder
} from '@preload/types'

interface IntegrationStore {
  accounts: IntegrationAccount[]
  watchFolders: WatchFolder[]
  syncJobs: SyncJob[]
  isLoading: boolean
  error: string | null
  loadAll: () => Promise<void>
  createAccount: (input: CreateIntegrationAccountInput) => Promise<IntegrationAccount>
  updateAccount: (input: UpdateIntegrationAccountInput) => Promise<IntegrationAccount>
  deleteAccount: (id: string) => Promise<void>
  createWatchFolder: (input: CreateWatchFolderInput) => Promise<WatchFolder>
  updateWatchFolder: (input: UpdateWatchFolderInput) => Promise<WatchFolder>
  deleteWatchFolder: (id: string) => Promise<void>
  syncWatchFolder: (id: string) => Promise<SyncJob>
}

export const useIntegrationStore = create<IntegrationStore>((set, get) => ({
  accounts: [],
  watchFolders: [],
  syncJobs: [],
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
      set({ accounts, watchFolders, syncJobs, isLoading: false })
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
