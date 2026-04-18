import { create } from 'zustand'
import type { SaveState, SidebarTab } from '../../../preload/types'

interface UiStore {
  sidebarTab: SidebarTab
  blockPickerOpen: boolean
  insertAfterBlockId: string | null
  saveState: SaveState
  commandCenterFocusMode: boolean
  reducedChrome: boolean
  workspaceSidebarWidth: number
  workspacePreviewVisible: boolean
  workspacePreviewWidth: number
  pageCustomiserSidebarWidth: number
  setSidebarTab: (tab: SidebarTab) => void
  setWorkspaceSidebarWidth: (width: number) => void
  setWorkspacePreviewWidth: (width: number) => void
  setWorkspacePreviewVisible: (visible: boolean) => void
  toggleWorkspacePreview: () => void
  setCommandCenterFocusMode: (focused: boolean) => void
  toggleCommandCenterFocusMode: () => void
  setReducedChrome: (reduced: boolean) => void
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
  commandCenterFocusMode: false,
  reducedChrome: false,
  workspaceSidebarWidth: 300,
  workspacePreviewVisible: false,
  workspacePreviewWidth: 420,
  pageCustomiserSidebarWidth: 360,

  setSidebarTab(sidebarTab) {
    set({ sidebarTab })
  },

  setWorkspaceSidebarWidth(workspaceSidebarWidth) {
    set({ workspaceSidebarWidth })
  },

  setWorkspacePreviewWidth(workspacePreviewWidth) {
    set({ workspacePreviewWidth })
  },

  setWorkspacePreviewVisible(workspacePreviewVisible) {
    set({ workspacePreviewVisible })
  },

  toggleWorkspacePreview() {
    set((state) => ({ workspacePreviewVisible: !state.workspacePreviewVisible }))
  },

  setCommandCenterFocusMode(commandCenterFocusMode) {
    set({ commandCenterFocusMode })
  },

  toggleCommandCenterFocusMode() {
    set((state) => ({ commandCenterFocusMode: !state.commandCenterFocusMode }))
  },

  setReducedChrome(reducedChrome) {
    set({ reducedChrome })
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
