import fs from 'node:fs'
import path from 'node:path'
import { nativeImage } from 'electron'
import { lookup } from 'mime-types'
import { ulid } from 'ulidx'
import type { Asset } from '../../preload/types'
import { getAssetKind, shouldLocallyProcessImage } from '@shared/assets'
import { assertPathInsideProjects, ensureProjectDirectories, getProjectAssetsDir } from './appPaths'

function sanitiseFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function getProcessedImageConfig(srcPath: string): {
  extension: '.jpg' | '.png'
  mimeType: 'image/jpeg' | 'image/png'
} {
  const originalExtension = path.extname(srcPath).toLowerCase()
  const usePng = originalExtension === '.png' || originalExtension === '.gif'

  return usePng
    ? { extension: '.png', mimeType: 'image/png' }
    : { extension: '.jpg', mimeType: 'image/jpeg' }
}

function writeProcessedImage(
  srcPath: string,
  destinationPath: string
): {
  mimeType: 'image/jpeg' | 'image/png'
} {
  const image = nativeImage.createFromPath(srcPath)
  if (image.isEmpty()) {
    throw new Error('Unable to decode this image for local processing.')
  }

  const size = image.getSize()
  const largestEdge = Math.max(size.width, size.height)
  const scale = largestEdge > 2400 ? 2400 / largestEdge : 1
  const targetWidth = Math.max(1, Math.round(size.width * scale))
  const targetHeight = Math.max(1, Math.round(size.height * scale))
  const resized =
    scale < 1
      ? image.resize({
          width: targetWidth,
          height: targetHeight,
          quality: 'best'
        })
      : image
  const config = getProcessedImageConfig(srcPath)
  const buffer = config.mimeType === 'image/png' ? resized.toPNG() : resized.toJPEG(82)

  fs.writeFileSync(destinationPath, buffer)
  return { mimeType: config.mimeType }
}

export function importAssetFile(projectId: string, srcPath: string, tags: string[] = []): Asset {
  ensureProjectDirectories(projectId)

  const filename = path.basename(srcPath)
  const safeFilename = sanitiseFilename(filename)
  const id = ulid()
  const initialMimeType = lookup(safeFilename) || 'application/octet-stream'
  const inferredKind = getAssetKind({ filename, mime_type: initialMimeType })
  const localTags = [...new Set([...tags, inferredKind])]
  const assetDir = getProjectAssetsDir(projectId)

  let storedFilename = `${id}-${safeFilename}`
  let storedPath = path.join(assetDir, storedFilename)
  let mimeType = String(initialMimeType)

  if (shouldLocallyProcessImage({ filename, mime_type: mimeType })) {
    const processed = getProcessedImageConfig(srcPath)
    const basename = path.basename(safeFilename, path.extname(safeFilename))
    storedFilename = `${id}-${basename}${processed.extension}`
    storedPath = path.join(assetDir, storedFilename)
    mimeType = writeProcessedImage(srcPath, storedPath).mimeType
    localTags.push('processed')
  } else {
    fs.copyFileSync(srcPath, storedPath)
  }

  const stat = fs.statSync(storedPath)

  return {
    id,
    project_id: projectId,
    filename,
    stored_path: storedPath,
    mime_type: mimeType,
    size_bytes: stat.size,
    tags: [...new Set(localTags)],
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
