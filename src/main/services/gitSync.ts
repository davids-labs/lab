import fs from 'node:fs'
import path from 'node:path'
import { safeStorage } from 'electron'
import Store from 'electron-store'
import { eq } from 'drizzle-orm'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import type {
  Block,
  GitCommitRecord,
  GitPublishResult,
  GitStatus,
  Project,
  ProjectStatus,
  ProjectType
} from '../../preload/types'
import { BLOCK_TYPES, PROJECT_STATUSES, PROJECT_TYPES } from '../../preload/types'
import { parseBlockData, parsePageConfig } from '@shared/validation'
import { getDb, getSqlite } from '../db'
import { blockQueries } from '../db/queries/blocks'
import { projectQueries } from '../db/queries/projects'
import { blocksTable } from '../db/schema'
import { renderProjectHtml } from '../renderer/pageRenderer'
import { assertPathInsideProjects, ensureProjectDirectories, getProjectDir } from './appPaths'

const settingsStore = new Store<{ githubPat?: string | null }>({
  name: 'lab-settings'
})

const LAB_AUTHOR = {
  name: 'LAB',
  email: 'lab@local'
}

const GIT_IGNORE = `# Never commit the binary database
lab.db
*.db
*.db-shm
*.db-wal
`

const AUTO_COMMIT_DELAY_MS = 30_000
const pendingCommits = new Map<string, NodeJS.Timeout>()

function getRepoDir(projectId: string): string {
  const dir = getProjectDir(projectId)
  assertPathInsideProjects(dir)
  return dir
}

function getGitDir(projectId: string): string {
  return path.join(getRepoDir(projectId), '.git')
}

function hasRepository(projectId: string): boolean {
  return fs.existsSync(getGitDir(projectId))
}

function getStoredGitHubToken(): string | null {
  const stored = settingsStore.get('githubPat')
  if (!stored) {
    return null
  }

  if (stored.startsWith('enc:')) {
    try {
      const payload = stored.slice(4)
      return safeStorage.decryptString(Buffer.from(payload, 'base64'))
    } catch {
      return null
    }
  }

  if (stored.startsWith('plain:')) {
    return stored.slice(6)
  }

  return stored
}

export function setGitHubToken(token: string | null): { ok: boolean } {
  const trimmed = token?.trim() ?? ''

  if (!trimmed) {
    settingsStore.delete('githubPat')
    return { ok: true }
  }

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(trimmed)
    settingsStore.set('githubPat', `enc:${encrypted.toString('base64')}`)
    return { ok: true }
  }

  settingsStore.set('githubPat', `plain:${trimmed}`)
  return { ok: true }
}

function ensureGitEnabled(projectId: string): Project {
  const project = projectQueries.get(projectId)
  if (!project.git_enabled || !hasRepository(projectId)) {
    throw new Error('Git is not enabled for this project yet.')
  }

  return project
}

function ensureRepositoryReady(projectId: string): Project {
  const project = projectQueries.get(projectId)
  if (!hasRepository(projectId)) {
    throw new Error('This project does not have a Git repository yet.')
  }

  return project
}

function createTimestampLabel(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function maybeProjectType(value: unknown): ProjectType | undefined {
  return typeof value === 'string' && PROJECT_TYPES.includes(value as ProjectType)
    ? (value as ProjectType)
    : undefined
}

function maybeProjectStatus(value: unknown): ProjectStatus | undefined {
  return typeof value === 'string' && PROJECT_STATUSES.includes(value as ProjectStatus)
    ? (value as ProjectStatus)
    : undefined
}

function parseGitHubPagesUrl(remoteUrl: string | null): string | null {
  if (!remoteUrl) {
    return null
  }

  const match =
    remoteUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i) ??
    remoteUrl.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i)

  if (!match) {
    return null
  }

  const [, owner, repo] = match
  if (repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    return `https://${owner}.github.io/`
  }

  return `https://${owner}.github.io/${repo}/`
}

async function writeProjectSnapshot(projectId: string): Promise<void> {
  ensureProjectDirectories(projectId)

  const dir = getRepoDir(projectId)
  const project = projectQueries.get(projectId)
  const blocks = blockQueries.list(projectId)
  const publicDir = path.join(dir, 'public')

  fs.mkdirSync(publicDir, { recursive: true })
  fs.writeFileSync(path.join(dir, '.gitignore'), GIT_IGNORE, 'utf8')
  fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify(project, null, 2), 'utf8')
  fs.writeFileSync(path.join(dir, 'blocks.json'), JSON.stringify(blocks, null, 2), 'utf8')
  fs.writeFileSync(
    path.join(publicDir, 'index.html'),
    renderProjectHtml(projectId, 'export'),
    'utf8'
  )
}

async function stageProjectFiles(projectId: string): Promise<boolean> {
  const dir = getRepoDir(projectId)
  const rows = await git.statusMatrix({
    fs,
    dir,
    filepaths: ['.']
  })

  for (const [filepath, head, workdir, stage] of rows) {
    if (workdir === 0 && head !== 0) {
      await git.remove({ fs, dir, filepath })
      continue
    }

    if (workdir !== stage) {
      await git.add({ fs, dir, filepath })
    }
  }

  const stagedRows = await git.statusMatrix({
    fs,
    dir,
    filepaths: ['.']
  })

  return stagedRows.some(([, head, , stage]) => head !== stage)
}

async function currentHead(projectId: string): Promise<string> {
  try {
    return await git.resolveRef({ fs, dir: getRepoDir(projectId), ref: 'HEAD' })
  } catch {
    return ''
  }
}

async function commitSnapshot(projectId: string, message: string): Promise<{ hash: string }> {
  ensureRepositoryReady(projectId)
  await writeProjectSnapshot(projectId)

  const hasChanges = await stageProjectFiles(projectId)
  if (!hasChanges) {
    return { hash: await currentHead(projectId) }
  }

  const hash = await git.commit({
    fs,
    dir: getRepoDir(projectId),
    message,
    author: LAB_AUTHOR
  })

  return { hash }
}

export function scheduleProjectAutoCommit(projectId: string): void {
  const project = projectQueries.get(projectId)
  if (!project.git_enabled || !hasRepository(projectId)) {
    return
  }

  const existing = pendingCommits.get(projectId)
  if (existing) {
    clearTimeout(existing)
  }

  pendingCommits.set(
    projectId,
    setTimeout(() => {
      pendingCommits.delete(projectId)
      void commitSnapshot(projectId, `auto: save ${createTimestampLabel()}`).catch(() => undefined)
    }, AUTO_COMMIT_DELAY_MS)
  )
}

export function cancelScheduledCommit(projectId: string): void {
  const timer = pendingCommits.get(projectId)
  if (!timer) {
    return
  }

  clearTimeout(timer)
  pendingCommits.delete(projectId)
}

async function flushScheduledCommit(projectId: string, fallbackMessage: string): Promise<void> {
  const timer = pendingCommits.get(projectId)
  if (timer) {
    clearTimeout(timer)
    pendingCommits.delete(projectId)
  }

  await commitSnapshot(projectId, fallbackMessage)
}

function restoreProjectSnapshot(projectId: string, snapshot: Record<string, unknown>): void {
  const current = projectQueries.get(projectId)

  projectQueries.update({
    id: projectId,
    name: typeof snapshot.name === 'string' && snapshot.name.trim() ? snapshot.name : current.name,
    type: maybeProjectType(snapshot.type) ?? current.type,
    subtitle:
      typeof snapshot.subtitle === 'string'
        ? snapshot.subtitle
        : snapshot.subtitle === null
          ? null
          : current.subtitle,
    core_value:
      typeof snapshot.core_value === 'string'
        ? snapshot.core_value
        : snapshot.core_value === null
          ? null
          : current.core_value,
    status: maybeProjectStatus(snapshot.status) ?? current.status,
    page_config: parsePageConfig(snapshot.page_config ?? current.page_config),
    cover_asset_id:
      typeof snapshot.cover_asset_id === 'string' || snapshot.cover_asset_id === null
        ? snapshot.cover_asset_id
        : current.cover_asset_id
  })
}

function replaceProjectBlocks(projectId: string, snapshotBlocks: unknown[]): void {
  const db = getDb()
  const sqlite = getSqlite()
  const now = Date.now()
  const validTypes = new Set(BLOCK_TYPES)

  sqlite.transaction(() => {
    db.delete(blocksTable).where(eq(blocksTable.project_id, projectId)).run()

    for (const entry of snapshotBlocks) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        continue
      }

      const block = entry as Partial<Block>
      if (
        typeof block.id !== 'string' ||
        typeof block.type !== 'string' ||
        !validTypes.has(block.type)
      ) {
        continue
      }

      db.insert(blocksTable)
        .values({
          id: block.id,
          project_id: projectId,
          type: block.type,
          sort_order: typeof block.sort_order === 'number' ? block.sort_order : 0,
          grid_col: typeof block.grid_col === 'number' ? block.grid_col : 0,
          grid_col_span: typeof block.grid_col_span === 'number' ? block.grid_col_span : 1,
          visible_on_page:
            typeof block.visible_on_page === 'boolean' ? block.visible_on_page : true,
          data: JSON.stringify(parseBlockData(block.type, block.data ?? {})),
          created_at: typeof block.created_at === 'number' ? block.created_at : now,
          updated_at: typeof block.updated_at === 'number' ? block.updated_at : now
        })
        .run()
    }
  })()

  projectQueries.resyncSections(projectId, blockQueries.list(projectId))
  projectQueries.touch(projectId)
}

function readSnapshotJson(blob: Uint8Array): unknown {
  return JSON.parse(Buffer.from(blob).toString('utf8'))
}

async function pushProjectToRemote(projectId: string): Promise<void> {
  const project = ensureGitEnabled(projectId)
  const token = getStoredGitHubToken()

  if (!project.git_remote) {
    throw new Error('Add a remote URL before pushing.')
  }

  if (!token) {
    throw new Error('Add a GitHub token before pushing.')
  }

  const result = await git.push({
    fs,
    http,
    dir: getRepoDir(projectId),
    remote: 'origin',
    ref: 'main',
    remoteRef: 'main',
    onAuth: () => ({
      username: 'oauth2',
      password: token
    })
  })

  if (!result.ok) {
    throw new Error(result.error ?? 'Push failed.')
  }
}

export async function getGitStatus(projectId: string): Promise<GitStatus> {
  const project = projectQueries.get(projectId)

  return {
    enabled: project.git_enabled,
    hasRepository: hasRepository(projectId),
    remoteUrl: project.git_remote,
    hasToken: Boolean(getStoredGitHubToken()),
    pagesUrl: project.git_pages_url,
    autoCommitPending: pendingCommits.has(projectId)
  }
}

export async function initProjectGit(projectId: string): Promise<{ ok: boolean }> {
  ensureProjectDirectories(projectId)
  const dir = getRepoDir(projectId)

  if (!hasRepository(projectId)) {
    await git.init({
      fs,
      dir,
      defaultBranch: 'main'
    })
  }

  await git.setConfig({ fs, dir, path: 'user.name', value: LAB_AUTHOR.name })
  await git.setConfig({ fs, dir, path: 'user.email', value: LAB_AUTHOR.email })

  await commitSnapshot(projectId, 'Initial commit')

  if (!projectQueries.get(projectId).git_enabled) {
    projectQueries.update({ id: projectId, git_enabled: true })
  }

  return { ok: true }
}

export async function commitProject(
  projectId: string,
  message?: string
): Promise<{ hash: string }> {
  return commitSnapshot(projectId, message?.trim() || `manual: save ${createTimestampLabel()}`)
}

export async function logProjectHistory(projectId: string): Promise<GitCommitRecord[]> {
  ensureGitEnabled(projectId)

  const commits = await git.log({
    fs,
    dir: getRepoDir(projectId),
    depth: 50
  })

  return commits.map((entry) => ({
    hash: entry.oid,
    message: entry.commit.message.trim(),
    timestamp: entry.commit.author.timestamp * 1000
  }))
}

export async function restoreProjectFromCommit(
  projectId: string,
  hash: string
): Promise<{ ok: boolean }> {
  ensureGitEnabled(projectId)
  const dir = getRepoDir(projectId)
  const [projectBlob, blocksBlob] = await Promise.all([
    git.readBlob({ fs, dir, oid: hash, filepath: 'project.json' }),
    git.readBlob({ fs, dir, oid: hash, filepath: 'blocks.json' })
  ])

  const projectSnapshot = readSnapshotJson(projectBlob.blob)
  const blocksSnapshot = readSnapshotJson(blocksBlob.blob)

  restoreProjectSnapshot(
    projectId,
    projectSnapshot && typeof projectSnapshot === 'object' && !Array.isArray(projectSnapshot)
      ? (projectSnapshot as Record<string, unknown>)
      : {}
  )
  replaceProjectBlocks(projectId, Array.isArray(blocksSnapshot) ? blocksSnapshot : [])
  await commitSnapshot(projectId, `restore: ${hash.slice(0, 7)}`)

  return { ok: true }
}

export async function setProjectRemote(projectId: string, url: string): Promise<{ ok: boolean }> {
  ensureGitEnabled(projectId)
  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('Remote URL is required.')
  }

  const dir = getRepoDir(projectId)
  try {
    await git.addRemote({
      fs,
      dir,
      remote: 'origin',
      url: trimmed,
      force: true
    })
  } catch {
    await git.deleteRemote({ fs, dir, remote: 'origin' })
    await git.addRemote({ fs, dir, remote: 'origin', url: trimmed })
  }

  projectQueries.update({ id: projectId, git_remote: trimmed })
  return { ok: true }
}

export async function pushProject(projectId: string): Promise<{ ok: boolean }> {
  ensureGitEnabled(projectId)
  await flushScheduledCommit(projectId, `manual: sync ${createTimestampLabel()}`)
  await pushProjectToRemote(projectId)
  return { ok: true }
}

export async function publishProject(projectId: string): Promise<GitPublishResult> {
  const project = ensureGitEnabled(projectId)
  await flushScheduledCommit(projectId, `publish: ${createTimestampLabel()}`)
  await pushProjectToRemote(projectId)

  const pagesUrl = parseGitHubPagesUrl(project.git_remote)
  if (pagesUrl) {
    projectQueries.update({
      id: projectId,
      git_pages_url: pagesUrl
    })
  }

  return {
    ok: true,
    url: pagesUrl
  }
}
