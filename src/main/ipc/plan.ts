import { ipcMain } from 'electron'
import type {
  CreatePlanLinkInput,
  CreatePlanNodeInput,
  PlanNode,
  PlanNodeDetail,
  PlanNodeLink,
  UpdatePlanNodeInput
} from '../../preload/types'
import { planQueries } from '../db/queries/plan'

export function registerPlanHandlers(): void {
  ipcMain.handle('plan:list-nodes', async (): Promise<PlanNode[]> => planQueries.listNodes())
  ipcMain.handle('plan:get-node', async (_event, id: string): Promise<PlanNodeDetail> => planQueries.getNode(id))
  ipcMain.handle('plan:create-node', async (_event, input: CreatePlanNodeInput): Promise<PlanNode> =>
    planQueries.createNode(input)
  )
  ipcMain.handle('plan:update-node', async (_event, input: UpdatePlanNodeInput): Promise<PlanNode> =>
    planQueries.updateNode(input)
  )
  ipcMain.handle('plan:delete-node', async (_event, id: string): Promise<{ ok: boolean }> =>
    planQueries.deleteNode(id)
  )
  ipcMain.handle('plan:list-links', async (_event, nodeId?: string): Promise<PlanNodeLink[]> =>
    planQueries.listLinks(nodeId)
  )
  ipcMain.handle(
    'plan:create-link',
    async (_event, input: CreatePlanLinkInput): Promise<PlanNodeLink> => planQueries.createLink(input)
  )
  ipcMain.handle('plan:delete-link', async (_event, id: string): Promise<{ ok: boolean }> =>
    planQueries.deleteLink(id)
  )
}
