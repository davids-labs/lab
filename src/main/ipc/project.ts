import { ipcMain } from 'electron'
import type { CreateProjectInput, Project, UpdateProjectInput } from '../../preload/types'
import { projectQueries } from '../db/queries/projects'
import { cancelScheduledCommit, scheduleProjectAutoCommit } from '../services/gitSync'

export function registerProjectHandlers(): void {
  ipcMain.handle('project:list', async (): Promise<Project[]> => projectQueries.list())
  ipcMain.handle(
    'project:get',
    async (_event, id: string): Promise<Project> => projectQueries.get(id)
  )
  ipcMain.handle(
    'project:create',
    async (_event, input: CreateProjectInput): Promise<Project> => projectQueries.create(input)
  )
  ipcMain.handle('project:update', async (_event, input: UpdateProjectInput): Promise<Project> => {
    const project = projectQueries.update(input)
    scheduleProjectAutoCommit(project.id)
    return project
  })
  ipcMain.handle('project:delete', async (_event, id: string): Promise<{ ok: boolean }> => {
    cancelScheduledCommit(id)
    return projectQueries.delete(id)
  })
}
