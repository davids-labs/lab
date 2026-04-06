import fs from 'node:fs'
import path from 'node:path'
import mammoth from 'mammoth'
import mime from 'mime-types'
import { asc, desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  ExtractionSuggestion,
  ImportSourceDocumentsInput,
  ResolveSuggestionInput,
  SourceDocument,
  SourceExcerpt,
  SuggestionResolution,
  TargetOrganization
} from '../../../preload/types'
import { getDb } from '../index'
import {
  extractionSuggestionsTable,
  sourceDocumentsTable,
  sourceExcerptsTable,
  suggestionResolutionsTable,
  type ExtractionSuggestionRow,
  type SourceDocumentRow,
  type SourceExcerptRow,
  type SuggestionResolutionRow
} from '../schema'
import { osQueries } from './os'
import { pipelineQueries } from './pipeline'
import { planQueries } from './plan'
import { presenceQueries } from './presence'
import { skillQueries } from './skills'
import { actionQueries } from './actions'
import { noteQueries } from './notes'

function deserializeDocument(row: SourceDocumentRow): SourceDocument {
  return {
    ...row,
    kind: row.kind as SourceDocument['kind'],
    status: row.status as SourceDocument['status']
  }
}

function deserializeExcerpt(row: SourceExcerptRow): SourceExcerpt {
  return {
    ...row,
    heading: row.heading ?? null
  }
}

function deserializeSuggestion(row: ExtractionSuggestionRow): ExtractionSuggestion {
  return {
    ...row,
    excerpt_id: row.excerpt_id ?? null,
    suggestion_type: row.suggestion_type as ExtractionSuggestion['suggestion_type'],
    status: row.status as ExtractionSuggestion['status']
  }
}

function deserializeResolution(row: SuggestionResolutionRow): SuggestionResolution {
  return {
    ...row,
    target_record_id: row.target_record_id ?? null,
    status: row.status as SuggestionResolution['status']
  }
}

function cleanTitle(filePath: string): string {
  return path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, ' ').trim()
}

function detectKind(filePath: string): SourceDocument['kind'] {
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.docx') {
    return 'docx'
  }

  if (ext === '.md') {
    return 'md'
  }

  return 'txt'
}

async function extractText(filePath: string): Promise<string> {
  const kind = detectKind(filePath)

  if (kind === 'docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  }

  return fs.readFileSync(filePath, 'utf8')
}

function groupExcerpts(text: string): Array<{ heading: string | null; content: string }> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const excerpts: Array<{ heading: string | null; content: string }> = []
  let currentHeading: string | null = null
  let buffer: string[] = []

  function flush(): void {
    if (buffer.length === 0) {
      return
    }

    excerpts.push({
      heading: currentHeading,
      content: buffer.join('\n\n')
    })
    buffer = []
  }

  for (const line of lines) {
    const isHeading =
      /^[A-Z0-9][A-Za-z0-9 '&/+().:-]{0,80}$/.test(line) &&
      (line === line.toUpperCase() ||
        /^(\d+\.|SECTION|Year\s+\d|Year\s+\d\+|Trinity|Columbia|Apple|LinkedIn)/.test(line))

    if (isHeading) {
      flush()
      currentHeading = line
      continue
    }

    buffer.push(line)

    if (buffer.join(' ').length > 900) {
      flush()
    }
  }

  flush()

  return excerpts.length > 0 ? excerpts : [{ heading: null, content: text.trim() }]
}

function excerptSummary(content: string): string {
  return content.replace(/\s+/g, ' ').slice(0, 260)
}

function buildSuggestions(
  documentTitle: string,
  excerpts: Array<{ id: string; heading: string | null; content: string }>
): Array<{
  excerpt_id: string | null
  suggestion_type: ExtractionSuggestion['suggestion_type']
  title: string
  payload_json: string
}> {
  const title = documentTitle.toLowerCase()
  const suggestions: Array<{
    excerpt_id: string | null
    suggestion_type: ExtractionSuggestion['suggestion_type']
    title: string
    payload_json: string
  }> = []

  if (title.includes('roadmap')) {
    for (const excerpt of excerpts) {
      const source = `${excerpt.heading ?? ''}\n${excerpt.content}`
      const matches = source.match(/Year\s+\d\+?[^|\n]*/g) ?? []

      for (const match of matches) {
        suggestions.push({
          excerpt_id: excerpt.id,
          suggestion_type: 'plan_node',
          title: match.trim(),
          payload_json: JSON.stringify({
            title: match.trim(),
            kind: 'phase',
            summary: excerptSummary(excerpt.content)
          })
        })
      }

      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'action_item',
        title: excerpt.heading ?? 'Roadmap follow-up action',
        payload_json: JSON.stringify({
          title: excerpt.heading ?? 'Roadmap follow-up action',
          details: excerptSummary(excerpt.content),
          status: 'next',
          priority: 'high'
        })
      })
    }
  }

  if (title.includes('skills')) {
    for (const excerpt of excerpts) {
      const label = excerpt.heading ?? excerpt.content.split('\n')[0] ?? ''
      if (!label) {
        continue
      }

      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'skill_node',
        title: label.trim(),
        payload_json: JSON.stringify({
          title: label.trim(),
          description: excerptSummary(excerpt.content),
          domain_title: 'Imported Skills'
        })
      })
    }
  }

  if (title.includes('landscape')) {
    const companies = [
      'Apple',
      'Columbia University',
      'Logitech',
      'Teenage Engineering',
      'Nothing',
      'Analog Devices',
      'STMicro',
      'Sonos',
      'HP Inc.',
      'Civic'
    ]

    for (const company of companies) {
      const excerpt = excerpts.find((entry) =>
        `${entry.heading ?? ''}\n${entry.content}`.toLowerCase().includes(company.toLowerCase())
      )

      if (!excerpt) {
        continue
      }

      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'target_organization',
        title: company,
        payload_json: JSON.stringify({
          name: company,
          category: company === 'Columbia University' ? 'University' : 'Company',
          why_fit: excerptSummary(excerpt.content),
          priority: company === 'Apple' || company === 'Columbia University' ? 'north_star' : 'high'
        })
      })
    }
  }

  if (title.includes('linkedin')) {
    for (const excerpt of excerpts.slice(0, 4)) {
      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'content_idea',
        title: excerpt.heading ?? 'LinkedIn positioning idea',
        payload_json: JSON.stringify({
          title: excerpt.heading ?? 'LinkedIn positioning idea',
          angle: excerptSummary(excerpt.content),
          status: 'backlog'
        })
      })
      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'narrative_fragment',
        title: excerpt.heading ?? 'LinkedIn narrative fragment',
        payload_json: JSON.stringify({
          title: excerpt.heading ?? 'LinkedIn narrative fragment',
          fragment_type: 'about',
          body: excerpt.content
        })
      })
      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'note_page',
        title: excerpt.heading ?? 'LinkedIn strategy note',
        payload_json: JSON.stringify({
          title: excerpt.heading ?? 'LinkedIn strategy note',
          body: excerpt.content,
          type: 'strategy',
          summary: excerptSummary(excerpt.content)
        })
      })
    }
  }

  if (title.includes('profile')) {
    for (const excerpt of excerpts.slice(0, 5)) {
      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'narrative_fragment',
        title: excerpt.heading ?? 'Profile narrative fragment',
        payload_json: JSON.stringify({
          title: excerpt.heading ?? 'Profile narrative fragment',
          fragment_type: 'story',
          body: excerpt.content
        })
      })
    }
  }

  if (title.includes('landscape')) {
    for (const excerpt of excerpts.slice(0, 3)) {
      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'application_record',
        title: excerpt.heading ?? 'Target opportunity',
        payload_json: JSON.stringify({
          title: excerpt.heading ?? 'Target opportunity',
          notes: excerptSummary(excerpt.content),
          status: 'target'
        })
      })
    }
  }

  if (!title.includes('linkedin')) {
    for (const excerpt of excerpts.slice(0, 2)) {
      suggestions.push({
        excerpt_id: excerpt.id,
        suggestion_type: 'note_page',
        title: excerpt.heading ?? `${documentTitle} note`,
        payload_json: JSON.stringify({
          title: excerpt.heading ?? `${documentTitle} note`,
          body: excerpt.content,
          type: 'reference',
          summary: excerptSummary(excerpt.content)
        })
      })
    }
  }

  return suggestions
}

function startOfWeekKey(now = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = date.getUTCDay()
  const delta = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export const libraryQueries = {
  listDocuments(): SourceDocument[] {
    const db = getDb()
    return db
      .select()
      .from(sourceDocumentsTable)
      .orderBy(desc(sourceDocumentsTable.updated_at))
      .all()
      .map(deserializeDocument)
  },

  listExcerpts(documentId: string): SourceExcerpt[] {
    const db = getDb()
    return db
      .select()
      .from(sourceExcerptsTable)
      .where(eq(sourceExcerptsTable.document_id, documentId))
      .orderBy(asc(sourceExcerptsTable.excerpt_index))
      .all()
      .map(deserializeExcerpt)
  },

  listSuggestions(documentId?: string): ExtractionSuggestion[] {
    const db = getDb()
    const rows = documentId
      ? db
          .select()
          .from(extractionSuggestionsTable)
          .where(eq(extractionSuggestionsTable.document_id, documentId))
          .orderBy(desc(extractionSuggestionsTable.updated_at))
          .all()
      : db
          .select()
          .from(extractionSuggestionsTable)
          .orderBy(desc(extractionSuggestionsTable.updated_at))
          .all()

    return rows.map(deserializeSuggestion)
  },

  listResolutions(suggestionId?: string): SuggestionResolution[] {
    const db = getDb()
    const rows = suggestionId
      ? db
          .select()
          .from(suggestionResolutionsTable)
          .where(eq(suggestionResolutionsTable.suggestion_id, suggestionId))
          .orderBy(desc(suggestionResolutionsTable.created_at))
          .all()
      : db
          .select()
          .from(suggestionResolutionsTable)
          .orderBy(desc(suggestionResolutionsTable.created_at))
          .all()

    return rows.map(deserializeResolution)
  },

  async importDocuments(input: ImportSourceDocumentsInput): Promise<SourceDocument[]> {
    const db = getDb()
    const imported: SourceDocument[] = []

    for (const filePath of input.file_paths) {
      const now = Date.now()
      const existing = this.listDocuments().find((entry) => entry.file_path === filePath)

      if (existing) {
        db.delete(sourceDocumentsTable).where(eq(sourceDocumentsTable.id, existing.id)).run()
      }

      const documentId = ulid()
      const title = cleanTitle(filePath)
      const kind = detectKind(filePath)
      const mimeType = (mime.lookup(filePath) ||
        (kind === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'text/plain')) as string

      try {
        const text = await extractText(filePath)
        const excerptSeed = groupExcerpts(text)

        db.insert(sourceDocumentsTable)
          .values({
            id: documentId,
            title,
            file_path: filePath,
            mime_type: mimeType,
            kind,
            status: 'ready',
            excerpt_count: excerptSeed.length,
            imported_at: now,
            updated_at: now
          })
          .run()

        const excerptsWithIds = excerptSeed.map((excerpt, index) => {
          const excerptId = ulid()

          db.insert(sourceExcerptsTable)
            .values({
              id: excerptId,
              document_id: documentId,
              excerpt_index: index,
              heading: excerpt.heading,
              content: excerpt.content,
              created_at: now
            })
            .run()

          return {
            id: excerptId,
            heading: excerpt.heading,
            content: excerpt.content
          }
        })

        for (const suggestion of buildSuggestions(title, excerptsWithIds)) {
          db.insert(extractionSuggestionsTable)
            .values({
              id: ulid(),
              document_id: documentId,
              excerpt_id: suggestion.excerpt_id,
              suggestion_type: suggestion.suggestion_type,
              title: suggestion.title,
              payload_json: suggestion.payload_json,
              status: 'pending',
              created_at: now,
              updated_at: now
            })
            .run()
        }

        imported.push(
          deserializeDocument(
            db
              .select()
              .from(sourceDocumentsTable)
              .where(eq(sourceDocumentsTable.id, documentId))
              .get()!
          )
        )
      } catch {
        db.insert(sourceDocumentsTable)
          .values({
            id: documentId,
            title,
            file_path: filePath,
            mime_type: mimeType,
            kind,
            status: 'error',
            excerpt_count: 0,
            imported_at: now,
            updated_at: now
          })
          .run()

        imported.push(
          deserializeDocument(
            db
              .select()
              .from(sourceDocumentsTable)
              .where(eq(sourceDocumentsTable.id, documentId))
              .get()!
          )
        )
      }
    }

    return imported
  },

  deleteDocument(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(sourceDocumentsTable).where(eq(sourceDocumentsTable.id, id)).run()
    return { ok: true }
  },

  resolveSuggestion(input: ResolveSuggestionInput): SuggestionResolution {
    const db = getDb()
    const suggestion = db
      .select()
      .from(extractionSuggestionsTable)
      .where(eq(extractionSuggestionsTable.id, input.suggestion_id))
      .get()

    if (!suggestion) {
      throw new Error('Suggestion not found')
    }

    let targetRecordId: string | null = null

    if (input.action === 'accepted') {
      const payload = JSON.parse(suggestion.payload_json) as Record<string, unknown>

      if (suggestion.suggestion_type === 'plan_node') {
        targetRecordId = planQueries.createNode({
          title: String(payload.title ?? suggestion.title),
          kind: 'phase',
          status: 'not_started',
          summary: String(payload.summary ?? '')
        }).id
      } else if (suggestion.suggestion_type === 'skill_node') {
        const domainTitle = String(payload.domain_title ?? 'Imported Skills')
        const existingDomain = skillQueries
          .listDomains()
          .find((entry) => entry.title.toLowerCase() === domainTitle.toLowerCase())
        const domainId =
          existingDomain?.id ??
          skillQueries.createDomain({
            title: domainTitle,
            description: 'Imported from source documents.'
          }).id

        targetRecordId = skillQueries.createNode({
          domain_id: domainId,
          title: String(payload.title ?? suggestion.title),
          description: String(payload.description ?? '')
        }).id
      } else if (suggestion.suggestion_type === 'target_organization') {
        targetRecordId = pipelineQueries.createOrganization({
          name: String(payload.name ?? suggestion.title),
          category: String(payload.category ?? 'Company'),
          why_fit: String(payload.why_fit ?? ''),
          priority: (payload.priority as TargetOrganization['priority'] | undefined) ?? 'high'
        }).id
      } else if (suggestion.suggestion_type === 'content_idea') {
        targetRecordId = presenceQueries.createContentIdea({
          title: String(payload.title ?? suggestion.title),
          angle: String(payload.angle ?? ''),
          status: 'backlog'
        }).id
      } else if (suggestion.suggestion_type === 'narrative_fragment') {
        targetRecordId = presenceQueries.createNarrativeFragment({
          title: String(payload.title ?? suggestion.title),
          fragment_type: String(payload.fragment_type ?? 'story'),
          body: String(payload.body ?? ''),
          source_document_id: suggestion.document_id,
          source_excerpt_id: suggestion.excerpt_id
        }).id
      } else if (suggestion.suggestion_type === 'weekly_priority') {
        targetRecordId = osQueries.createWeeklyPriority({
          week_key: startOfWeekKey(),
          title: String(payload.title ?? suggestion.title),
          status: 'planned',
          notes: String(payload.notes ?? '')
        }).id
      } else if (suggestion.suggestion_type === 'action_item') {
        targetRecordId = actionQueries.create({
          title: String(payload.title ?? suggestion.title),
          details: String(payload.details ?? ''),
          status: (payload.status as 'inbox' | 'next' | 'this_week' | 'today' | 'waiting' | 'someday' | 'done' | 'cancelled' | undefined) ?? 'inbox',
          priority: (payload.priority as 'low' | 'medium' | 'high' | 'critical' | undefined) ?? 'medium'
        }).id
      } else if (suggestion.suggestion_type === 'note_page') {
        targetRecordId = noteQueries.create({
          title: String(payload.title ?? suggestion.title),
          body: String(payload.body ?? ''),
          type: (payload.type as 'strategy' | 'meeting' | 'journal' | 'brief' | 'reference' | undefined) ?? 'reference',
          summary: String(payload.summary ?? '')
        }).id
      } else if (suggestion.suggestion_type === 'application_record') {
        targetRecordId = pipelineQueries.createApplication({
          title: String(payload.title ?? suggestion.title),
          status: 'target',
          notes: String(payload.notes ?? '')
        }).id
      }
    }

    const now = Date.now()

    db.update(extractionSuggestionsTable)
      .set({
        status: input.action,
        updated_at: now
      })
      .where(eq(extractionSuggestionsTable.id, input.suggestion_id))
      .run()

    const resolutionId = ulid()
    db.insert(suggestionResolutionsTable)
      .values({
        id: resolutionId,
        suggestion_id: input.suggestion_id,
        status: input.action,
        target_record_id: targetRecordId,
        created_at: now
      })
      .run()

    return deserializeResolution(
      db
        .select()
        .from(suggestionResolutionsTable)
        .where(eq(suggestionResolutionsTable.id, resolutionId))
        .get()!
    )
  }
}
