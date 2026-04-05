import { ipcMain } from 'electron'
import type { GitCommitRecord, GitPublishResult, GitStatus } from '../../preload/types'
import {
  commitProject,
  getGitStatus,
  initProjectGit,
  logProjectHistory,
  publishProject,
  pushProject,
  restoreProjectFromCommit,
  setGitHubToken,
  setProjectRemote
} from '../services/gitSync'

export function registerGitHandlers(): void {
  ipcMain.handle(
    'git:status',
    async (_event, projectId: string): Promise<GitStatus> => getGitStatus(projectId)
  )
  ipcMain.handle(
    'git:init',
    async (_event, projectId: string): Promise<{ ok: boolean }> => initProjectGit(projectId)
  )
  ipcMain.handle(
    'git:commit',
    async (_event, projectId: string, message?: string): Promise<{ hash: string }> =>
      commitProject(projectId, message)
  )
  ipcMain.handle(
    'git:log',
    async (_event, projectId: string): Promise<GitCommitRecord[]> => logProjectHistory(projectId)
  )
  ipcMain.handle(
    'git:push',
    async (_event, projectId: string): Promise<{ ok: boolean }> => pushProject(projectId)
  )
  ipcMain.handle(
    'git:restore',
    async (_event, projectId: string, hash: string): Promise<{ ok: boolean }> =>
      restoreProjectFromCommit(projectId, hash)
  )
  ipcMain.handle(
    'git:set-remote',
    async (_event, projectId: string, url: string): Promise<{ ok: boolean }> =>
      setProjectRemote(projectId, url)
  )
  ipcMain.handle(
    'git:set-token',
    async (_event, token: string | null): Promise<{ ok: boolean }> => setGitHubToken(token)
  )
  ipcMain.handle(
    'git:publish',
    async (_event, projectId: string): Promise<GitPublishResult> => publishProject(projectId)
  )
}
