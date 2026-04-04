import fs from 'node:fs'
import path from 'node:path'
import { lookup } from 'mime-types'
import { ulid } from 'ulidx'
import type { Asset } from '../../preload/types'
import { assertPathInsideProjects, ensureProjectDirectories, getProjectAssetsDir } from './appPaths'

function sanitiseFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export function importAssetFile(projectId: string, srcPath: string, tags: string[] = []): Asset {
  ensureProjectDirectories(projectId)

  const filename = path.basename(srcPath)
  const safeFilename = sanitiseFilename(filename)
  const id = ulid()
  const storedPath = path.join(getProjectAssetsDir(projectId), `${id}-${safeFilename}`)

  fs.copyFileSync(srcPath, storedPath)

  const stat = fs.statSync(storedPath)
  const mimeType = lookup(safeFilename) || 'application/octet-stream'

  return {
    id,
    project_id: projectId,
    filename,
    stored_path: storedPath,
    mime_type: mimeType,
    size_bytes: stat.size,
    tags,
    created_at: Date.now()
  }
}

export function removeAssetFile(storedPath: string): void {
  assertPathInsideProjects(storedPath)
  fs.rmSync(storedPath, { force: true })
}

export function getAssetDataUri(asset: Pick<Asset, 'mime_type' | 'stored_path'>): string {
  const buffer = fs.readFileSync(asset.stored_path)
  return `data:${asset.mime_type};base64,${buffer.toString('base64')}`
}
