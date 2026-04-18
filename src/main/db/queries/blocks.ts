import { asc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type { Block, UpsertBlockInput } from '../../../preload/types'
import { createDefaultBlockData, getDefaultVisibility } from '@shared/defaults'
import { calculateNextSortOrder } from '@shared/fractionalOrder'
import {
  parseBlockData,
  validateReorderBlocksInput,
  validateUpsertBlockInput
} from '@shared/validation'
import { getDb, getSqlite } from '../index'
import { blocksTable, type BlockRow } from '../schema'
import { projectQueries } from './projects'

function deserializeBlock(row: BlockRow): Block {
  return {
    ...row,
    type: row.type as Block['type'],
    visible_on_page: Boolean(row.visible_on_page),
    data: parseBlockData(row.type as Block['type'], JSON.parse(row.data))
  }
}

export const blockQueries = {
  list(projectId: string): Block[] {
    const db = getDb()
    return db
      .select()
      .from(blocksTable)
      .where(eq(blocksTable.project_id, projectId))
      .orderBy(asc(blocksTable.sort_order))
      .all()
      .map(deserializeBlock)
  },

  get(id: string): Block {
    const db = getDb()
    const row = db.select().from(blocksTable).where(eq(blocksTable.id, id)).get()

    if (!row) {
      throw new Error('Block not found')
    }

    return deserializeBlock(row)
  },

  upsert(input: UpsertBlockInput): Block {
    const db = getDb()
    const parsed = validateUpsertBlockInput(input)
    const existing = parsed.id
      ? db.select().from(blocksTable).where(eq(blocksTable.id, parsed.id)).get()
      : null
    const now = Date.now()

    if (existing) {
      const current = deserializeBlock(existing)
      const nextData = parseBlockData(
        current.type,
        parsed.data ?? current.data ?? createDefaultBlockData(current.type)
      )

      db.update(blocksTable)
        .set({
          type: parsed.type ?? current.type,
          sort_order: parsed.sort_order ?? current.sort_order,
          grid_col: parsed.grid_col ?? current.grid_col,
          grid_col_span: parsed.grid_col_span ?? current.grid_col_span,
          visible_on_page: parsed.visible_on_page ?? current.visible_on_page,
          data: JSON.stringify(nextData),
          updated_at: now
        })
        .where(eq(blocksTable.id, existing.id))
        .run()

      const updated = this.get(existing.id)
      projectQueries.resyncSections(updated.project_id, this.list(updated.project_id))
      projectQueries.touch(updated.project_id)
      return updated
    }

    const sortOrder =
      parsed.sort_order ??
      calculateNextSortOrder(this.list(parsed.project_id).map((block) => block.sort_order))
    const nextData = parseBlockData(parsed.type, parsed.data ?? createDefaultBlockData(parsed.type))
    const id = ulid()

    db.insert(blocksTable)
      .values({
        id,
        project_id: parsed.project_id,
        type: parsed.type,
        sort_order: sortOrder,
        grid_col: parsed.grid_col ?? 0,
        grid_col_span: parsed.grid_col_span ?? 1,
        visible_on_page: parsed.visible_on_page ?? getDefaultVisibility(parsed.type),
        data: JSON.stringify(nextData),
        created_at: now,
        updated_at: now
      })
      .run()

    const created = this.get(id)
    projectQueries.resyncSections(created.project_id, this.list(created.project_id))
    projectQueries.touch(created.project_id)
    return created
  },

  delete(id: string): { ok: boolean } {
    const db = getDb()
    const block = this.get(id)
    db.delete(blocksTable).where(eq(blocksTable.id, id)).run()
    projectQueries.resyncSections(block.project_id, this.list(block.project_id))
    projectQueries.touch(block.project_id)
    return { ok: true }
  },

  reorder(input: unknown): { ok: boolean } {
    const db = getDb()
    const parsed = validateReorderBlocksInput(input)
    const projectBlocks = this.list(parsed.projectId)
    const projectIds = projectBlocks.map((block) => block.id)
    const orderedIds = parsed.orderedIds

    if (
      orderedIds.length !== projectIds.length ||
      new Set(orderedIds).size !== orderedIds.length ||
      projectIds.some((id) => !orderedIds.includes(id))
    ) {
      throw new Error('Block reorder request does not match the blocks owned by this project.')
    }

    const now = Date.now()

    getSqlite().transaction(() => {
      orderedIds.forEach((id, index) => {
        db.update(blocksTable)
          .set({
            sort_order: index + 1,
            updated_at: now
          })
          .where(eq(blocksTable.id, id))
          .run()
      })

      projectQueries.resyncSections(parsed.projectId, this.list(parsed.projectId))
      projectQueries.touch(parsed.projectId)
    })()

    return { ok: true }
  }
}
