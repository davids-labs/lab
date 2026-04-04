import { create } from 'zustand'
import type { Asset } from '../../../preload/types'

interface AssetStore {
  assets: Asset[]
  isLoading: boolean
  error: string | null
  loadAssets: (projectId: string) => Promise<void>
  importAsset: (projectId: string, srcPath: string, tags?: string[]) => Promise<Asset>
  deleteAsset: (id: string) => Promise<void>
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  isLoading: false,
  error: null,

  async loadAssets(projectId) {
    set({ isLoading: true, error: null })

    try {
      const assets = await window.lab.asset.list(projectId)
      set({ assets, isLoading: false })
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  async importAsset(projectId, srcPath, tags) {
    const asset = await window.lab.asset.import({ projectId, srcPath, tags })
    set((state) => ({ assets: [asset, ...state.assets] }))
    return asset
  },

  async deleteAsset(id) {
    await window.lab.asset.delete(id)
    set((state) => ({ assets: state.assets.filter((asset) => asset.id !== id) }))
  }
}))
