import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { safeStorage, shell } from 'electron'
import { and, asc, desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CreateIntegrationAccountInput,
  CreateWatchFolderInput,
  GitHubCliStatus,
  GoogleCalendarConnectionResult,
  IntegrationAccount,
  SyncGitHubReposInput,
  SyncJob,
  UpdateIntegrationAccountInput,
  UpdateWatchFolderInput,
  WatchFolder
} from '../../../preload/types'
import { getDb } from '../index'
import {
  inboxEntriesTable,
  integrationAccountsTable,
  syncJobsTable,
  watchFoldersTable,
  type IntegrationAccountRow,
  type SyncJobRow,
  type WatchFolderRow
} from '../schema'
import { getAppDataDir } from '../../services/appPaths'
import { assetQueries } from './assets'
import { calendarQueries } from './calendar'
import { libraryQueries } from './library'
import { projectQueries } from './projects'
import { settingsQueries } from './settings'

interface IntegrationSecrets {
  google_tokens_by_account_id?: Record<string, string>
}

interface GoogleTokenPayload {
  access_token: string
  refresh_token?: string
  expires_at: number
  scope?: string
  token_type?: string
}

interface GoogleCalendarAccountConfig {
  email: string
  calendar_id: string
  client_id: string
  source_id: string
  scopes: string[]
  last_synced_at?: number
  last_error?: string | null
}

interface GitHubRepoSnapshot {
  id: string
  full_name: string
  repo: string
  url: string
  description: string | null
  default_branch: string | null
  pushed_at: string | null
  updated_at: string | null
  open_issues_count: number
  stargazers_count: number
  latest_commit_sha: string | null
  latest_commit_message: string | null
  latest_commit_date: string | null
}

interface GitHubAccountConfig {
  login: string | null
  repo_urls: string[]
  last_synced_at?: number
  last_error?: string | null
  repos?: GitHubRepoSnapshot[]
}

interface GitHubRepoRef {
  owner: string
  repo: string
  url: string
}

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly'
]

let secretsCache: IntegrationSecrets | null = null

function deserializeAccount(row: IntegrationAccountRow): IntegrationAccount {
  return {
    ...row,
    type: row.type as IntegrationAccount['type']
  }
}

function deserializeWatchFolder(row: WatchFolderRow): WatchFolder {
  return {
    ...row,
    mode: row.mode as WatchFolder['mode'],
    project_id: row.project_id ?? null,
    enabled: Boolean(row.enabled)
  }
}

function deserializeSyncJob(row: SyncJobRow): SyncJob {
  return {
    ...row,
    integration_type: row.integration_type as SyncJob['integration_type'],
    status: row.status as SyncJob['status'],
    summary: row.summary ?? null,
    metadata_json: row.metadata_json ?? null,
    finished_at: row.finished_at ?? null
  }
}

function clean(value: string | null | undefined): string | null {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function parseJsonObject<T extends object>(value: string | null | undefined): Partial<T> {
  if (!value?.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : {}
  } catch {
    return {}
  }
}

function listFiles(folderPath: string): string[] {
  return fs
    .readdirSync(folderPath)
    .map((name) => path.join(folderPath, name))
    .filter((entry) => fs.statSync(entry).isFile())
}

function getSecretsPath(): string {
  return path.join(getAppDataDir(), 'integration-secrets.json')
}

function writeFileAtomic(filePath: string, content: string): void {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tempPath, content, 'utf8')
  fs.renameSync(tempPath, filePath)
}

function readSecrets(): IntegrationSecrets {
  if (secretsCache) {
    return secretsCache
  }

  try {
    const raw = fs.readFileSync(getSecretsPath(), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      secretsCache = parsed as IntegrationSecrets
      return secretsCache
    }
  } catch {
    // Ignore missing or invalid secrets file and fall back to defaults.
  }

  secretsCache = {}
  return secretsCache
}

function writeSecrets(next: IntegrationSecrets): void {
  secretsCache = next

  if (Object.keys(next).length === 0) {
    fs.rmSync(getSecretsPath(), { force: true })
    return
  }

  writeFileAtomic(getSecretsPath(), JSON.stringify(next, null, 2))
}

function encryptSecretPayload(payload: unknown): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is unavailable on this machine, so davids.lab will not persist integration tokens.'
    )
  }

  const encrypted = safeStorage.encryptString(JSON.stringify(payload))
  return encrypted.toString('base64')
}

function decryptSecretPayload<T>(payload: string | undefined): T | null {
  if (!payload) {
    return null
  }

  try {
    const decrypted = safeStorage.decryptString(Buffer.from(payload, 'base64'))
    return JSON.parse(decrypted) as T
  } catch {
    return null
  }
}

function setGoogleTokens(accountId: string, tokens: GoogleTokenPayload): void {
  const secrets = readSecrets()
  const next = {
    ...secrets,
    google_tokens_by_account_id: {
      ...(secrets.google_tokens_by_account_id ?? {}),
      [accountId]: encryptSecretPayload(tokens)
    }
  }
  writeSecrets(next)
}

function getGoogleTokens(accountId: string): GoogleTokenPayload | null {
  return decryptSecretPayload<GoogleTokenPayload>(
    readSecrets().google_tokens_by_account_id?.[accountId]
  )
}

function removeGoogleTokens(accountId: string): void {
  const secrets = readSecrets()
  if (!secrets.google_tokens_by_account_id?.[accountId]) {
    return
  }

  const nextTokens = { ...(secrets.google_tokens_by_account_id ?? {}) }
  delete nextTokens[accountId]

  const next: IntegrationSecrets = { ...secrets }
  if (Object.keys(nextTokens).length > 0) {
    next.google_tokens_by_account_id = nextTokens
  } else {
    delete next.google_tokens_by_account_id
  }

  writeSecrets(next)
}

function findAccountByType(type: IntegrationAccount['type']): IntegrationAccount | null {
  return integrationQueries.listAccounts().find((entry) => entry.type === type) ?? null
}

function upsertAccountByType(
  type: IntegrationAccount['type'],
  label: string,
  config: Record<string, unknown>
): IntegrationAccount {
  const db = getDb()
  const now = Date.now()
  const current = db
    .select()
    .from(integrationAccountsTable)
    .where(eq(integrationAccountsTable.type, type))
    .get()

  if (current) {
    db.update(integrationAccountsTable)
      .set({
        label: label.trim() || current.label,
        config_json: JSON.stringify(config, null, 2),
        updated_at: now
      })
      .where(eq(integrationAccountsTable.id, current.id))
      .run()

    return deserializeAccount(
      db.select().from(integrationAccountsTable).where(eq(integrationAccountsTable.id, current.id)).get()!
    )
  }

  const id = ulid()
  db.insert(integrationAccountsTable)
    .values({
      id,
      type,
      label: label.trim(),
      config_json: JSON.stringify(config, null, 2),
      created_at: now,
      updated_at: now
    })
    .run()

  return deserializeAccount(
    db.select().from(integrationAccountsTable).where(eq(integrationAccountsTable.id, id)).get()!
  )
}

function updateAccountConfig<T extends object>(accountId: string, config: T): IntegrationAccount {
  const db = getDb()
  db.update(integrationAccountsTable)
    .set({
      config_json: JSON.stringify(config, null, 2),
      updated_at: Date.now()
    })
    .where(eq(integrationAccountsTable.id, accountId))
    .run()

  return deserializeAccount(
    db.select().from(integrationAccountsTable).where(eq(integrationAccountsTable.id, accountId)).get()!
  )
}

function startSyncJob(
  type: SyncJob['integration_type'],
  label: string,
  metadata?: Record<string, unknown>
): string {
  const db = getDb()
  const id = ulid()

  db.insert(syncJobsTable)
    .values({
      id,
      integration_type: type,
      status: 'running',
      label,
      summary: null,
      metadata_json: metadata ? JSON.stringify(metadata) : null,
      started_at: Date.now(),
      finished_at: null
    })
    .run()

  return id
}

function finishSyncJob(
  id: string,
  status: SyncJob['status'],
  summary: string,
  metadata?: Record<string, unknown>
): SyncJob {
  const db = getDb()
  db.update(syncJobsTable)
    .set({
      status,
      summary,
      metadata_json: metadata ? JSON.stringify(metadata) : undefined,
      finished_at: Date.now()
    })
    .where(eq(syncJobsTable.id, id))
    .run()

  return deserializeSyncJob(db.select().from(syncJobsTable).where(eq(syncJobsTable.id, id)).get()!)
}

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function buildPkcePair(): { verifier: string; challenge: string } {
  const verifier = toBase64Url(crypto.randomBytes(32))
  const challenge = toBase64Url(crypto.createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

let activeGooglePkceVerifier = ''

async function waitForGoogleOAuthCode(clientId: string): Promise<{ code: string; redirectUri: string }> {
  const { verifier, challenge } = buildPkcePair()
  activeGooglePkceVerifier = verifier
  let redirectUri = ''

  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')

      if (url.pathname !== '/oauth2/callback') {
        response.statusCode = 404
        response.end('Not found')
        return
      }

      const error = url.searchParams.get('error')
      const code = url.searchParams.get('code')
      response.setHeader('Content-Type', 'text/html; charset=utf-8')

      if (error || !code) {
        response.statusCode = 400
        response.end(
          '<!doctype html><title>davids.lab</title><body><p>Google sign-in failed. You can close this tab.</p></body>'
        )
        cleanup()
        activeGooglePkceVerifier = ''
        reject(new Error(error ? `Google sign-in failed: ${error}` : 'Google sign-in was cancelled.'))
        return
      }

      response.end(
        '<!doctype html><title>davids.lab</title><body><p>Google Calendar connected. You can close this tab and return to davids.lab.</p></body>'
      )
      cleanup()
      resolve({ code, redirectUri })
    })

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Google sign-in timed out before the browser returned.'))
    }, 180_000)

    function cleanup(): void {
      clearTimeout(timeout)
      server.close()
    }

    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        cleanup()
        reject(new Error('Unable to open a local callback port for Google sign-in.'))
        return
      }

      redirectUri = `http://127.0.0.1:${address.port}/oauth2/callback`
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', GOOGLE_SCOPES.join(' '))
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('code_challenge', challenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      void shell.openExternal(authUrl.toString()).catch((error) => {
        cleanup()
        reject(
          error instanceof Error ? error : new Error('Could not open the browser for Google sign-in.')
        )
      })
    })
  })
}

function getPkceVerifier(): string {
  if (!activeGooglePkceVerifier) {
    throw new Error('Google sign-in verifier is missing.')
  }

  return activeGooglePkceVerifier
}

async function postGoogleTokenForm(params: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(params).toString()
  })

  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status}).`)
  }

  return (await response.json()) as Record<string, unknown>
}

async function exchangeGoogleCodeForTokens(
  clientId: string,
  code: string,
  redirectUri: string
): Promise<GoogleTokenPayload> {
  const payload = await postGoogleTokenForm({
    client_id: clientId,
    code,
    code_verifier: getPkceVerifier(),
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  })

  const accessToken = String(payload.access_token ?? '')
  if (!accessToken) {
    throw new Error('Google did not return an access token.')
  }

  activeGooglePkceVerifier = ''

  return {
    access_token: accessToken,
    refresh_token: clean(String(payload.refresh_token ?? '')) ?? undefined,
    expires_at: Date.now() + Number(payload.expires_in ?? 3600) * 1000,
    scope: clean(String(payload.scope ?? '')) ?? undefined,
    token_type: clean(String(payload.token_type ?? 'Bearer')) ?? 'Bearer'
  }
}

async function refreshGoogleAccessToken(
  clientId: string,
  refreshToken: string
): Promise<GoogleTokenPayload> {
  const payload = await postGoogleTokenForm({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })

  const accessToken = String(payload.access_token ?? '')
  if (!accessToken) {
    throw new Error('Google refresh did not return an access token.')
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() + Number(payload.expires_in ?? 3600) * 1000,
    scope: clean(String(payload.scope ?? '')) ?? undefined,
    token_type: clean(String(payload.token_type ?? 'Bearer')) ?? 'Bearer'
  }
}

async function fetchGoogleJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Google request failed (${response.status}).`)
  }

  return (await response.json()) as T
}

async function getValidGoogleTokens(account: IntegrationAccount): Promise<GoogleTokenPayload> {
  const config = parseJsonObject<GoogleCalendarAccountConfig>(account.config_json)
  const clientId = clean(config.client_id) ?? ''
  if (!clientId) {
    throw new Error('Google Calendar account is missing the OAuth client ID.')
  }

  const stored = getGoogleTokens(account.id)
  if (!stored) {
    throw new Error('Google Calendar tokens are missing. Reconnect the account.')
  }

  if (stored.expires_at > Date.now() + 60_000) {
    return stored
  }

  if (!stored.refresh_token) {
    throw new Error('Google Calendar refresh token is missing. Reconnect the account.')
  }

  const refreshed = await refreshGoogleAccessToken(clientId, stored.refresh_token)
  setGoogleTokens(account.id, refreshed)
  return refreshed
}

function normalizeGitHubRepoUrl(input: string): GitHubRepoRef {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('GitHub repo URL is required.')
  }

  const shorthand = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/)
  if (shorthand) {
    return {
      owner: shorthand[1],
      repo: shorthand[2],
      url: `https://github.com/${shorthand[1]}/${shorthand[2]}`
    }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error(`Invalid GitHub repo URL: ${trimmed}`)
  }

  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com') {
    throw new Error(`Only HTTPS GitHub repo URLs are supported: ${trimmed}`)
  }

  if (parsed.username || parsed.password) {
    throw new Error('GitHub repo URLs must not embed credentials.')
  }

  const parts = parsed.pathname
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) {
    throw new Error(`GitHub repo URL must look like https://github.com/owner/repo: ${trimmed}`)
  }

  const owner = parts[0]
  const repo = parts[1].replace(/\.git$/i, '')
  return {
    owner,
    repo,
    url: `https://github.com/${owner}/${repo}`
  }
}

function execGh(args: string[]): string {
  try {
    return execFileSync('gh', args, {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  } catch (error) {
    const message =
      error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
        ? error.stderr.trim()
        : error instanceof Error
          ? error.message
          : 'GitHub CLI command failed.'

    throw new Error(message || 'GitHub CLI command failed.')
  }
}

function execGhJson<T>(args: string[]): T {
  const output = execGh(args)
  return JSON.parse(output) as T
}

function getGitHubCliStatusInternal(): GitHubCliStatus {
  try {
    const login = execGh(['api', 'user', '--jq', '.login']) || null
    return {
      authenticated: Boolean(login),
      login,
      auth_source: login ? 'gh-cli' : 'none'
    }
  } catch {
    return {
      authenticated: false,
      login: null,
      auth_source: 'none'
    }
  }
}

function findLinkedProjectId(repoName: string): string | null {
  const normalized = repoName.trim().toLowerCase()
  const compactRepo = normalized.replace(/[-_\s]+/g, '')

  const project = projectQueries.list().find((entry) => {
    const slug = entry.slug.toLowerCase()
    const name = entry.name.toLowerCase().replace(/\s+/g, '')
    return slug === normalized || slug === compactRepo || name === compactRepo
  })

  return project?.id ?? null
}

function upsertGitHubCapture(snapshot: GitHubRepoSnapshot): void {
  const db = getDb()
  const now = Date.now()
  const title = `GitHub repo · ${snapshot.full_name}`
  const bodyLines = [
    snapshot.description ?? 'No repo description yet.',
    '',
    `Repo: ${snapshot.url}`,
    snapshot.default_branch ? `Default branch: ${snapshot.default_branch}` : null,
    snapshot.updated_at ? `Updated: ${new Date(snapshot.updated_at).toLocaleString('en-IE')}` : null,
    snapshot.pushed_at ? `Last push: ${new Date(snapshot.pushed_at).toLocaleString('en-IE')}` : null,
    snapshot.latest_commit_message ? `Latest commit: ${snapshot.latest_commit_message}` : null,
    snapshot.latest_commit_sha ? `Commit SHA: ${snapshot.latest_commit_sha.slice(0, 7)}` : null
  ].filter(Boolean)
  const body = bodyLines.join('\n')
  const linkedProjectId = findLinkedProjectId(snapshot.repo)
  const existing = db
    .select()
    .from(inboxEntriesTable)
    .where(and(eq(inboxEntriesTable.title, title), eq(inboxEntriesTable.source, 'github')))
    .get()

  if (existing) {
    db.update(inboxEntriesTable)
      .set({
        body,
        kind: 'link',
        linked_project_id: linkedProjectId,
        updated_at: now
      })
      .where(eq(inboxEntriesTable.id, existing.id))
      .run()
    return
  }

  db.insert(inboxEntriesTable)
    .values({
      id: ulid(),
      title,
      body,
      kind: 'link',
      source: 'github',
      status: 'inbox',
      triage_target: linkedProjectId ? 'proof' : 'library',
      linked_source_document_id: null,
      linked_excerpt_id: null,
      linked_project_id: linkedProjectId,
      linked_application_id: null,
      created_at: now,
      updated_at: now
    })
    .run()
}

function ensureDefaultWatchFolder(): void {
  const defaultPath = clean(settingsQueries.getBundle().integration_settings.default_watch_folder_path)
  if (!defaultPath || !fs.existsSync(defaultPath) || !fs.statSync(defaultPath).isDirectory()) {
    return
  }

  const db = getDb()
  const existing = db
    .select()
    .from(watchFoldersTable)
    .all()
    .map(deserializeWatchFolder)
    .find((folder) => path.resolve(folder.folder_path) === path.resolve(defaultPath))

  if (!existing) {
    integrationQueries.createWatchFolder({
      label: 'Lab watch folder',
      folder_path: defaultPath,
      mode: 'library_documents',
      enabled: true
    })
  }
}

export const integrationQueries = {
  listAccounts(): IntegrationAccount[] {
    const db = getDb()
    return db
      .select()
      .from(integrationAccountsTable)
      .orderBy(asc(integrationAccountsTable.label))
      .all()
      .map(deserializeAccount)
  },

  createAccount(input: CreateIntegrationAccountInput): IntegrationAccount {
    const db = getDb()
    const id = ulid()
    const now = Date.now()

    db.insert(integrationAccountsTable)
      .values({
        id,
        type: input.type,
        label: input.label.trim(),
        config_json: input.config_json?.trim() || '{}',
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeAccount(
      db.select().from(integrationAccountsTable).where(eq(integrationAccountsTable.id, id)).get()!
    )
  },

  updateAccount(input: UpdateIntegrationAccountInput): IntegrationAccount {
    const db = getDb()
    const current = db
      .select()
      .from(integrationAccountsTable)
      .where(eq(integrationAccountsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Integration account not found')
    }

    db.update(integrationAccountsTable)
      .set({
        label: input.label?.trim() || current.label,
        config_json: input.config_json?.trim() || current.config_json,
        updated_at: Date.now()
      })
      .where(eq(integrationAccountsTable.id, input.id))
      .run()

    return deserializeAccount(
      db.select().from(integrationAccountsTable).where(eq(integrationAccountsTable.id, input.id)).get()!
    )
  },

  deleteAccount(id: string): { ok: boolean } {
    const db = getDb()
    const account = db
      .select()
      .from(integrationAccountsTable)
      .where(eq(integrationAccountsTable.id, id))
      .get()

    if (account?.type === 'google_calendar') {
      const config = parseJsonObject<GoogleCalendarAccountConfig>(account.config_json)
      removeGoogleTokens(id)
      if (config.source_id) {
        calendarQueries.deleteSource(config.source_id)
      }
    }

    db.delete(integrationAccountsTable).where(eq(integrationAccountsTable.id, id)).run()
    return { ok: true }
  },

  getGitHubCliStatus(): GitHubCliStatus {
    return getGitHubCliStatusInternal()
  },

  async syncGitHubRepos(input?: SyncGitHubReposInput): Promise<SyncJob> {
    const cliStatus = getGitHubCliStatusInternal()
    if (!cliStatus.authenticated) {
      throw new Error('GitHub CLI is not signed in. Run `gh auth login` first.')
    }

    const settings = settingsQueries.getBundle().integration_settings
    const rawRepoUrls =
      input?.repo_urls?.length && input.repo_urls.some((value) => value.trim())
        ? input.repo_urls
        : settings.github_monitored_repos
    const repoRefs = Array.from(
      new Map(rawRepoUrls.map((entry) => [normalizeGitHubRepoUrl(entry).url, normalizeGitHubRepoUrl(entry)])).values()
    )

    if (repoRefs.length === 0) {
      throw new Error('Add at least one monitored GitHub repo URL before syncing.')
    }

    const jobId = startSyncJob('github', 'GitHub repo sync', {
      repos: repoRefs.map((entry) => entry.url),
      login: cliStatus.login
    })

    try {
      const snapshots: GitHubRepoSnapshot[] = []

      for (const repoRef of repoRefs) {
        const repoResponse = execGhJson<Record<string, unknown>>([
          'api',
          `repos/${repoRef.owner}/${repoRef.repo}`
        ])
        const commitsResponse = execGhJson<Array<Record<string, unknown>>>([
          'api',
          `repos/${repoRef.owner}/${repoRef.repo}/commits?per_page=1`
        ])
        const latestCommit = Array.isArray(commitsResponse) ? commitsResponse[0] : null
        const commitInfo =
          latestCommit && typeof latestCommit === 'object'
            ? (latestCommit.commit as Record<string, unknown> | undefined)
            : undefined
        const authorInfo =
          commitInfo && typeof commitInfo === 'object'
            ? (commitInfo.author as Record<string, unknown> | undefined)
            : undefined

        const snapshot: GitHubRepoSnapshot = {
          id: String(repoResponse.id ?? `${repoRef.owner}/${repoRef.repo}`),
          full_name: String(repoResponse.full_name ?? `${repoRef.owner}/${repoRef.repo}`),
          repo: repoRef.repo,
          url: String(repoResponse.html_url ?? repoRef.url),
          description: clean(String(repoResponse.description ?? '')),
          default_branch: clean(String(repoResponse.default_branch ?? '')),
          pushed_at: clean(String(repoResponse.pushed_at ?? '')),
          updated_at: clean(String(repoResponse.updated_at ?? '')),
          open_issues_count: Number(repoResponse.open_issues_count ?? 0),
          stargazers_count: Number(repoResponse.stargazers_count ?? 0),
          latest_commit_sha: clean(String(latestCommit?.sha ?? '')),
          latest_commit_message: clean(String(commitInfo?.message ?? '')),
          latest_commit_date: clean(String(authorInfo?.date ?? ''))
        }

        snapshots.push(snapshot)
        upsertGitHubCapture(snapshot)
      }

      const account = upsertAccountByType(
        'github',
        `GitHub CLI${cliStatus.login ? ` · ${cliStatus.login}` : ''}`,
        {
          login: cliStatus.login,
          repo_urls: repoRefs.map((entry) => entry.url),
          last_synced_at: Date.now(),
          last_error: null,
          repos: snapshots
        } satisfies GitHubAccountConfig
      )

      return finishSyncJob(
        jobId,
        'success',
        `Synced ${snapshots.length} GitHub repo${snapshots.length === 1 ? '' : 's'} via GitHub CLI.`,
        {
          account_id: account.id,
          repos: snapshots.map((entry) => ({
            full_name: entry.full_name,
            latest_commit_sha: entry.latest_commit_sha,
            latest_commit_date: entry.latest_commit_date
          }))
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GitHub sync failed.'
      const current = findAccountByType('github')

      if (current) {
        const config = parseJsonObject<GitHubAccountConfig>(current.config_json)
        updateAccountConfig(current.id, {
          ...config,
          login: cliStatus.login,
          repo_urls: settings.github_monitored_repos,
          last_error: message
        })
      }

      return finishSyncJob(jobId, 'error', message)
    }
  },

  async connectGoogleCalendar(clientId?: string): Promise<GoogleCalendarConnectionResult> {
    const settings = settingsQueries.getBundle().integration_settings
    const resolvedClientId = clean(clientId) ?? clean(settings.google_oauth_client_id) ?? ''

    if (!resolvedClientId) {
      throw new Error('Add your Google OAuth client ID in Settings before connecting Calendar.')
    }

    const { code, redirectUri } = await waitForGoogleOAuthCode(resolvedClientId)
    const tokens = await exchangeGoogleCodeForTokens(resolvedClientId, code, redirectUri)
    const userInfo = await fetchGoogleJson<{ email?: string }>(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      tokens.access_token
    )

    const email = clean(userInfo.email) ?? clean(settings.google_calendar_email) ?? 'primary'
    const calendarId = clean(settings.google_calendar_email) ?? email
    const source = calendarQueries.upsertGoogleSource({
      label: `Google Calendar · ${email}`,
      source_value: calendarId
    })
    const account = upsertAccountByType('google_calendar', `Google Calendar · ${email}`, {
      email,
      calendar_id: calendarId,
      client_id: resolvedClientId,
      source_id: source.id,
      scopes: GOOGLE_SCOPES,
      last_synced_at: undefined,
      last_error: null
    } satisfies GoogleCalendarAccountConfig)

    setGoogleTokens(account.id, tokens)
    settingsQueries.updateIntegrationSettings({
      google_calendar_email: email,
      google_oauth_client_id: resolvedClientId
    })

    await this.syncGoogleCalendar(account.id)

    return {
      account: findAccountByType('google_calendar') ?? account,
      source: calendarQueries.getSource(source.id) ?? source
    }
  },

  async syncGoogleCalendar(accountId?: string): Promise<SyncJob> {
    const account =
      (accountId ? this.listAccounts().find((entry) => entry.id === accountId) : null) ??
      findAccountByType('google_calendar')

    if (!account) {
      throw new Error('Connect Google Calendar before syncing it.')
    }

    const config = parseJsonObject<GoogleCalendarAccountConfig>(account.config_json)
    const sourceId = clean(config.source_id)
    const calendarId = clean(config.calendar_id) ?? clean(config.email) ?? 'primary'
    const clientId =
      clean(config.client_id) ??
      clean(settingsQueries.getBundle().integration_settings.google_oauth_client_id)

    if (!sourceId || !clientId) {
      throw new Error('Google Calendar account is missing source or OAuth client details.')
    }

    const jobId = startSyncJob('google_calendar', account.label, {
      account_id: account.id,
      calendar_id: calendarId
    })

    try {
      const tokens = await getValidGoogleTokens(account)
      const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      const events: Array<{
        external_id: string
        title: string
        starts_at: number
        ends_at: number | null
        location: string | null
        notes: string | null
      }> = []
      let pageToken: string | null = null

      do {
        const url = new URL(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
        )
        url.searchParams.set('singleEvents', 'true')
        url.searchParams.set('orderBy', 'startTime')
        url.searchParams.set('timeMin', timeMin)
        url.searchParams.set('timeMax', timeMax)
        url.searchParams.set('maxResults', '2500')
        if (pageToken) {
          url.searchParams.set('pageToken', pageToken)
        }

        const response = await fetchGoogleJson<{
          items?: Array<{
            id?: string
            summary?: string
            description?: string
            location?: string
            start?: { dateTime?: string; date?: string }
            end?: { dateTime?: string; date?: string }
          }>
          nextPageToken?: string
        }>(url.toString(), tokens.access_token)

        for (const item of response.items ?? []) {
          const startRaw = item.start?.dateTime ?? item.start?.date
          if (!startRaw) {
            continue
          }

          const endRaw = item.end?.dateTime ?? item.end?.date ?? null
          const startsAt = Date.parse(
            item.start?.dateTime ? item.start.dateTime : `${item.start?.date}T00:00:00.000Z`
          )
          const endsAt = endRaw
            ? Date.parse(item.end?.dateTime ? item.end.dateTime : `${item.end?.date}T00:00:00.000Z`)
            : null

          if (Number.isNaN(startsAt)) {
            continue
          }

          events.push({
            external_id: clean(item.id) ?? ulid(),
            title: clean(item.summary) ?? 'Untitled event',
            starts_at: startsAt,
            ends_at: endsAt && !Number.isNaN(endsAt) ? endsAt : null,
            location: clean(item.location),
            notes: clean(item.description)
          })
        }

        pageToken = clean(response.nextPageToken)
      } while (pageToken)

      const source = calendarQueries.replaceEvents(sourceId, events)
      const nextConfig: GoogleCalendarAccountConfig = {
        email: clean(config.email) ?? calendarId,
        calendar_id: calendarId,
        client_id: clientId,
        source_id: source.id,
        scopes: Array.isArray(config.scopes) ? config.scopes.map(String) : GOOGLE_SCOPES,
        last_synced_at: Date.now(),
        last_error: null
      }
      updateAccountConfig(account.id, nextConfig)

      return finishSyncJob(
        jobId,
        'success',
        `Synced ${events.length} Google Calendar event${events.length === 1 ? '' : 's'}.`,
        {
          account_id: account.id,
          source_id: source.id,
          event_count: events.length
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Calendar sync failed.'
      calendarQueries.markSourceError(sourceId, message)
      updateAccountConfig(account.id, {
        ...config,
        last_error: message
      })
      return finishSyncJob(jobId, 'error', message)
    }
  },

  disconnectGoogleCalendar(accountId: string): { ok: boolean } {
    const account = this.listAccounts().find((entry) => entry.id === accountId)
    if (!account || account.type !== 'google_calendar') {
      throw new Error('Google Calendar account not found')
    }

    const config = parseJsonObject<GoogleCalendarAccountConfig>(account.config_json)
    removeGoogleTokens(account.id)
    if (config.source_id) {
      calendarQueries.deleteSource(config.source_id)
    }

    return this.deleteAccount(accountId)
  },

  listWatchFolders(): WatchFolder[] {
    ensureDefaultWatchFolder()
    const db = getDb()
    return db
      .select()
      .from(watchFoldersTable)
      .orderBy(asc(watchFoldersTable.label))
      .all()
      .map(deserializeWatchFolder)
  },

  createWatchFolder(input: CreateWatchFolderInput): WatchFolder {
    const db = getDb()
    const id = ulid()
    const now = Date.now()

    db.insert(watchFoldersTable)
      .values({
        id,
        label: input.label.trim(),
        folder_path: input.folder_path.trim(),
        mode: input.mode ?? 'library_documents',
        project_id: input.project_id ?? null,
        enabled: input.enabled ?? true,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeWatchFolder(
      db.select().from(watchFoldersTable).where(eq(watchFoldersTable.id, id)).get()!
    )
  },

  updateWatchFolder(input: UpdateWatchFolderInput): WatchFolder {
    const db = getDb()
    const current = db.select().from(watchFoldersTable).where(eq(watchFoldersTable.id, input.id)).get()

    if (!current) {
      throw new Error('Watch folder not found')
    }

    db.update(watchFoldersTable)
      .set({
        label: input.label?.trim() || current.label,
        folder_path: input.folder_path?.trim() || current.folder_path,
        mode: input.mode ?? current.mode,
        project_id: input.project_id === undefined ? current.project_id : input.project_id,
        enabled: input.enabled ?? current.enabled,
        updated_at: Date.now()
      })
      .where(eq(watchFoldersTable.id, input.id))
      .run()

    return deserializeWatchFolder(
      db.select().from(watchFoldersTable).where(eq(watchFoldersTable.id, input.id)).get()!
    )
  },

  deleteWatchFolder(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(watchFoldersTable).where(eq(watchFoldersTable.id, id)).run()
    return { ok: true }
  },

  listSyncJobs(): SyncJob[] {
    const db = getDb()
    return db
      .select()
      .from(syncJobsTable)
      .orderBy(desc(syncJobsTable.started_at))
      .all()
      .map(deserializeSyncJob)
  },

  async syncWatchFolder(id: string): Promise<SyncJob> {
    const folder = this.listWatchFolders().find((entry) => entry.id === id)

    if (!folder) {
      throw new Error('Watch folder not found')
    }

    if (!folder.enabled) {
      throw new Error('Watch folder is disabled')
    }

    const jobId = startSyncJob('watch_folder', folder.label, {
      folder_path: folder.folder_path,
      mode: folder.mode
    })

    try {
      const files = listFiles(folder.folder_path)
      let imported = 0

      if (folder.mode === 'library_documents') {
        const documentFiles = files.filter((filePath) =>
          ['.docx', '.md', '.txt'].includes(path.extname(filePath).toLowerCase())
        )
        if (documentFiles.length > 0) {
          await libraryQueries.importDocuments({ file_paths: documentFiles })
          imported = documentFiles.length
        }
      } else if (folder.mode === 'project_assets' && folder.project_id) {
        const assetFiles = files.filter((filePath) => fs.statSync(filePath).size > 0)
        for (const filePath of assetFiles) {
          assetQueries.import({ projectId: folder.project_id, srcPath: filePath })
        }
        imported = assetFiles.length
      }

      return finishSyncJob(
        jobId,
        'success',
        `Imported ${imported} file${imported === 1 ? '' : 's'}.`,
        {
          folder_path: folder.folder_path,
          imported
        }
      )
    } catch (error) {
      return finishSyncJob(
        jobId,
        'error',
        error instanceof Error ? error.message : 'Watch-folder sync failed.'
      )
    }
  }
}
