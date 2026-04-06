import { create } from 'zustand'
import type {
  ContextPack,
  ExportBundle,
  GenerateContextPackInput,
  SaveContextPackInput
} from '@preload/types'

interface ExportStore {
  bundles: ExportBundle[]
  lastPack: ContextPack | null
  isLoading: boolean
  error: string | null
  loadBundles: () => Promise<void>
  generatePack: (input: GenerateContextPackInput) => Promise<ContextPack>
  savePack: (input: SaveContextPackInput) => Promise<{ ok: boolean; path?: string }>
}

export const useExportStore = create<ExportStore>((set, get) => ({
  bundles: [],
  lastPack: null,
  isLoading: false,
  error: null,

  async loadBundles() {
    set({ isLoading: true, error: null })
    try {
      const bundles = await window.lab.exports.listBundles()
      set({ bundles, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load export bundles.',
        isLoading: false
      })
    }
  },

  async generatePack(input) {
    const lastPack = await window.lab.exports.generateContextPack(input)
    set({ lastPack })
    await get().loadBundles()
    return lastPack
  },

  async savePack(input) {
    const result = await window.lab.exports.saveContextPack(input)
    await get().loadBundles()
    return result
  }
}))
