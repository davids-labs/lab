import fs from 'node:fs'
import path from 'node:path'

let baseDir = ''

export function initializeAppPaths(userDataPath: string): void {
  baseDir = userDataPath
  fs.mkdirSync(baseDir, { recursive: true })
  fs.mkdirSync(getProjectsDir(), { recursive: true })
}

export function getAppDataDir(): string {
  if (!baseDir) {
    throw new Error('App paths have not been initialised')
  }

  return baseDir
}

export function getDatabasePath(): string {
  return path.join(getAppDataDir(), 'lab.db')
}

export function getProjectsDir(): string {
  return path.join(getAppDataDir(), 'projects')
}

export function getProjectDir(projectId: string): string {
  return path.join(getProjectsDir(), projectId)
}

export function getProjectAssetsDir(projectId: string): string {
  return path.join(getProjectDir(projectId), 'assets')
}

export function getProjectExportsDir(projectId: string): string {
  return path.join(getProjectDir(projectId), 'exports')
}

export function getProjectPublicDir(projectId: string): string {
  return path.join(getProjectDir(projectId), 'public')
}

export function ensureProjectDirectories(projectId: string): void {
  fs.mkdirSync(getProjectDir(projectId), { recursive: true })
  fs.mkdirSync(getProjectAssetsDir(projectId), { recursive: true })
  fs.mkdirSync(getProjectExportsDir(projectId), { recursive: true })
  fs.mkdirSync(getProjectPublicDir(projectId), { recursive: true })
}

export function isPathInsideDirectory(rootDir: string, targetPath: string): boolean {
  const root = path.resolve(rootDir)
  const target = path.resolve(targetPath)
  const relative = path.relative(root, target)

  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

export function assertPathInsideProjects(targetPath: string): void {
  if (!isPathInsideDirectory(getProjectsDir(), targetPath)) {
    throw new Error('Refusing to access a path outside the LAB projects directory')
  }
}
