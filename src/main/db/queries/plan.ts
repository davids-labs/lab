import { asc, eq, inArray } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CreatePlanLinkInput,
  CreatePlanNodeInput,
  PlanNode,
  PlanNodeDetail,
  PlanNodeLink,
  UpdatePlanNodeInput
} from '../../../preload/types'
import {
  validateCreatePlanLinkInput,
  validateCreatePlanNodeInput,
  validateUpdatePlanNodeInput
} from '@shared/commandValidation'
import { getBlockingReasonsForNode } from '../../services/insights'
import { getDb } from '../index'
import {
  countdownItemsTable,
  planNodeLinksTable,
  planNodesTable,
  type PlanNodeLinkRow,
  type PlanNodeRow
} from '../schema'
import { projectQueries } from './projects'
import { skillQueries } from './skills'

function deserializeNode(row: PlanNodeRow): PlanNode {
  return {
    ...row,
    summary: row.summary ?? null,
    parent_id: row.parent_id ?? null,
    horizon_year: row.horizon_year ?? null,
    start_at: row.start_at ?? null,
    due_at: row.due_at ?? null,
    notes: row.notes ?? null,
    kind: row.kind as PlanNode['kind'],
    status: row.status as PlanNode['status']
  }
}

function deserializeLink(row: PlanNodeLinkRow): PlanNodeLink {
  return {
    ...row,
    required_stage: (row.required_stage as PlanNodeLink['required_stage']) ?? null,
    notes: row.notes ?? null,
    target_type: row.target_type as PlanNodeLink['target_type']
  }
}

function nextSortOrder(entries: Array<{ sort_order: number }>): number {
  if (entries.length === 0) {
    return 0
  }

  return Math.max(...entries.map((entry) => entry.sort_order)) + 1
}

function collectDescendants(nodeId: string, nodes: PlanNode[]): string[] {
  const directChildren = nodes.filter((node) => node.parent_id === nodeId)
  const descendantIds = directChildren.map((child) => child.id)

  for (const child of directChildren) {
    descendantIds.push(...collectDescendants(child.id, nodes))
  }

  return descendantIds
}

export const planQueries = {
  listNodes(): PlanNode[] {
    const db = getDb()
    return db.select().from(planNodesTable).orderBy(asc(planNodesTable.sort_order)).all().map(deserializeNode)
  },

  listLinks(nodeId?: string): PlanNodeLink[] {
    const db = getDb()
    const rows = nodeId
      ? db
          .select()
          .from(planNodeLinksTable)
          .where(eq(planNodeLinksTable.node_id, nodeId))
          .orderBy(asc(planNodeLinksTable.created_at))
          .all()
      : db
          .select()
          .from(planNodeLinksTable)
          .orderBy(asc(planNodeLinksTable.created_at))
          .all()

    return rows.map(deserializeLink)
  },

  getNode(id: string): PlanNodeDetail {
    const db = getDb()
    const nodeRow = db.select().from(planNodesTable).where(eq(planNodesTable.id, id)).get()

    if (!nodeRow) {
      throw new Error('Plan node not found')
    }

    const allNodes = this.listNodes()
    const allLinks = this.listLinks()
    const node = deserializeNode(nodeRow)
    const children = allNodes
      .filter((entry) => entry.parent_id === id)
      .sort((left, right) => left.sort_order - right.sort_order)
    const links = allLinks.filter((entry) => entry.node_id === id)
    const countdownRows = db.select().from(countdownItemsTable).all()
    const skillNodes = skillQueries.listNodes()

    return {
      node,
      children,
      links,
      blocking_reasons: getBlockingReasonsForNode(
        node,
        links,
        new Map(allNodes.map((entry) => [entry.id, entry])),
        new Map(projectQueries.list().map((entry) => [entry.id, entry])),
        new Map(skillNodes.map((entry) => [entry.id, entry])),
        new Map(
          countdownRows.map((entry) => [
            entry.id,
            {
              ...entry,
              notes: entry.notes ?? null
            }
          ])
        )
      )
    }
  },

  createNode(input: CreatePlanNodeInput): PlanNode {
    const db = getDb()
    const parsed = validateCreatePlanNodeInput(input)
    const siblings = this.listNodes().filter((entry) => entry.parent_id === (parsed.parent_id ?? null))
    const now = Date.now()
    const id = ulid()

    db.insert(planNodesTable)
      .values({
        id,
        title: parsed.title,
        summary: parsed.summary ?? null,
        kind: parsed.kind,
        status: parsed.status ?? 'not_started',
        parent_id: parsed.parent_id ?? null,
        horizon_year: parsed.horizon_year ?? null,
        start_at: parsed.start_at ?? null,
        due_at: parsed.due_at ?? null,
        notes: parsed.notes ?? null,
        sort_order: parsed.sort_order ?? nextSortOrder(siblings),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeNode(db.select().from(planNodesTable).where(eq(planNodesTable.id, id)).get()!)
  },

  updateNode(input: UpdatePlanNodeInput): PlanNode {
    const db = getDb()
    const parsed = validateUpdatePlanNodeInput(input)
    const current = db.select().from(planNodesTable).where(eq(planNodesTable.id, parsed.id)).get()

    if (!current) {
      throw new Error('Plan node not found')
    }

    db.update(planNodesTable)
      .set({
        title: parsed.title ?? current.title,
        summary: parsed.summary === undefined ? current.summary : parsed.summary,
        kind: parsed.kind ?? current.kind,
        status: parsed.status ?? current.status,
        parent_id: parsed.parent_id === undefined ? current.parent_id : parsed.parent_id,
        horizon_year:
          parsed.horizon_year === undefined ? current.horizon_year : parsed.horizon_year,
        start_at: parsed.start_at === undefined ? current.start_at : parsed.start_at,
        due_at: parsed.due_at === undefined ? current.due_at : parsed.due_at,
        notes: parsed.notes === undefined ? current.notes : parsed.notes,
        sort_order: parsed.sort_order ?? current.sort_order,
        updated_at: Date.now()
      })
      .where(eq(planNodesTable.id, parsed.id))
      .run()

    return deserializeNode(
      db.select().from(planNodesTable).where(eq(planNodesTable.id, parsed.id)).get()!
    )
  },

  deleteNode(id: string): { ok: boolean } {
    const db = getDb()
    const allNodes = this.listNodes()
    const idsToDelete = [id, ...collectDescendants(id, allNodes)]

    if (idsToDelete.length > 0) {
      db.delete(planNodeLinksTable).where(inArray(planNodeLinksTable.node_id, idsToDelete)).run()
      db.delete(planNodesTable).where(inArray(planNodesTable.id, idsToDelete)).run()
    }

    return { ok: true }
  },

  createLink(input: CreatePlanLinkInput): PlanNodeLink {
    const db = getDb()
    const parsed = validateCreatePlanLinkInput(input)
    const id = ulid()
    const now = Date.now()

    db.insert(planNodeLinksTable)
      .values({
        id,
        node_id: parsed.node_id,
        target_type: parsed.target_type,
        target_id: parsed.target_id,
        required_stage: parsed.required_stage ?? null,
        notes: parsed.notes ?? null,
        created_at: now
      })
      .run()

    return deserializeLink(
      db.select().from(planNodeLinksTable).where(eq(planNodeLinksTable.id, id)).get()!
    )
  },

  deleteLink(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(planNodeLinksTable).where(eq(planNodeLinksTable.id, id)).run()
    return { ok: true }
  }
}
