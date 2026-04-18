import fs from 'node:fs'
import { desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  Block,
  CreateProjectInput,
  Project,
  ProjectConnectionSummary,
  UpdateProjectInput
} from '../../../preload/types'
import { WORKSPACE_ONLY_BLOCK_TYPES, cloneDefaultPageConfig } from '@shared/defaults'
import {
  parsePageConfig,
  validateCreateProjectInput,
  validateUpdateProjectInput
} from '@shared/validation'
import { getDb } from '../index'
import {
  blocksTable,
  planNodeLinksTable,
  planNodesTable,
  projectsTable,
  type ProjectRow
} from '../schema'
import {
  assertPathInsideProjects,
  ensureProjectDirectories,
  getProjectDir
} from '../../services/appPaths'
import { slugify } from '../../utils/slugify'
import { actionQueries } from './actions'
import { noteQueries } from './notes'
import { pipelineQueries } from './pipeline'
import { presenceQueries } from './presence'
import { skillQueries } from './skills'

function deserializeProject(row: ProjectRow): Project {
  return {
    ...row,
    type: row.type as Project['type'],
    execution_stage: row.execution_stage as Project['execution_stage'],
    status: row.status as Project['status'],
    subtitle: row.subtitle ?? null,
    core_value: row.core_value ?? null,
    page_config: parsePageConfig(JSON.parse(row.page_config)),
    cover_asset_id: row.cover_asset_id ?? null,
    git_enabled: Boolean(row.git_enabled),
    git_remote: row.git_remote ?? null,
    git_pages_url: row.git_pages_url ?? null
  }
}

function deserializePlanNode(
  row: typeof planNodesTable.$inferSelect
): ProjectConnectionSummary['plan_nodes'][number] {
  return {
    ...row,
    summary: row.summary ?? null,
    parent_id: row.parent_id ?? null,
    horizon_year: row.horizon_year ?? null,
    start_at: row.start_at ?? null,
    due_at: row.due_at ?? null,
    notes: row.notes ?? null,
    kind: row.kind as ProjectConnectionSummary['plan_nodes'][number]['kind'],
    status: row.status as ProjectConnectionSummary['plan_nodes'][number]['status']
  }
}

function buildUniqueSlug(name: string, currentProjectId?: string): string {
  const db = getDb()
  const baseSlug = slugify(name) || 'project'
  let candidate = baseSlug
  let suffix = 1

  while (true) {
    const existing = db.select().from(projectsTable).where(eq(projectsTable.slug, candidate)).get()

    if (!existing || existing.id === currentProjectId) {
      return candidate
    }

    suffix += 1
    candidate = `${baseSlug}-${suffix}`
  }
}

export const projectQueries = {
  list(): Project[] {
    const db = getDb()
    return db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.updated_at))
      .all()
      .map(deserializeProject)
  },

  get(id: string): Project {
    const db = getDb()
    const row = db.select().from(projectsTable).where(eq(projectsTable.id, id)).get()

    if (!row) {
      throw new Error('Project not found')
    }

    return deserializeProject(row)
  },

  getConnections(id: string): ProjectConnectionSummary {
    const db = getDb()
    const project = this.get(id)
    const planLinks = db
      .select()
      .from(planNodeLinksTable)
      .where(eq(planNodeLinksTable.target_id, id))
      .all()
      .filter((link) => link.target_type === 'project')
    const nodeIds = new Set(planLinks.map((link) => link.node_id))
    const planNodes = db
      .select()
      .from(planNodesTable)
      .all()
      .filter((node) => nodeIds.has(node.id))
      .map(deserializePlanNode)
    const skillEvidence = skillQueries.listEvidence().filter((entry) => entry.project_id === id)
    const skillIds = new Set(skillEvidence.map((entry) => entry.skill_id))
    const blockIds = new Set(
      db
        .select({ id: blocksTable.id })
        .from(blocksTable)
        .where(eq(blocksTable.project_id, id))
        .all()
        .map((block) => block.id)
    )
    const variants = presenceQueries.listCvVariants()
    const variantById = new Map(variants.map((variant) => [variant.id, variant]))
    const allSectionSources = presenceQueries.listCvSectionSources()
    const cvSections = presenceQueries
      .listCvSections()
      .flatMap((section) => {
        const sources = allSectionSources.filter(
          (source) =>
            source.section_id === section.id &&
            ((source.source_type === 'project' && source.source_id === id) ||
              (source.source_type === 'skill_node' && skillIds.has(source.source_id)) ||
              (source.source_type === 'block' && blockIds.has(source.source_id)))
        )
        const variant = variantById.get(section.cv_variant_id)

        return variant && sources.length > 0 ? [{ section, variant, sources }] : []
      })
    const applications = pipelineQueries
      .listApplications()
      .filter(
        (application) =>
          application.linked_project_id === id ||
          (application.linked_skill_id ? skillIds.has(application.linked_skill_id) : false)
      )
    const narrativeFragments = presenceQueries
      .listNarrativeFragments()
      .filter((fragment) => fragment.linked_project_id === id)
    const noteIds = new Set(
      noteQueries
        .listLinks()
        .filter((link) => link.target_type === 'project' && link.target_id === id)
        .map((link) => link.note_id)
    )
    const notes = noteQueries.list().filter((note) => noteIds.has(note.id))
    const actions = actionQueries.list().filter((action) => action.linked_project_id === id)

    return {
      project,
      plan_nodes: planNodes,
      skill_evidence: skillEvidence,
      cv_sections: cvSections,
      applications,
      narrative_fragments: narrativeFragments,
      notes,
      actions
    }
  },

  create(input: CreateProjectInput): Project {
    const db = getDb()
    const parsed = validateCreateProjectInput(input)
    const id = ulid()
    const now = Date.now()

    db.insert(projectsTable)
      .values({
        id,
        name: parsed.name,
        slug: buildUniqueSlug(parsed.name),
        type: parsed.type,
        execution_stage: 'ideation',
        subtitle: parsed.subtitle ?? null,
        core_value: parsed.core_value ?? null,
        status: 'active',
        page_config: JSON.stringify(cloneDefaultPageConfig()),
        cover_asset_id: null,
        created_at: now,
        updated_at: now,
        git_enabled: false,
        git_remote: null,
        git_pages_url: null
      })
      .run()

    ensureProjectDirectories(id)
    return this.get(id)
  },

  update(input: UpdateProjectInput): Project {
    const db = getDb()
    const parsed = validateUpdateProjectInput(input)
    const current = this.get(parsed.id)

    db.update(projectsTable)
      .set({
        name: parsed.name ?? current.name,
        slug: parsed.name ? buildUniqueSlug(parsed.name, parsed.id) : current.slug,
        type: parsed.type ?? current.type,
        execution_stage: parsed.execution_stage ?? current.execution_stage,
        subtitle: parsed.subtitle === undefined ? current.subtitle : parsed.subtitle,
        core_value: parsed.core_value === undefined ? current.core_value : parsed.core_value,
        status: parsed.status ?? current.status,
        page_config: JSON.stringify(parsed.page_config ?? current.page_config),
        cover_asset_id:
          parsed.cover_asset_id === undefined ? current.cover_asset_id : parsed.cover_asset_id,
        updated_at: Date.now(),
        git_enabled: parsed.git_enabled ?? current.git_enabled,
        git_remote: parsed.git_remote === undefined ? current.git_remote : parsed.git_remote,
        git_pages_url:
          parsed.git_pages_url === undefined ? current.git_pages_url : parsed.git_pages_url
      })
      .where(eq(projectsTable.id, parsed.id))
      .run()

    return this.get(parsed.id)
  },

  touch(id: string): void {
    const db = getDb()
    db.update(projectsTable).set({ updated_at: Date.now() }).where(eq(projectsTable.id, id)).run()
  },

  resyncSections(projectId: string, blocks: Block[]): void {
    const project = this.get(projectId)
    const existingSections = new Map(
      project.page_config.sections.map((section) => [section.blockId, section])
    )
    const publicBlocks = blocks
      .filter((block) => !WORKSPACE_ONLY_BLOCK_TYPES.includes(block.type))
      .sort((left, right) => left.sort_order - right.sort_order)
    const blockMap = new Map(publicBlocks.map((block) => [block.id, block]))
    const existingOrdered = project.page_config.sections
      .filter((section) => blockMap.has(section.blockId))
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((section, index) => ({
        ...section,
        visible: blockMap.get(section.blockId)?.visible_on_page ?? section.visible,
        sortOrder: index
      }))
    const existingIds = new Set(existingOrdered.map((section) => section.blockId))
    const appendedSections = publicBlocks
      .filter((block) => !existingIds.has(block.id))
      .map((block, index) => ({
        blockId: block.id,
        visible: block.visible_on_page,
        sortOrder: existingOrdered.length + index,
        customTitle: existingSections.get(block.id)?.customTitle
      }))
    const sections = [...existingOrdered, ...appendedSections]

    this.update({
      id: projectId,
      page_config: {
        ...project.page_config,
        sections
      }
    })
  },

  delete(id: string): { ok: boolean } {
    const db = getDb()
    const target = getProjectDir(id)
    assertPathInsideProjects(target)
    fs.rmSync(target, { recursive: true, force: true })
    db.delete(projectsTable).where(eq(projectsTable.id, id)).run()
    return { ok: true }
  }
}
