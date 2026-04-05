import { create } from 'zustand'
import type {
  CreatePlanLinkInput,
  CreatePlanNodeInput,
  PlanNode,
  PlanNodeDetail,
  PlanNodeLink,
  UpdatePlanNodeInput
} from '@preload/types'

interface PlanStore {
  nodes: PlanNode[]
  selectedNodeId: string | null
  selectedNodeDetail: PlanNodeDetail | null
  links: PlanNodeLink[]
  isLoading: boolean
  error: string | null
  loadNodes: () => Promise<void>
  selectNode: (id: string | null) => Promise<void>
  createNode: (input: CreatePlanNodeInput) => Promise<PlanNode>
  updateNode: (input: UpdatePlanNodeInput) => Promise<PlanNode>
  deleteNode: (id: string) => Promise<void>
  createLink: (input: CreatePlanLinkInput) => Promise<PlanNodeLink>
  deleteLink: (id: string) => Promise<void>
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  selectedNodeDetail: null,
  links: [],
  isLoading: false,
  error: null,

  async loadNodes() {
    set({ isLoading: true, error: null })

    try {
      const [nodes, links] = await Promise.all([window.lab.plan.listNodes(), window.lab.plan.listLinks()])
      set({ nodes, links, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load roadmap.',
        isLoading: false
      })
    }
  },

  async selectNode(id) {
    set({ selectedNodeId: id, error: null })

    if (!id) {
      set({ selectedNodeDetail: null })
      return
    }

    try {
      const detail = await window.lab.plan.getNode(id)
      set({ selectedNodeDetail: detail })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load roadmap detail.'
      })
    }
  },

  async createNode(input) {
    const node = await window.lab.plan.createNode(input)
    await get().loadNodes()
    if (get().selectedNodeId === input.parent_id || !get().selectedNodeId) {
      await get().selectNode(node.id)
    }
    return node
  },

  async updateNode(input) {
    const node = await window.lab.plan.updateNode(input)
    await get().loadNodes()
    if (get().selectedNodeId === node.id) {
      await get().selectNode(node.id)
    }
    return node
  },

  async deleteNode(id) {
    await window.lab.plan.deleteNode(id)
    const selectedNodeId = get().selectedNodeId
    await get().loadNodes()
    if (selectedNodeId === id) {
      set({ selectedNodeId: null, selectedNodeDetail: null })
    }
  },

  async createLink(input) {
    const link = await window.lab.plan.createLink(input)
    await get().loadNodes()
    if (get().selectedNodeId === input.node_id) {
      await get().selectNode(input.node_id)
    }
    return link
  },

  async deleteLink(id) {
    const selected = get().selectedNodeId
    await window.lab.plan.deleteLink(id)
    await get().loadNodes()
    if (selected) {
      await get().selectNode(selected)
    }
  }
}))
