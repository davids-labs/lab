import { create } from 'zustand'
import type {
  ActionItem,
  ActionStatus,
  CreateActionItemInput,
  UpdateActionItemInput
} from '@preload/types'

interface ActionStore {
  items: ActionItem[]
  isLoading: boolean
  error: string | null
  loadItems: (status?: ActionStatus) => Promise<void>
  createItem: (input: CreateActionItemInput) => Promise<ActionItem>
  updateItem: (input: UpdateActionItemInput) => Promise<ActionItem>
  deleteItem: (id: string) => Promise<void>
}

export const useActionStore = create<ActionStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  async loadItems(status) {
    set({ isLoading: true, error: null })
    try {
      const items = await window.lab.actions.list(status)
      set({ items, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load actions.',
        isLoading: false
      })
    }
  },

  async createItem(input) {
    const item = await window.lab.actions.create(input)
    await get().loadItems()
    return item
  },

  async updateItem(input) {
    const item = await window.lab.actions.update(input)
    await get().loadItems()
    return item
  },

  async deleteItem(id) {
    await window.lab.actions.delete(id)
    await get().loadItems()
  }
}))
