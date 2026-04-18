import { ipcMain } from 'electron'
import type {
  ProjectConnectionSummary,
  SkillsPipelineEntry,
  WorkflowSnapshot,
  WorkflowView
} from '../../preload/types'
import {
  getProjectConnections,
  getSkillsPipeline,
  getWorkflowSnapshot
} from '../services/workflow'

export function registerWorkflowHandlers(): void {
  ipcMain.handle('workflow:get-snapshot', async (_event, view: WorkflowView): Promise<WorkflowSnapshot> =>
    getWorkflowSnapshot(view)
  )
  ipcMain.handle(
    'workflow:get-project-connections',
    async (_event, projectId: string): Promise<ProjectConnectionSummary> =>
      getProjectConnections(projectId)
  )
  ipcMain.handle(
    'workflow:get-skills-pipeline',
    async (_event, targetRoleId?: string): Promise<SkillsPipelineEntry[]> =>
      getSkillsPipeline(targetRoleId)
  )
}
