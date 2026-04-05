import { create } from 'zustand'
import type { DashboardSummary } from '@preload/types'

interface DashboardStore {
  summary: DashboardSummary | null
  isLoading: boolean
  error: string | null
  loadSummary: () => Promise<void>
  importStarterTemplate: () => Promise<void>
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  async loadSummary() {
    set({ isLoading: true, error: null })

    try {
      const summary = await window.lab.dashboard.summary()
      set({ summary, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load dashboard summary.',
        isLoading: false
      })
    }
  },

  async importStarterTemplate() {
    set({ isLoading: true, error: null })

    try {
      await window.lab.dashboard.importStarterTemplate()
      const summary = await window.lab.dashboard.summary()
      set({ summary, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import starter template.',
        isLoading: false
      })
      throw error
    }
  }
}))
