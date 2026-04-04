import { desc, eq } from 'drizzle-orm'
import type { Asset, AssetImportInput } from '../../../preload/types'
import { validateAssetImportInput } from '@shared/validation'
import { getDb } from '../index'
import { assetsTable, type AssetRow } from '../schema'
import { getAssetDataUri, importAssetFile, removeAssetFile } from '../../services/assetManager'
import { projectQueries } from './projects'

function deserializeAsset(row: AssetRow): Asset {
  return {
    ...row,
    tags: JSON.parse(row.tags)
  }
}

export const assetQueries = {
  list(projectId: string): Asset[] {
    const db = getDb()
    return db
      .select()
      .from(assetsTable)
      .where(eq(assetsTable.project_id, projectId))
      .orderBy(desc(assetsTable.created_at))
      .all()
      .map(deserializeAsset)
  },

  get(id: string): Asset {
    const db = getDb()
    const row = db.select().from(assetsTable).where(eq(assetsTable.id, id)).get()

    if (!row) {
      throw new Error('Asset not found')
    }

    return deserializeAsset(row)
  },

  import(input: AssetImportInput): Asset {
    const db = getDb()
    const parsed = validateAssetImportInput(input)
    const asset = importAssetFile(parsed.projectId, parsed.srcPath, parsed.tags ?? [])

    db.insert(assetsTable)
      .values({
        id: asset.id,
        project_id: asset.project_id,
        filename: asset.filename,
        stored_path: asset.stored_path,
        mime_type: asset.mime_type,
        size_bytes: asset.size_bytes,
        tags: JSON.stringify(asset.tags),
        created_at: asset.created_at
      })
      .run()

    projectQueries.touch(parsed.projectId)
    return asset
  },

  delete(id: string): { ok: boolean } {
    const db = getDb()
    const asset = this.get(id)
    removeAssetFile(asset.stored_path)
    db.delete(assetsTable).where(eq(assetsTable.id, id)).run()
    projectQueries.touch(asset.project_id)
    return { ok: true }
  },

  getDataUri(id: string): string {
    return getAssetDataUri(this.get(id))
  }
}
