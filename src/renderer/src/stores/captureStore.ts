import { create } from 'zustand'
import type {
  CaptureStatus,
  CreateInboxEntryInput,
  InboxEntry,
  TriageInboxEntryInput,
  UpdateInboxEntryInput
} from '@preload/types'

interface CaptureStore {
  entries: InboxEntry[]
  isLoading: boolean
  error: string | null
  loadEntries: (status?: CaptureStatus) => Promise<void>
  createEntry: (input: CreateInboxEntryInput) => Promise<InboxEntry>
  updateEntry: (input: UpdateInboxEntryInput) => Promise<InboxEntry>
  triageEntry: (input: TriageInboxEntryInput) => Promise<InboxEntry>
  deleteEntry: (id: string) => Promise<void>
}

export const useCaptureStore = create<CaptureStore>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  async loadEntries(status) {
    set({ isLoading: true, error: null })
    try {
      const entries = await window.lab.capture.list(status)
      set({ entries, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load capture inbox.',
        isLoading: false
      })
    }
  },

  async createEntry(input) {
    const entry = await window.lab.capture.create(input)
    await get().loadEntries()
    return entry
  },

  async updateEntry(input) {
    const entry = await window.lab.capture.update(input)
    await get().loadEntries()
    return entry
  },

  async triageEntry(input) {
    const entry = await window.lab.capture.triage(input)
    await get().loadEntries()
    return entry
  },

  async deleteEntry(id) {
    await window.lab.capture.delete(id)
    await get().loadEntries()
  }
}))
