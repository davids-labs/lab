import { create } from 'zustand'
import type {
  ApplicationRecord,
  ContactRecord,
  CreateApplicationRecordInput,
  CreateContactRecordInput,
  CreateInteractionRecordInput,
  CreateTargetRoleSkillRequirementInput,
  CreateTargetOrganizationInput,
  CreateTargetRoleInput,
  InteractionRecord,
  TargetOrganization,
  TargetRole,
  TargetRoleSkillRequirement,
  UpdateApplicationRecordInput,
  UpdateContactRecordInput,
  UpdateInteractionRecordInput,
  UpdateTargetRoleSkillRequirementInput,
  UpdateTargetOrganizationInput,
  UpdateTargetRoleInput
} from '@preload/types'

interface PipelineStore {
  organizations: TargetOrganization[]
  roles: TargetRole[]
  roleRequirements: TargetRoleSkillRequirement[]
  applications: ApplicationRecord[]
  contacts: ContactRecord[]
  interactions: InteractionRecord[]
  isLoading: boolean
  error: string | null
  loadAll: () => Promise<void>
  createOrganization: (input: CreateTargetOrganizationInput) => Promise<void>
  updateOrganization: (input: UpdateTargetOrganizationInput) => Promise<void>
  deleteOrganization: (id: string) => Promise<void>
  createRole: (input: CreateTargetRoleInput) => Promise<void>
  updateRole: (input: UpdateTargetRoleInput) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  createRoleRequirement: (input: CreateTargetRoleSkillRequirementInput) => Promise<void>
  updateRoleRequirement: (input: UpdateTargetRoleSkillRequirementInput) => Promise<void>
  deleteRoleRequirement: (id: string) => Promise<void>
  createApplication: (input: CreateApplicationRecordInput) => Promise<void>
  updateApplication: (input: UpdateApplicationRecordInput) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  createContact: (input: CreateContactRecordInput) => Promise<void>
  updateContact: (input: UpdateContactRecordInput) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  createInteraction: (input: CreateInteractionRecordInput) => Promise<void>
  updateInteraction: (input: UpdateInteractionRecordInput) => Promise<void>
  deleteInteraction: (id: string) => Promise<void>
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  organizations: [],
  roles: [],
  roleRequirements: [],
  applications: [],
  contacts: [],
  interactions: [],
  isLoading: false,
  error: null,

  async loadAll() {
    set({ isLoading: true, error: null })

    try {
      const [organizations, roles, roleRequirements, applications, contacts, interactions] = await Promise.all([
        window.lab.pipeline.listOrganizations(),
        window.lab.pipeline.listRoles(),
        window.lab.pipeline.listRoleRequirements(),
        window.lab.pipeline.listApplications(),
        window.lab.pipeline.listContacts(),
        window.lab.pipeline.listInteractions()
      ])

      set({
        organizations,
        roles,
        roleRequirements,
        applications,
        contacts,
        interactions,
        isLoading: false
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load pipeline.',
        isLoading: false
      })
    }
  },

  async createOrganization(input) {
    await window.lab.pipeline.createOrganization(input)
    await get().loadAll()
  },
  async updateOrganization(input) {
    await window.lab.pipeline.updateOrganization(input)
    await get().loadAll()
  },
  async deleteOrganization(id) {
    await window.lab.pipeline.deleteOrganization(id)
    await get().loadAll()
  },
  async createRole(input) {
    await window.lab.pipeline.createRole(input)
    await get().loadAll()
  },
  async updateRole(input) {
    await window.lab.pipeline.updateRole(input)
    await get().loadAll()
  },
  async deleteRole(id) {
    await window.lab.pipeline.deleteRole(id)
    await get().loadAll()
  },
  async createRoleRequirement(input) {
    await window.lab.pipeline.createRoleRequirement(input)
    await get().loadAll()
  },
  async updateRoleRequirement(input) {
    await window.lab.pipeline.updateRoleRequirement(input)
    await get().loadAll()
  },
  async deleteRoleRequirement(id) {
    await window.lab.pipeline.deleteRoleRequirement(id)
    await get().loadAll()
  },
  async createApplication(input) {
    await window.lab.pipeline.createApplication(input)
    await get().loadAll()
  },
  async updateApplication(input) {
    await window.lab.pipeline.updateApplication(input)
    await get().loadAll()
  },
  async deleteApplication(id) {
    await window.lab.pipeline.deleteApplication(id)
    await get().loadAll()
  },
  async createContact(input) {
    await window.lab.pipeline.createContact(input)
    await get().loadAll()
  },
  async updateContact(input) {
    await window.lab.pipeline.updateContact(input)
    await get().loadAll()
  },
  async deleteContact(id) {
    await window.lab.pipeline.deleteContact(id)
    await get().loadAll()
  },
  async createInteraction(input) {
    await window.lab.pipeline.createInteraction(input)
    await get().loadAll()
  },
  async updateInteraction(input) {
    await window.lab.pipeline.updateInteraction(input)
    await get().loadAll()
  },
  async deleteInteraction(id) {
    await window.lab.pipeline.deleteInteraction(id)
    await get().loadAll()
  }
}))
