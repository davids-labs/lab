import { ipcMain } from 'electron'
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
} from '../../preload/types'
import { pipelineQueries } from '../db/queries/pipeline'

export function registerPipelineHandlers(): void {
  ipcMain.handle('pipeline:list-organizations', async (): Promise<TargetOrganization[]> =>
    pipelineQueries.listOrganizations()
  )
  ipcMain.handle(
    'pipeline:create-organization',
    async (_event, input: CreateTargetOrganizationInput): Promise<TargetOrganization> =>
      pipelineQueries.createOrganization(input)
  )
  ipcMain.handle(
    'pipeline:update-organization',
    async (_event, input: UpdateTargetOrganizationInput): Promise<TargetOrganization> =>
      pipelineQueries.updateOrganization(input)
  )
  ipcMain.handle('pipeline:delete-organization', async (_event, id: string): Promise<{ ok: boolean }> =>
    pipelineQueries.deleteOrganization(id)
  )
  ipcMain.handle('pipeline:list-roles', async (): Promise<TargetRole[]> => pipelineQueries.listRoles())
  ipcMain.handle(
    'pipeline:create-role',
    async (_event, input: CreateTargetRoleInput): Promise<TargetRole> =>
      pipelineQueries.createRole(input)
  )
  ipcMain.handle(
    'pipeline:update-role',
    async (_event, input: UpdateTargetRoleInput): Promise<TargetRole> =>
      pipelineQueries.updateRole(input)
  )
  ipcMain.handle('pipeline:delete-role', async (_event, id: string): Promise<{ ok: boolean }> =>
    pipelineQueries.deleteRole(id)
  )
  ipcMain.handle(
    'pipeline:list-role-requirements',
    async (_event, roleId?: string): Promise<TargetRoleSkillRequirement[]> =>
      pipelineQueries.listRoleRequirements(roleId)
  )
  ipcMain.handle(
    'pipeline:create-role-requirement',
    async (_event, input: CreateTargetRoleSkillRequirementInput): Promise<TargetRoleSkillRequirement> =>
      pipelineQueries.createRoleRequirement(input)
  )
  ipcMain.handle(
    'pipeline:update-role-requirement',
    async (_event, input: UpdateTargetRoleSkillRequirementInput): Promise<TargetRoleSkillRequirement> =>
      pipelineQueries.updateRoleRequirement(input)
  )
  ipcMain.handle(
    'pipeline:delete-role-requirement',
    async (_event, id: string): Promise<{ ok: boolean }> => pipelineQueries.deleteRoleRequirement(id)
  )
  ipcMain.handle('pipeline:list-applications', async (): Promise<ApplicationRecord[]> =>
    pipelineQueries.listApplications()
  )
  ipcMain.handle(
    'pipeline:create-application',
    async (_event, input: CreateApplicationRecordInput): Promise<ApplicationRecord> =>
      pipelineQueries.createApplication(input)
  )
  ipcMain.handle(
    'pipeline:update-application',
    async (_event, input: UpdateApplicationRecordInput): Promise<ApplicationRecord> =>
      pipelineQueries.updateApplication(input)
  )
  ipcMain.handle('pipeline:delete-application', async (_event, id: string): Promise<{ ok: boolean }> =>
    pipelineQueries.deleteApplication(id)
  )
  ipcMain.handle('pipeline:list-contacts', async (): Promise<ContactRecord[]> =>
    pipelineQueries.listContacts()
  )
  ipcMain.handle(
    'pipeline:create-contact',
    async (_event, input: CreateContactRecordInput): Promise<ContactRecord> =>
      pipelineQueries.createContact(input)
  )
  ipcMain.handle(
    'pipeline:update-contact',
    async (_event, input: UpdateContactRecordInput): Promise<ContactRecord> =>
      pipelineQueries.updateContact(input)
  )
  ipcMain.handle('pipeline:delete-contact', async (_event, id: string): Promise<{ ok: boolean }> =>
    pipelineQueries.deleteContact(id)
  )
  ipcMain.handle(
    'pipeline:list-interactions',
    async (_event, contactId?: string): Promise<InteractionRecord[]> =>
      pipelineQueries.listInteractions(contactId)
  )
  ipcMain.handle(
    'pipeline:create-interaction',
    async (_event, input: CreateInteractionRecordInput): Promise<InteractionRecord> =>
      pipelineQueries.createInteraction(input)
  )
  ipcMain.handle(
    'pipeline:update-interaction',
    async (_event, input: UpdateInteractionRecordInput): Promise<InteractionRecord> =>
      pipelineQueries.updateInteraction(input)
  )
  ipcMain.handle('pipeline:delete-interaction', async (_event, id: string): Promise<{ ok: boolean }> =>
    pipelineQueries.deleteInteraction(id)
  )
}
