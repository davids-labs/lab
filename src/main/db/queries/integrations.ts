import fs from 'node:fs'
import path from 'node:path'
import { asc, desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CreateIntegrationAccountInput,
  CreateWatchFolderInput,
  IntegrationAccount,
  SyncJob,
  UpdateIntegrationAccountInput,
  UpdateWatchFolderInput,
  WatchFolder
} from '../../../preload/types'
import { getDb } from '../index'
import {
  integrationAccountsTable,
  syncJobsTable,
  watchFoldersTable,
  type IntegrationAccountRow,
  type SyncJobRow,
  type WatchFolderRow
} from '../schema'
import { libraryQueries } from './library'
import { assetQueries } from './assets'

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

function listFiles(folderPath: string): string[] {
  return fs
    .readdirSync(folderPath)
    .map((name) => path.join(folderPath, name))
    .filter((entry) => fs.statSync(entry).isFile())
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
    db.delete(integrationAccountsTable).where(eq(integrationAccountsTable.id, id)).run()
    return { ok: true }
  },

  listWatchFolders(): WatchFolder[] {
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
    const db = getDb()
    const folder = this.listWatchFolders().find((entry) => entry.id === id)

    if (!folder) {
      throw new Error('Watch folder not found')
    }

    if (!folder.enabled) {
      throw new Error('Watch folder is disabled')
    }

    const jobId = ulid()
    const startedAt = Date.now()

    db.insert(syncJobsTable)
      .values({
        id: jobId,
        integration_type: 'watch_folder',
        status: 'running',
        label: folder.label,
        summary: null,
        metadata_json: JSON.stringify({ folder_path: folder.folder_path, mode: folder.mode }),
        started_at: startedAt,
        finished_at: null
      })
      .run()

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

      db.update(syncJobsTable)
        .set({
          status: 'success',
          summary: `Imported ${imported} file${imported === 1 ? '' : 's'}.`,
          finished_at: Date.now()
        })
        .where(eq(syncJobsTable.id, jobId))
        .run()
    } catch (error) {
      db.update(syncJobsTable)
        .set({
          status: 'error',
          summary: error instanceof Error ? error.message : 'Watch-folder sync failed.',
          finished_at: Date.now()
        })
        .where(eq(syncJobsTable.id, jobId))
        .run()
    }

    return deserializeSyncJob(
      db.select().from(syncJobsTable).where(eq(syncJobsTable.id, jobId)).get()!
    )
  }
}
