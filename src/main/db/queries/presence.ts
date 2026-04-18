import { asc, desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  ContentIdea,
  ContentPost,
  CreateContentIdeaInput,
  CreateContentPostInput,
  CreateCvVariantSectionInput,
  CreateCvVariantSectionSourceInput,
  CreateCvVariantInput,
  CreateNarrativeFragmentInput,
  CreateProfileAssetInput,
  CvVariant,
  CvVariantSection,
  CvVariantSectionSource,
  NarrativeFragment,
  ProfileAsset,
  UpdateContentIdeaInput,
  UpdateContentPostInput,
  UpdateCvVariantSectionInput,
  UpdateCvVariantSectionSourceInput,
  UpdateCvVariantInput,
  UpdateNarrativeFragmentInput,
  UpdateProfileAssetInput
} from '../../../preload/types'
import { getDb } from '../index'
import {
  blocksTable,
  contentIdeasTable,
  contentPostsTable,
  cvVariantSectionsTable,
  cvVariantSectionSourcesTable,
  cvVariantsTable,
  narrativeFragmentsTable,
  profileAssetsTable,
  skillNodesTable,
  projectsTable,
  type ContentIdeaRow,
  type ContentPostRow,
  type CvVariantRow,
  type CvVariantSectionRow,
  type CvVariantSectionSourceRow,
  type NarrativeFragmentRow,
  type ProfileAssetRow
} from '../schema'

function clean(value: string | null | undefined): string | null {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function deserializeNarrativeFragment(row: NarrativeFragmentRow): NarrativeFragment {
  return {
    ...row,
    source_document_id: row.source_document_id ?? null,
    source_excerpt_id: row.source_excerpt_id ?? null,
    linked_project_id: row.linked_project_id ?? null
  }
}

function deserializeProfileAsset(row: ProfileAssetRow): ProfileAsset {
  return {
    ...row,
    notes: row.notes ?? null,
    status: row.status as ProfileAsset['status']
  }
}

function deserializeCvVariant(row: CvVariantRow): CvVariant {
  return {
    ...row,
    target_role: row.target_role ?? null,
    target_role_id: row.target_role_id ?? null,
    summary: row.summary ?? null,
    is_default: Boolean(row.is_default)
  }
}

function deserializeCvVariantSection(row: CvVariantSectionRow): CvVariantSection {
  return {
    ...row,
    summary: row.summary ?? null
  }
}

function deserializeCvVariantSectionSource(
  row: CvVariantSectionSourceRow
): CvVariantSectionSource {
  return {
    ...row,
    source_type: row.source_type as CvVariantSectionSource['source_type'],
    notes: row.notes ?? null
  }
}

function deserializeContentIdea(row: ContentIdeaRow): ContentIdea {
  return {
    ...row,
    angle: row.angle ?? null,
    linked_project_id: row.linked_project_id ?? null,
    status: row.status as ContentIdea['status']
  }
}

function deserializeContentPost(row: ContentPostRow): ContentPost {
  return {
    ...row,
    publish_date: row.publish_date ?? null,
    linked_idea_id: row.linked_idea_id ?? null
  }
}

function clearDefaultCvVariants(exceptId?: string): void {
  const db = getDb()
  db.update(cvVariantsTable).set({ is_default: false, updated_at: Date.now() }).run()

  if (exceptId) {
    db.update(cvVariantsTable)
      .set({ is_default: true, updated_at: Date.now() })
      .where(eq(cvVariantsTable.id, exceptId))
      .run()
  }
}

function nextSortOrder(values: Array<{ sort_order: number }>): number {
  if (values.length === 0) {
    return 0
  }

  return Math.max(...values.map((value) => value.sort_order)) + 1
}

function buildSectionSourceLine(source: CvVariantSectionSource): string {
  const db = getDb()

  if (source.source_type === 'skill_node') {
    const skill = db
      .select({ title: skillNodesTable.title })
      .from(skillNodesTable)
      .where(eq(skillNodesTable.id, source.source_id))
      .get()

    return skill ? `Skill evidence: ${skill.title}` : 'Skill evidence source'
  }

  if (source.source_type === 'project') {
    const project = db
      .select({
        name: projectsTable.name,
        execution_stage: projectsTable.execution_stage
      })
      .from(projectsTable)
      .where(eq(projectsTable.id, source.source_id))
      .get()

    return project
      ? `Project: ${project.name} (${project.execution_stage.replace(/_/g, ' ')})`
      : 'Project source'
  }

  const block = db
    .select({
      type: blocksTable.type,
      project_id: blocksTable.project_id
    })
    .from(blocksTable)
    .where(eq(blocksTable.id, source.source_id))
    .get()

  if (!block) {
    return 'Proof block source'
  }

  const project = db
    .select({ name: projectsTable.name })
    .from(projectsTable)
    .where(eq(projectsTable.id, block.project_id))
    .get()

  return project
    ? `Proof block: ${project.name} · ${block.type.replace(/_/g, ' ')}`
    : `Proof block: ${block.type.replace(/_/g, ' ')}`
}

function buildCvVariantContent(variantId: string): string {
  const sections = presenceQueries.listCvSections(variantId)
  if (sections.length === 0) {
    return ''
  }

  const sectionIds = sections.map((section) => section.id)
  const sources = sectionIds.length > 0 ? presenceQueries.listCvSectionSources() : []
  const sourcesBySection = new Map<string, CvVariantSectionSource[]>()

  for (const source of sources) {
    const current = sourcesBySection.get(source.section_id) ?? []
    current.push(source)
    sourcesBySection.set(source.section_id, current)
  }

  return sections
    .map((section) => {
      const sectionSources = (sourcesBySection.get(section.id) ?? []).sort(
        (left, right) => left.sort_order - right.sort_order
      )
      const lines = [section.title]

      if (section.summary) {
        lines.push(section.summary)
      }

      for (const source of sectionSources) {
        lines.push(`- ${buildSectionSourceLine(source)}`)
      }

      return lines.join('\n')
    })
    .join('\n\n')
}

export const presenceQueries = {
  listNarrativeFragments(): NarrativeFragment[] {
    const db = getDb()
    return db
      .select()
      .from(narrativeFragmentsTable)
      .orderBy(desc(narrativeFragmentsTable.updated_at))
      .all()
      .map(deserializeNarrativeFragment)
  },

  createNarrativeFragment(input: CreateNarrativeFragmentInput): NarrativeFragment {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(narrativeFragmentsTable)
      .values({
        id,
        title: input.title.trim(),
        fragment_type: input.fragment_type?.trim() || 'story',
        body: input.body?.trim() ?? '',
        source_document_id: input.source_document_id ?? null,
        source_excerpt_id: input.source_excerpt_id ?? null,
        linked_project_id: input.linked_project_id ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeNarrativeFragment(
      db.select().from(narrativeFragmentsTable).where(eq(narrativeFragmentsTable.id, id)).get()!
    )
  },

  updateNarrativeFragment(input: UpdateNarrativeFragmentInput): NarrativeFragment {
    const db = getDb()
    const current = db
      .select()
      .from(narrativeFragmentsTable)
      .where(eq(narrativeFragmentsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Narrative fragment not found')
    }

    db.update(narrativeFragmentsTable)
      .set({
        title: input.title?.trim() || current.title,
        fragment_type: input.fragment_type?.trim() || current.fragment_type,
        body: input.body === undefined ? current.body : input.body,
        source_document_id:
          input.source_document_id === undefined
            ? current.source_document_id
            : input.source_document_id,
        source_excerpt_id:
          input.source_excerpt_id === undefined
            ? current.source_excerpt_id
            : input.source_excerpt_id,
        linked_project_id:
          input.linked_project_id === undefined
            ? current.linked_project_id
            : input.linked_project_id,
        updated_at: Date.now()
      })
      .where(eq(narrativeFragmentsTable.id, input.id))
      .run()

    return deserializeNarrativeFragment(
      db
        .select()
        .from(narrativeFragmentsTable)
        .where(eq(narrativeFragmentsTable.id, input.id))
        .get()!
    )
  },

  deleteNarrativeFragment(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(narrativeFragmentsTable).where(eq(narrativeFragmentsTable.id, id)).run()
    return { ok: true }
  },

  listProfileAssets(): ProfileAsset[] {
    const db = getDb()
    return db
      .select()
      .from(profileAssetsTable)
      .orderBy(desc(profileAssetsTable.updated_at))
      .all()
      .map(deserializeProfileAsset)
  },

  createProfileAsset(input: CreateProfileAssetInput): ProfileAsset {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(profileAssetsTable)
      .values({
        id,
        title: input.title.trim(),
        platform: input.platform?.trim() || 'linkedin',
        content: input.content ?? '',
        status: input.status ?? 'draft',
        notes: clean(input.notes),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeProfileAsset(
      db.select().from(profileAssetsTable).where(eq(profileAssetsTable.id, id)).get()!
    )
  },

  updateProfileAsset(input: UpdateProfileAssetInput): ProfileAsset {
    const db = getDb()
    const current = db
      .select()
      .from(profileAssetsTable)
      .where(eq(profileAssetsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Profile asset not found')
    }

    db.update(profileAssetsTable)
      .set({
        title: input.title?.trim() || current.title,
        platform: input.platform?.trim() || current.platform,
        content: input.content === undefined ? current.content : input.content,
        status: input.status ?? current.status,
        notes: input.notes === undefined ? current.notes : clean(input.notes),
        updated_at: Date.now()
      })
      .where(eq(profileAssetsTable.id, input.id))
      .run()

    return deserializeProfileAsset(
      db.select().from(profileAssetsTable).where(eq(profileAssetsTable.id, input.id)).get()!
    )
  },

  deleteProfileAsset(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(profileAssetsTable).where(eq(profileAssetsTable.id, id)).run()
    return { ok: true }
  },

  listCvVariants(): CvVariant[] {
    const db = getDb()
    return db
      .select()
      .from(cvVariantsTable)
      .orderBy(desc(cvVariantsTable.updated_at))
      .all()
      .map(deserializeCvVariant)
  },

  createCvVariant(input: CreateCvVariantInput): CvVariant {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(cvVariantsTable)
      .values({
        id,
        title: input.title.trim(),
        target_role: clean(input.target_role),
        target_role_id: input.target_role_id ?? null,
        summary: clean(input.summary),
        content: input.content ?? '',
        is_default: Boolean(input.is_default),
        created_at: now,
        updated_at: now
      })
      .run()

    if (input.is_default) {
      clearDefaultCvVariants(id)
    }

    return deserializeCvVariant(
      db.select().from(cvVariantsTable).where(eq(cvVariantsTable.id, id)).get()!
    )
  },

  updateCvVariant(input: UpdateCvVariantInput): CvVariant {
    const db = getDb()
    const current = db.select().from(cvVariantsTable).where(eq(cvVariantsTable.id, input.id)).get()

    if (!current) {
      throw new Error('CV variant not found')
    }

    db.update(cvVariantsTable)
      .set({
        title: input.title?.trim() || current.title,
        target_role:
          input.target_role === undefined ? current.target_role : clean(input.target_role),
        target_role_id:
          input.target_role_id === undefined ? current.target_role_id : input.target_role_id,
        summary: input.summary === undefined ? current.summary : clean(input.summary),
        content: input.content === undefined ? current.content : input.content,
        is_default: input.is_default ?? current.is_default,
        updated_at: Date.now()
      })
      .where(eq(cvVariantsTable.id, input.id))
      .run()

    if (input.is_default) {
      clearDefaultCvVariants(input.id)
    }

    return deserializeCvVariant(
      db.select().from(cvVariantsTable).where(eq(cvVariantsTable.id, input.id)).get()!
    )
  },

  deleteCvVariant(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(cvVariantsTable).where(eq(cvVariantsTable.id, id)).run()
    return { ok: true }
  },

  listCvSections(cvVariantId?: string): CvVariantSection[] {
    const db = getDb()
    const rows = cvVariantId
      ? db
          .select()
          .from(cvVariantSectionsTable)
          .where(eq(cvVariantSectionsTable.cv_variant_id, cvVariantId))
          .orderBy(asc(cvVariantSectionsTable.sort_order), asc(cvVariantSectionsTable.created_at))
          .all()
      : db
          .select()
          .from(cvVariantSectionsTable)
          .orderBy(asc(cvVariantSectionsTable.sort_order), asc(cvVariantSectionsTable.created_at))
          .all()

    return rows.map(deserializeCvVariantSection)
  },

  createCvSection(input: CreateCvVariantSectionInput): CvVariantSection {
    const db = getDb()
    const now = Date.now()
    const id = ulid()
    const existing = this.listCvSections(input.cv_variant_id)

    db.insert(cvVariantSectionsTable)
      .values({
        id,
        cv_variant_id: input.cv_variant_id,
        title: input.title.trim(),
        summary: clean(input.summary),
        sort_order: input.sort_order ?? nextSortOrder(existing),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeCvVariantSection(
      db.select().from(cvVariantSectionsTable).where(eq(cvVariantSectionsTable.id, id)).get()!
    )
  },

  updateCvSection(input: UpdateCvVariantSectionInput): CvVariantSection {
    const db = getDb()
    const current = db
      .select()
      .from(cvVariantSectionsTable)
      .where(eq(cvVariantSectionsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('CV section not found')
    }

    db.update(cvVariantSectionsTable)
      .set({
        title: input.title?.trim() || current.title,
        summary: input.summary === undefined ? current.summary : clean(input.summary),
        sort_order: input.sort_order ?? current.sort_order,
        updated_at: Date.now()
      })
      .where(eq(cvVariantSectionsTable.id, input.id))
      .run()

    return deserializeCvVariantSection(
      db.select().from(cvVariantSectionsTable).where(eq(cvVariantSectionsTable.id, input.id)).get()!
    )
  },

  deleteCvSection(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(cvVariantSectionsTable).where(eq(cvVariantSectionsTable.id, id)).run()
    return { ok: true }
  },

  listCvSectionSources(sectionId?: string): CvVariantSectionSource[] {
    const db = getDb()
    const rows = sectionId
      ? db
          .select()
          .from(cvVariantSectionSourcesTable)
          .where(eq(cvVariantSectionSourcesTable.section_id, sectionId))
          .orderBy(
            asc(cvVariantSectionSourcesTable.sort_order),
            asc(cvVariantSectionSourcesTable.created_at)
          )
          .all()
      : db
          .select()
          .from(cvVariantSectionSourcesTable)
          .orderBy(
            asc(cvVariantSectionSourcesTable.sort_order),
            asc(cvVariantSectionSourcesTable.created_at)
          )
          .all()

    return rows.map(deserializeCvVariantSectionSource)
  },

  createCvSectionSource(input: CreateCvVariantSectionSourceInput): CvVariantSectionSource {
    const db = getDb()
    const now = Date.now()
    const id = ulid()
    const existing = this.listCvSectionSources(input.section_id)

    db.insert(cvVariantSectionSourcesTable)
      .values({
        id,
        section_id: input.section_id,
        source_type: input.source_type,
        source_id: input.source_id,
        notes: clean(input.notes),
        sort_order: input.sort_order ?? nextSortOrder(existing),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeCvVariantSectionSource(
      db
        .select()
        .from(cvVariantSectionSourcesTable)
        .where(eq(cvVariantSectionSourcesTable.id, id))
        .get()!
    )
  },

  updateCvSectionSource(input: UpdateCvVariantSectionSourceInput): CvVariantSectionSource {
    const db = getDb()
    const current = db
      .select()
      .from(cvVariantSectionSourcesTable)
      .where(eq(cvVariantSectionSourcesTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('CV section source not found')
    }

    db.update(cvVariantSectionSourcesTable)
      .set({
        notes: input.notes === undefined ? current.notes : clean(input.notes),
        sort_order: input.sort_order ?? current.sort_order,
        updated_at: Date.now()
      })
      .where(eq(cvVariantSectionSourcesTable.id, input.id))
      .run()

    return deserializeCvVariantSectionSource(
      db
        .select()
        .from(cvVariantSectionSourcesTable)
        .where(eq(cvVariantSectionSourcesTable.id, input.id))
        .get()!
    )
  },

  deleteCvSectionSource(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(cvVariantSectionSourcesTable).where(eq(cvVariantSectionSourcesTable.id, id)).run()
    return { ok: true }
  },

  syncCvVariantContent(id: string): CvVariant {
    const db = getDb()
    const current = db.select().from(cvVariantsTable).where(eq(cvVariantsTable.id, id)).get()

    if (!current) {
      throw new Error('CV variant not found')
    }

    db.update(cvVariantsTable)
      .set({
        content: buildCvVariantContent(id),
        updated_at: Date.now()
      })
      .where(eq(cvVariantsTable.id, id))
      .run()

    return deserializeCvVariant(
      db.select().from(cvVariantsTable).where(eq(cvVariantsTable.id, id)).get()!
    )
  },

  listContentIdeas(): ContentIdea[] {
    const db = getDb()
    return db
      .select()
      .from(contentIdeasTable)
      .orderBy(desc(contentIdeasTable.updated_at))
      .all()
      .map(deserializeContentIdea)
  },

  createContentIdea(input: CreateContentIdeaInput): ContentIdea {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(contentIdeasTable)
      .values({
        id,
        title: input.title.trim(),
        angle: clean(input.angle),
        status: input.status ?? 'backlog',
        linked_project_id: input.linked_project_id ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeContentIdea(
      db.select().from(contentIdeasTable).where(eq(contentIdeasTable.id, id)).get()!
    )
  },

  updateContentIdea(input: UpdateContentIdeaInput): ContentIdea {
    const db = getDb()
    const current = db
      .select()
      .from(contentIdeasTable)
      .where(eq(contentIdeasTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Content idea not found')
    }

    db.update(contentIdeasTable)
      .set({
        title: input.title?.trim() || current.title,
        angle: input.angle === undefined ? current.angle : clean(input.angle),
        status: input.status ?? current.status,
        linked_project_id:
          input.linked_project_id === undefined
            ? current.linked_project_id
            : input.linked_project_id,
        updated_at: Date.now()
      })
      .where(eq(contentIdeasTable.id, input.id))
      .run()

    return deserializeContentIdea(
      db.select().from(contentIdeasTable).where(eq(contentIdeasTable.id, input.id)).get()!
    )
  },

  deleteContentIdea(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(contentIdeasTable).where(eq(contentIdeasTable.id, id)).run()
    return { ok: true }
  },

  listContentPosts(): ContentPost[] {
    const db = getDb()
    return db
      .select()
      .from(contentPostsTable)
      .orderBy(desc(contentPostsTable.updated_at))
      .all()
      .map(deserializeContentPost)
  },

  createContentPost(input: CreateContentPostInput): ContentPost {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(contentPostsTable)
      .values({
        id,
        title: input.title.trim(),
        channel: input.channel?.trim() || 'linkedin',
        body: input.body ?? '',
        status: input.status?.trim() || 'draft',
        publish_date: clean(input.publish_date),
        linked_idea_id: input.linked_idea_id ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeContentPost(
      db.select().from(contentPostsTable).where(eq(contentPostsTable.id, id)).get()!
    )
  },

  updateContentPost(input: UpdateContentPostInput): ContentPost {
    const db = getDb()
    const current = db
      .select()
      .from(contentPostsTable)
      .where(eq(contentPostsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Content post not found')
    }

    db.update(contentPostsTable)
      .set({
        title: input.title?.trim() || current.title,
        channel: input.channel?.trim() || current.channel,
        body: input.body === undefined ? current.body : input.body,
        status: input.status?.trim() || current.status,
        publish_date:
          input.publish_date === undefined ? current.publish_date : clean(input.publish_date),
        linked_idea_id:
          input.linked_idea_id === undefined ? current.linked_idea_id : input.linked_idea_id,
        updated_at: Date.now()
      })
      .where(eq(contentPostsTable.id, input.id))
      .run()

    return deserializeContentPost(
      db.select().from(contentPostsTable).where(eq(contentPostsTable.id, input.id)).get()!
    )
  },

  deleteContentPost(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(contentPostsTable).where(eq(contentPostsTable.id, id)).run()
    return { ok: true }
  }
}
