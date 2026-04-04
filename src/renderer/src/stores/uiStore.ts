import { create } from 'zustand'
import type { SaveState, SidebarTab } from '../../../preload/types'

interface UiStore {
  previewVisible: boolean
  sidebarTab: SidebarTab
  blockPickerOpen: boolean
  insertAfterBlockId: string | null
  saveState: SaveState
  setPreviewVisible: (visible: boolean) => void
  togglePreview: () => void
  setSidebarTab: (tab: SidebarTab) => void
  openBlockPicker: (afterBlockId?: string | null) => void
  closeBlockPicker: () => void
  setSaveState: (state: SaveState) => void
}

export const useUiStore = create<UiStore>((set) => ({
  previewVisible: true,
  sidebarTab: 'assets',
  blockPickerOpen: false,
  insertAfterBlockId: null,
  saveState: 'idle',

  setPreviewVisible(previewVisible) {
    set({ previewVisible })
  },

  togglePreview() {
    set((state) => ({ previewVisible: !state.previewVisible }))
  },

  setSidebarTab(sidebarTab) {
    set({ sidebarTab })
  },

  openBlockPicker(insertAfterBlockId = null) {
    set({ blockPickerOpen: true, insertAfterBlockId })
  },

  closeBlockPicker() {
    set({ blockPickerOpen: false, insertAfterBlockId: null })
  },

  setSaveState(saveState) {
    set({ saveState })
  }
}))
