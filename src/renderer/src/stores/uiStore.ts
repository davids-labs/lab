import { create } from 'zustand'
import type { SaveState, SidebarTab } from '../../../preload/types'

interface UiStore {
  sidebarTab: SidebarTab
  blockPickerOpen: boolean
  insertAfterBlockId: string | null
  saveState: SaveState
  workspaceSidebarWidth: number
  pageCustomiserSidebarWidth: number
  setSidebarTab: (tab: SidebarTab) => void
  setWorkspaceSidebarWidth: (width: number) => void
  setPageCustomiserSidebarWidth: (width: number) => void
  openBlockPicker: (afterBlockId?: string | null) => void
  closeBlockPicker: () => void
  setSaveState: (state: SaveState) => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarTab: 'assets',
  blockPickerOpen: false,
  insertAfterBlockId: null,
  saveState: 'idle',
  workspaceSidebarWidth: 300,
  pageCustomiserSidebarWidth: 360,

  setSidebarTab(sidebarTab) {
    set({ sidebarTab })
  },

  setWorkspaceSidebarWidth(workspaceSidebarWidth) {
    set({ workspaceSidebarWidth })
  },

  setPageCustomiserSidebarWidth(pageCustomiserSidebarWidth) {
    set({ pageCustomiserSidebarWidth })
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
