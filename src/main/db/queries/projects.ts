import fs from 'node:fs'
import { desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type { Block, CreateProjectInput, Project, UpdateProjectInput } from '../../../preload/types'
import { WORKSPACE_ONLY_BLOCK_TYPES, cloneDefaultPageConfig } from '@shared/defaults'
import {
  parsePageConfig,
  validateCreateProjectInput,
  validateUpdateProjectInput
} from '@shared/validation'
import { getDb } from '../index'
import { projectsTable, type ProjectRow } from '../schema'
import {
  assertPathInsideProjects,
  ensureProjectDirectories,
  getProjectDir
} from '../../services/appPaths'
import { slugify } from '../../utils/slugify'

function deserializeProject(row: ProjectRow): Project {
  return {
    ...row,
    type: row.type as Project['type'],
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
    const sections = blocks
      .filter((block) => !WORKSPACE_ONLY_BLOCK_TYPES.includes(block.type))
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((block, index) => ({
        blockId: block.id,
        visible: block.visible_on_page,
        sortOrder: index,
        customTitle: existingSections.get(block.id)?.customTitle
      }))

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
