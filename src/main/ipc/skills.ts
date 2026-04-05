import { ipcMain } from 'electron'
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
} from '../../preload/types'
import { skillQueries } from '../db/queries/skills'

export function registerSkillHandlers(): void {
  ipcMain.handle('skills:list-domains', async (): Promise<SkillDomainSummary[]> =>
    skillQueries.listDomains()
  )
  ipcMain.handle(
    'skills:create-domain',
    async (_event, input: CreateSkillDomainInput): Promise<SkillDomain> =>
      skillQueries.createDomain(input)
  )
  ipcMain.handle(
    'skills:update-domain',
    async (_event, input: UpdateSkillDomainInput): Promise<SkillDomain> =>
      skillQueries.updateDomain(input)
  )
  ipcMain.handle('skills:delete-domain', async (_event, id: string): Promise<{ ok: boolean }> =>
    skillQueries.deleteDomain(id)
  )
  ipcMain.handle('skills:list-nodes', async (_event, domainId?: string): Promise<SkillNodeSummary[]> =>
    skillQueries.listNodes(domainId)
  )
  ipcMain.handle('skills:get-node', async (_event, id: string): Promise<SkillNodeDetail> =>
    skillQueries.getNode(id)
  )
  ipcMain.handle(
    'skills:create-node',
    async (_event, input: CreateSkillNodeInput): Promise<SkillNode> => skillQueries.createNode(input)
  )
  ipcMain.handle(
    'skills:update-node',
    async (_event, input: UpdateSkillNodeInput): Promise<SkillNode> => skillQueries.updateNode(input)
  )
  ipcMain.handle('skills:delete-node', async (_event, id: string): Promise<{ ok: boolean }> =>
    skillQueries.deleteNode(id)
  )
  ipcMain.handle(
    'skills:add-evidence',
    async (_event, input: CreateSkillEvidenceInput): Promise<SkillEvidence> =>
      skillQueries.addEvidence(input)
  )
  ipcMain.handle(
    'skills:update-evidence',
    async (_event, input: UpdateSkillEvidenceInput): Promise<SkillEvidence> =>
      skillQueries.updateEvidence(input)
  )
  ipcMain.handle('skills:confirm-evidence', async (_event, id: string): Promise<SkillEvidence> =>
    skillQueries.confirmEvidence(id)
  )
  ipcMain.handle('skills:delete-evidence', async (_event, id: string): Promise<{ ok: boolean }> =>
    skillQueries.deleteEvidence(id)
  )
}
