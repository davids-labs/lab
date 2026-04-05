import { asc, eq, inArray } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  CreateSkillDomainInput,
  CreateSkillEvidenceInput,
  CreateSkillNodeInput,
  ProjectExecutionStage,
  SkillCoverageByDomain,
  SkillCoverageSummary,
  SkillDomain,
  SkillDomainSummary,
  SkillEvidence,
  SkillEvidenceStatus,
  SkillNode,
  SkillNodeDetail,
  SkillNodeSummary,
  SkillState,
  UpdateSkillDomainInput,
  UpdateSkillEvidenceInput,
  UpdateSkillNodeInput
} from '../../../preload/types'
import { PROJECT_EXECUTION_STAGES } from '../../../preload/types'
import {
  validateCreateSkillDomainInput,
  validateCreateSkillEvidenceInput,
  validateCreateSkillNodeInput,
  validateUpdateSkillDomainInput,
  validateUpdateSkillEvidenceInput,
  validateUpdateSkillNodeInput
} from '@shared/commandValidation'
import { getDb } from '../index'
import {
  projectsTable,
  skillDomainsTable,
  skillEvidenceTable,
  skillNodesTable,
  type SkillDomainRow,
  type SkillEvidenceRow,
  type SkillNodeRow
} from '../schema'

function deserializeDomain(row: SkillDomainRow): SkillDomain {
  return {
    ...row,
    description: row.description ?? null
  }
}

function deserializeNode(row: SkillNodeRow): SkillNode {
  return {
    ...row,
    description: row.description ?? null
  }
}

function deserializeEvidence(row: SkillEvidenceRow): SkillEvidence {
  return {
    ...row,
    notes: row.notes ?? null,
    project_id: row.project_id ?? null,
    certification_name: row.certification_name ?? null,
    link_url: row.link_url ?? null,
    required_stage: (row.required_stage as SkillEvidence['required_stage']) ?? null,
    confirmed_at: row.confirmed_at ?? null,
    status: row.status as SkillEvidenceStatus,
    source_type: row.source_type as SkillEvidence['source_type']
  }
}

function compareStage(
  left: ProjectExecutionStage | null | undefined,
  right: ProjectExecutionStage | null | undefined
): number {
  const leftIndex = PROJECT_EXECUTION_STAGES.indexOf((left ?? 'ideation') as ProjectExecutionStage)
  const rightIndex = PROJECT_EXECUTION_STAGES.indexOf(
    (right ?? 'ideation') as ProjectExecutionStage
  )
  return leftIndex - rightIndex
}

function meetsRequiredStage(
  stage: ProjectExecutionStage | null | undefined,
  requiredStage: ProjectExecutionStage | null | undefined
): boolean {
  return compareStage(stage, requiredStage ?? 'ideation') >= 0
}

function nextSortOrder(values: Array<{ sort_order: number }>): number {
  if (values.length === 0) {
    return 0
  }

  return Math.max(...values.map((value) => value.sort_order)) + 1
}

function deriveSkillState(evidence: SkillEvidence[]): SkillState {
  if (evidence.some((entry) => entry.status === 'confirmed')) {
    return 'verified'
  }

  if (evidence.length > 0) {
    return 'in_progress'
  }

  return 'unverified'
}

function toNodeSummary(node: SkillNode, evidence: SkillEvidence[]): SkillNodeSummary {
  return {
    ...node,
    state: deriveSkillState(evidence),
    suggestion_count: evidence.filter((entry) => entry.status === 'suggested').length,
    evidence_count: evidence.length
  }
}

async function resolveSuggestedStatus(
  input: Pick<CreateSkillEvidenceInput | UpdateSkillEvidenceInput, 'project_id' | 'required_stage'>
): Promise<SkillEvidenceStatus> {
  if (!input.project_id) {
    return 'attached'
  }

  const db = getDb()
  const project = db.select().from(projectsTable).where(eq(projectsTable.id, input.project_id)).get()
  if (!project) {
    return 'attached'
  }

  return meetsRequiredStage(project.execution_stage as ProjectExecutionStage, input.required_stage)
    ? 'suggested'
    : 'attached'
}

function groupEvidenceBySkill(evidence: SkillEvidence[]): Map<string, SkillEvidence[]> {
  const grouped = new Map<string, SkillEvidence[]>()

  for (const entry of evidence) {
    const current = grouped.get(entry.skill_id) ?? []
    current.push(entry)
    grouped.set(entry.skill_id, current)
  }

  return grouped
}

export function buildSkillCoverageSummary(
  domains: SkillDomain[],
  nodes: SkillNodeSummary[]
): SkillCoverageSummary {
  const byDomain = new Map<string, SkillNodeSummary[]>()

  for (const node of nodes) {
    const current = byDomain.get(node.domain_id) ?? []
    current.push(node)
    byDomain.set(node.domain_id, current)
  }

  const domainCoverage: SkillCoverageByDomain[] = domains.map((domain) => {
    const entries = byDomain.get(domain.id) ?? []
    const verified = entries.filter((node) => node.state === 'verified').length
    const inProgress = entries.filter((node) => node.state === 'in_progress').length
    const unverified = entries.filter((node) => node.state === 'unverified').length
    const total = entries.length

    return {
      domain_id: domain.id,
      title: domain.title,
      verified,
      in_progress: inProgress,
      unverified,
      total,
      coverage: total === 0 ? 0 : verified / total
    }
  })

  const total = nodes.length
  const verified = nodes.filter((node) => node.state === 'verified').length
  const inProgress = nodes.filter((node) => node.state === 'in_progress').length
  const unverified = nodes.filter((node) => node.state === 'unverified').length

  return {
    total,
    verified,
    in_progress: inProgress,
    unverified,
    domains: domainCoverage
  }
}

export const skillQueries = {
  listDomains(): SkillDomainSummary[] {
    const db = getDb()
    const domains = db.select().from(skillDomainsTable).orderBy(asc(skillDomainsTable.sort_order)).all()
    const nodes = this.listNodes()

    return domains.map((row) => {
      const entries = nodes.filter((node) => node.domain_id === row.id)
      return {
        ...deserializeDomain(row),
        total_nodes: entries.length,
        verified_nodes: entries.filter((node) => node.state === 'verified').length,
        in_progress_nodes: entries.filter((node) => node.state === 'in_progress').length,
        unverified_nodes: entries.filter((node) => node.state === 'unverified').length
      }
    })
  },

  getCoverageSummary(): SkillCoverageSummary {
    const domains = this.listDomains().map((domain) => ({
      id: domain.id,
      title: domain.title,
      description: domain.description,
      sort_order: domain.sort_order,
      created_at: domain.created_at,
      updated_at: domain.updated_at
    }))
    const nodes = this.listNodes()
    return buildSkillCoverageSummary(domains, nodes)
  },

  listNodes(domainId?: string): SkillNodeSummary[] {
    const db = getDb()
    const nodeRows = domainId
      ? db
          .select()
          .from(skillNodesTable)
          .where(eq(skillNodesTable.domain_id, domainId))
          .orderBy(asc(skillNodesTable.sort_order))
          .all()
      : db.select().from(skillNodesTable).orderBy(asc(skillNodesTable.sort_order)).all()

    const nodeIds = nodeRows.map((row) => row.id)
    const evidenceRows =
      nodeIds.length > 0
        ? db.select().from(skillEvidenceTable).where(inArray(skillEvidenceTable.skill_id, nodeIds)).all()
        : []
    const groupedEvidence = groupEvidenceBySkill(evidenceRows.map(deserializeEvidence))

    return nodeRows.map((row) => {
      const node = deserializeNode(row)
      return toNodeSummary(node, groupedEvidence.get(node.id) ?? [])
    })
  },

  getNode(id: string): SkillNodeDetail {
    const db = getDb()
    const row = db.select().from(skillNodesTable).where(eq(skillNodesTable.id, id)).get()

    if (!row) {
      throw new Error('Skill node not found')
    }

    const evidence = db
      .select()
      .from(skillEvidenceTable)
      .where(eq(skillEvidenceTable.skill_id, id))
      .orderBy(asc(skillEvidenceTable.created_at))
      .all()
      .map(deserializeEvidence)
    const node = deserializeNode(row)

    return {
      skill: toNodeSummary(node, evidence),
      evidence
    }
  },

  createDomain(input: CreateSkillDomainInput): SkillDomain {
    const db = getDb()
    const parsed = validateCreateSkillDomainInput(input)
    const now = Date.now()
    const id = ulid()
    const existing = db.select().from(skillDomainsTable).all()

    db.insert(skillDomainsTable)
      .values({
        id,
        title: parsed.title,
        description: parsed.description ?? null,
        sort_order: parsed.sort_order ?? nextSortOrder(existing),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeDomain(
      db.select().from(skillDomainsTable).where(eq(skillDomainsTable.id, id)).get()!
    )
  },

  updateDomain(input: UpdateSkillDomainInput): SkillDomain {
    const db = getDb()
    const parsed = validateUpdateSkillDomainInput(input)
    const current = db.select().from(skillDomainsTable).where(eq(skillDomainsTable.id, parsed.id)).get()

    if (!current) {
      throw new Error('Skill domain not found')
    }

    db.update(skillDomainsTable)
      .set({
        title: parsed.title ?? current.title,
        description: parsed.description === undefined ? current.description : parsed.description,
        sort_order: parsed.sort_order ?? current.sort_order,
        updated_at: Date.now()
      })
      .where(eq(skillDomainsTable.id, parsed.id))
      .run()

    return deserializeDomain(
      db.select().from(skillDomainsTable).where(eq(skillDomainsTable.id, parsed.id)).get()!
    )
  },

  deleteDomain(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(skillDomainsTable).where(eq(skillDomainsTable.id, id)).run()
    return { ok: true }
  },

  createNode(input: CreateSkillNodeInput): SkillNode {
    const db = getDb()
    const parsed = validateCreateSkillNodeInput(input)
    const now = Date.now()
    const id = ulid()
    const siblings = db
      .select()
      .from(skillNodesTable)
      .where(eq(skillNodesTable.domain_id, parsed.domain_id))
      .all()

    db.insert(skillNodesTable)
      .values({
        id,
        domain_id: parsed.domain_id,
        title: parsed.title,
        description: parsed.description ?? null,
        sort_order: parsed.sort_order ?? nextSortOrder(siblings),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeNode(db.select().from(skillNodesTable).where(eq(skillNodesTable.id, id)).get()!)
  },

  updateNode(input: UpdateSkillNodeInput): SkillNode {
    const db = getDb()
    const parsed = validateUpdateSkillNodeInput(input)
    const current = db.select().from(skillNodesTable).where(eq(skillNodesTable.id, parsed.id)).get()

    if (!current) {
      throw new Error('Skill node not found')
    }

    db.update(skillNodesTable)
      .set({
        domain_id: parsed.domain_id ?? current.domain_id,
        title: parsed.title ?? current.title,
        description: parsed.description === undefined ? current.description : parsed.description,
        sort_order: parsed.sort_order ?? current.sort_order,
        updated_at: Date.now()
      })
      .where(eq(skillNodesTable.id, parsed.id))
      .run()

    return deserializeNode(db.select().from(skillNodesTable).where(eq(skillNodesTable.id, parsed.id)).get()!)
  },

  deleteNode(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(skillNodesTable).where(eq(skillNodesTable.id, id)).run()
    return { ok: true }
  },

  async addEvidence(input: CreateSkillEvidenceInput): Promise<SkillEvidence> {
    const db = getDb()
    const parsed = validateCreateSkillEvidenceInput(input)
    const now = Date.now()
    const id = ulid()
    const status = await resolveSuggestedStatus(parsed)

    db.insert(skillEvidenceTable)
      .values({
        id,
        skill_id: parsed.skill_id,
        source_type: parsed.source_type,
        status,
        label: parsed.label,
        notes: parsed.notes ?? null,
        project_id: parsed.project_id ?? null,
        certification_name: parsed.certification_name ?? null,
        link_url: parsed.link_url ?? null,
        required_stage: parsed.required_stage ?? null,
        confirmed_at: status === 'confirmed' ? now : null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeEvidence(
      db.select().from(skillEvidenceTable).where(eq(skillEvidenceTable.id, id)).get()!
    )
  },

  async updateEvidence(input: UpdateSkillEvidenceInput): Promise<SkillEvidence> {
    const db = getDb()
    const parsed = validateUpdateSkillEvidenceInput(input)
    const current = db.select().from(skillEvidenceTable).where(eq(skillEvidenceTable.id, parsed.id)).get()

    if (!current) {
      throw new Error('Skill evidence not found')
    }

    const nextStatus =
      current.status === 'confirmed'
        ? 'confirmed'
        : await resolveSuggestedStatus({
            project_id: parsed.project_id === undefined ? current.project_id : parsed.project_id,
            required_stage:
              parsed.required_stage === undefined
                ? ((current.required_stage as ProjectExecutionStage | null) ?? null)
                : parsed.required_stage
          })

    db.update(skillEvidenceTable)
      .set({
        label: parsed.label ?? current.label,
        notes: parsed.notes === undefined ? current.notes : parsed.notes,
        project_id: parsed.project_id === undefined ? current.project_id : parsed.project_id,
        certification_name:
          parsed.certification_name === undefined
            ? current.certification_name
            : parsed.certification_name,
        link_url: parsed.link_url === undefined ? current.link_url : parsed.link_url,
        required_stage:
          parsed.required_stage === undefined ? current.required_stage : parsed.required_stage,
        status: nextStatus,
        updated_at: Date.now()
      })
      .where(eq(skillEvidenceTable.id, parsed.id))
      .run()

    return deserializeEvidence(
      db.select().from(skillEvidenceTable).where(eq(skillEvidenceTable.id, parsed.id)).get()!
    )
  },

  confirmEvidence(id: string): SkillEvidence {
    const db = getDb()
    const now = Date.now()
    const current = db.select().from(skillEvidenceTable).where(eq(skillEvidenceTable.id, id)).get()

    if (!current) {
      throw new Error('Skill evidence not found')
    }

    db.update(skillEvidenceTable)
      .set({
        status: 'confirmed',
        confirmed_at: now,
        updated_at: now
      })
      .where(eq(skillEvidenceTable.id, id))
      .run()

    return deserializeEvidence(
      db.select().from(skillEvidenceTable).where(eq(skillEvidenceTable.id, id)).get()!
    )
  },

  deleteEvidence(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(skillEvidenceTable).where(eq(skillEvidenceTable.id, id)).run()
    return { ok: true }
  },

  syncProjectEvidenceSuggestions(projectId: string): void {
    const db = getDb()
    const project = db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).get()

    if (!project) {
      return
    }

    const evidence = db
      .select()
      .from(skillEvidenceTable)
      .where(eq(skillEvidenceTable.project_id, projectId))
      .all()

    const now = Date.now()

    for (const entry of evidence) {
      if (entry.source_type !== 'project' || entry.status !== 'attached') {
        continue
      }

      if (
        meetsRequiredStage(
          project.execution_stage as ProjectExecutionStage,
          (entry.required_stage as ProjectExecutionStage | null) ?? null
        )
      ) {
        db.update(skillEvidenceTable)
          .set({
            status: 'suggested',
            updated_at: now
          })
          .where(eq(skillEvidenceTable.id, entry.id))
          .run()
      }
    }
  }
}
