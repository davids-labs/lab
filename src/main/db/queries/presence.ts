import { desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  ContentIdea,
  ContentPost,
  CreateContentIdeaInput,
  CreateContentPostInput,
  CreateCvVariantInput,
  CreateNarrativeFragmentInput,
  CreateProfileAssetInput,
  CvVariant,
  NarrativeFragment,
  ProfileAsset,
  UpdateContentIdeaInput,
  UpdateContentPostInput,
  UpdateCvVariantInput,
  UpdateNarrativeFragmentInput,
  UpdateProfileAssetInput
} from '../../../preload/types'
import { getDb } from '../index'
import {
  contentIdeasTable,
  contentPostsTable,
  cvVariantsTable,
  narrativeFragmentsTable,
  profileAssetsTable,
  type ContentIdeaRow,
  type ContentPostRow,
  type CvVariantRow,
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
    summary: row.summary ?? null,
    is_default: Boolean(row.is_default)
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
