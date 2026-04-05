import path from 'node:path'
import type { Asset } from '../preload/types'

export type AssetKind = 'cad' | 'file' | 'image'

const CAD_EXTENSIONS = new Set(['.obj', '.stl', '.step', '.stp'])
const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

export function getAssetExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

export function getAssetKind(input: Pick<Asset, 'filename' | 'mime_type'>): AssetKind {
  const extension = getAssetExtension(input.filename)

  if (input.mime_type.startsWith('image/') || IMAGE_EXTENSIONS.has(extension)) {
    return 'image'
  }

  if (CAD_EXTENSIONS.has(extension)) {
    return 'cad'
  }

  return 'file'
}

export function shouldLocallyProcessImage(input: Pick<Asset, 'filename' | 'mime_type'>): boolean {
  const extension = getAssetExtension(input.filename)
  return (
    (input.mime_type.startsWith('image/') || IMAGE_EXTENSIONS.has(extension)) &&
    extension !== '.svg'
  )
}
