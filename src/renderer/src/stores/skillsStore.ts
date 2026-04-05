import { create } from 'zustand'
import type {
  CreateSkillDomainInput,
  CreateSkillEvidenceInput,
  CreateSkillNodeInput,
  SkillDomain,
  SkillDomainSummary,
  SkillEvidence,
  SkillNode,
  SkillNodeDetail,
  SkillNodeSummary,
  UpdateSkillDomainInput,
  UpdateSkillEvidenceInput,
  UpdateSkillNodeInput
} from '@preload/types'

interface SkillsStore {
  domains: SkillDomainSummary[]
  nodes: SkillNodeSummary[]
  activeDomainId: string | null
  activeNodeId: string | null
  activeNodeDetail: SkillNodeDetail | null
  isLoading: boolean
  error: string | null
  loadDomains: () => Promise<void>
  loadNodes: (domainId?: string | null) => Promise<void>
  loadNodeDetail: (id: string | null) => Promise<void>
  setActiveDomainId: (id: string | null) => void
  createDomain: (input: CreateSkillDomainInput) => Promise<SkillDomain>
  updateDomain: (input: UpdateSkillDomainInput) => Promise<SkillDomain>
  deleteDomain: (id: string) => Promise<void>
  createNode: (input: CreateSkillNodeInput) => Promise<SkillNode>
  updateNode: (input: UpdateSkillNodeInput) => Promise<SkillNode>
  deleteNode: (id: string) => Promise<void>
  addEvidence: (input: CreateSkillEvidenceInput) => Promise<SkillEvidence>
  updateEvidence: (input: UpdateSkillEvidenceInput) => Promise<SkillEvidence>
  confirmEvidence: (id: string) => Promise<SkillEvidence>
  deleteEvidence: (id: string) => Promise<void>
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  domains: [],
  nodes: [],
  activeDomainId: null,
  activeNodeId: null,
  activeNodeDetail: null,
  isLoading: false,
  error: null,

  async loadDomains() {
    set({ isLoading: true, error: null })

    try {
      const domains = await window.lab.skills.listDomains()
      set((state) => ({
        domains,
        activeDomainId: state.activeDomainId ?? domains[0]?.id ?? null,
        isLoading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load skill domains.',
        isLoading: false
      })
    }
  },

  async loadNodes(domainId) {
    set({ isLoading: true, error: null, activeDomainId: domainId ?? null })

    try {
      const nodes = await window.lab.skills.listNodes(domainId ?? undefined)
      set((state) => ({
        nodes,
        activeNodeId:
          state.activeNodeId && nodes.some((node) => node.id === state.activeNodeId)
            ? state.activeNodeId
            : nodes[0]?.id ?? null,
        isLoading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load skill nodes.',
        isLoading: false
      })
    }
  },

  async loadNodeDetail(id) {
    set({ activeNodeId: id, error: null })

    if (!id) {
      set({ activeNodeDetail: null })
      return
    }

    try {
      const detail = await window.lab.skills.getNode(id)
      set({ activeNodeDetail: detail })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load skill detail.'
      })
    }
  },

  setActiveDomainId(id) {
    set({ activeDomainId: id })
  },

  async createDomain(input) {
    const domain = await window.lab.skills.createDomain(input)
    await get().loadDomains()
    return domain
  },

  async updateDomain(input) {
    const domain = await window.lab.skills.updateDomain(input)
    await get().loadDomains()
    return domain
  },

  async deleteDomain(id) {
    await window.lab.skills.deleteDomain(id)
    await get().loadDomains()
    await get().loadNodes(get().activeDomainId)
  },

  async createNode(input) {
    const node = await window.lab.skills.createNode(input)
    await get().loadDomains()
    await get().loadNodes(input.domain_id)
    await get().loadNodeDetail(node.id)
    return node
  },

  async updateNode(input) {
    const node = await window.lab.skills.updateNode(input)
    await get().loadDomains()
    await get().loadNodes(node.domain_id)
    await get().loadNodeDetail(node.id)
    return node
  },

  async deleteNode(id) {
    await window.lab.skills.deleteNode(id)
    await get().loadDomains()
    await get().loadNodes(get().activeDomainId)
    set({ activeNodeId: null, activeNodeDetail: null })
  },

  async addEvidence(input) {
    const evidence = await window.lab.skills.addEvidence(input)
    await get().loadDomains()
    await get().loadNodes(get().activeDomainId)
    await get().loadNodeDetail(input.skill_id)
    return evidence
  },

  async updateEvidence(input) {
    const evidence = await window.lab.skills.updateEvidence(input)
    await get().loadDomains()
    await get().loadNodes(get().activeDomainId)
    const activeNodeId = get().activeNodeId
    if (activeNodeId) {
      await get().loadNodeDetail(activeNodeId)
    }
    return evidence
  },

  async confirmEvidence(id) {
    const evidence = await window.lab.skills.confirmEvidence(id)
    await get().loadDomains()
    await get().loadNodes(get().activeDomainId)
    await get().loadNodeDetail(evidence.skill_id)
    return evidence
  },

  async deleteEvidence(id) {
    await window.lab.skills.deleteEvidence(id)
    await get().loadDomains()
    await get().loadNodes(get().activeDomainId)
    const activeNodeId = get().activeNodeId
    if (activeNodeId) {
      await get().loadNodeDetail(activeNodeId)
    }
  }
}))
