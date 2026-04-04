import { create } from 'zustand'
import type { Block, ReorderBlocksInput, UpsertBlockInput } from '../../../preload/types'

interface BlockStore {
  blocks: Block[]
  activeBlockId: string | null
  isLoading: boolean
  error: string | null
  loadBlocks: (projectId: string) => Promise<void>
  setActiveBlock: (id: string | null) => void
  upsertBlock: (input: UpsertBlockInput) => Promise<Block>
  deleteBlock: (id: string) => Promise<void>
  reorderBlocks: (input: ReorderBlocksInput) => Promise<void>
  replaceBlocks: (blocks: Block[]) => void
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  blocks: [],
  activeBlockId: null,
  isLoading: false,
  error: null,

  async loadBlocks(projectId) {
    set({ isLoading: true, error: null })

    try {
      const blocks = await window.lab.block.list(projectId)
      set({ blocks, isLoading: false })
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  setActiveBlock(activeBlockId) {
    set({ activeBlockId })
  },

  async upsertBlock(input) {
    const block = await window.lab.block.upsert(input)
    set((state) => ({
      blocks: state.blocks.some((entry) => entry.id === block.id)
        ? state.blocks.map((entry) => (entry.id === block.id ? block : entry))
        : [...state.blocks, block].sort((left, right) => left.sort_order - right.sort_order)
    }))
    return block
  },

  async deleteBlock(id) {
    await window.lab.block.delete(id)
    set((state) => ({
      blocks: state.blocks.filter((block) => block.id !== id),
      activeBlockId: state.activeBlockId === id ? null : state.activeBlockId
    }))
  },

  async reorderBlocks(input) {
    await window.lab.block.reorder(input)
    const current = get().blocks
    const lookup = new Map(current.map((block) => [block.id, block]))
    const blocks = input.orderedIds
      .map((id, index) => {
        const block = lookup.get(id)
        return block ? { ...block, sort_order: index + 1 } : null
      })
      .filter((block): block is Block => Boolean(block))

    set({ blocks })
  },

  replaceBlocks(blocks) {
    set({ blocks })
  }
}))
