import fs from 'node:fs'
import path from 'node:path'
import { desc } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  ContextPack,
  ExportBundle,
  GenerateContextPackInput,
  SaveContextPackInput
} from '../../../preload/types'
import { getDb } from '../index'
import { exportBundlesTable, type ExportBundleRow } from '../schema'
import { getAppDataDir } from '../../services/appPaths'
import { actionQueries } from './actions'
import { blockQueries } from './blocks'
import { libraryQueries } from './library'
import { noteQueries } from './notes'
import { osQueries } from './os'
import { pipelineQueries } from './pipeline'
import { planQueries } from './plan'
import { presenceQueries } from './presence'
import { projectQueries } from './projects'
import { skillQueries } from './skills'

function deserializeBundle(row: ExportBundleRow): ExportBundle {
  return {
    ...row,
    target: row.target as ExportBundle['target'],
    format: row.format as ExportBundle['format'],
    summary: row.summary ?? null,
    file_path: row.file_path ?? null,
    prompt_bundle: row.prompt_bundle ?? null
  }
}

function buildMarkdown(title: string, sections: Array<{ heading: string; body: unknown }>): string {
  const chunks = [`# ${title}`]

  for (const section of sections) {
    chunks.push(`\n## ${section.heading}\n`)
    if (typeof section.body === 'string') {
      chunks.push(section.body)
    } else {
      chunks.push('```json\n' + JSON.stringify(section.body, null, 2) + '\n```')
    }
  }

  return chunks.join('\n')
}

function recordBundle(pack: ContextPack, filePath?: string | null): void {
  const db = getDb()
  db.insert(exportBundlesTable)
    .values({
      id: pack.id,
      target: pack.target,
      format: pack.format,
      title: pack.title,
      summary: pack.summary,
      file_path: filePath ?? null,
      prompt_bundle: pack.prompt_bundle,
      created_at: pack.created_at
    })
    .run()
}

function buildPack(input: GenerateContextPackInput): ContextPack {
  const format = input.format ?? 'markdown'
  const createdAt = Date.now()
  const id = ulid()

  if (input.target === 'weekly_review') {
    const today = new Date().toISOString().slice(0, 10)
    const date = new Date(`${today}T00:00:00.000Z`)
    const day = date.getUTCDay()
    const delta = day === 0 ? -6 : 1 - day
    date.setUTCDate(date.getUTCDate() + delta)
    const weekKey = date.toISOString().slice(0, 10)
    const payload = {
      week_key: weekKey,
      priorities: osQueries.listWeeklyPriorities(weekKey),
      review: osQueries.getWeeklyReview(weekKey),
      actions: actionQueries.listOpen(),
      countdowns: osQueries.listCountdowns().slice(0, 5)
    }
    const title = `Weekly review packet · ${weekKey}`
    const markdown = buildMarkdown(title, [
      { heading: 'Weekly priorities', body: payload.priorities },
      { heading: 'Review record', body: payload.review ?? 'No weekly review yet.' },
      { heading: 'Open actions', body: payload.actions },
      { heading: 'Countdown pressure', body: payload.countdowns }
    ])

    return {
      id,
      target: input.target,
      format,
      title,
      summary: 'Operating packet for weekly reset, planning, and review.',
      markdown,
      payload_json: JSON.stringify(payload, null, 2),
      prompt_bundle:
        'Use this packet to draft a weekly review, identify the top 3 moves for next week, and call out blockers or drift.',
      created_at: createdAt
    }
  }

  if (input.target === 'application' || input.target === 'interview_prep') {
    if (!input.application_id) {
      throw new Error('An application id is required for this context pack')
    }

    const application = pipelineQueries.listApplications().find((entry) => entry.id === input.application_id)
    if (!application) {
      throw new Error('Application not found')
    }

    const organization = application.organization_id
      ? pipelineQueries.listOrganizations().find((entry) => entry.id === application.organization_id) ?? null
      : null
    const role = application.target_role_id
      ? pipelineQueries.listRoles().find((entry) => entry.id === application.target_role_id) ?? null
      : null
    const relatedActions = actionQueries
      .listOpen()
      .filter((item) => item.linked_application_id === application.id)
    const relatedNotes = noteQueries
      .list()
      .filter((note) =>
        noteQueries
          .listLinks(note.id)
          .some((link) => link.target_type === 'application_record' && link.target_id === application.id)
      )
    const title = `${input.target === 'application' ? 'Application' : 'Interview prep'} packet · ${application.title}`
    const payload = {
      application,
      organization,
      role,
      related_actions: relatedActions,
      related_notes: relatedNotes,
      narrative_fragments: presenceQueries.listNarrativeFragments().slice(0, 6),
      ready_assets: presenceQueries.listProfileAssets().filter((entry) => entry.status !== 'draft').slice(0, 6)
    }
    const markdown = buildMarkdown(title, [
      { heading: 'Application', body: payload.application },
      { heading: 'Organization', body: payload.organization ?? 'No organization linked.' },
      { heading: 'Role', body: payload.role ?? 'No role linked.' },
      { heading: 'Related actions', body: payload.related_actions },
      { heading: 'Related notes', body: payload.related_notes },
      { heading: 'Narrative fragments', body: payload.narrative_fragments },
      { heading: 'Ready assets', body: payload.ready_assets }
    ])

    return {
      id,
      target: input.target,
      format,
      title,
      summary: 'Career dossier for application planning or interview preparation.',
      markdown,
      payload_json: JSON.stringify(payload, null, 2),
      prompt_bundle:
        'Use this packet to draft a role-specific summary, identify missing proof, and prepare concise recruiter or interview talking points.',
      created_at: createdAt
    }
  }

  if (input.target === 'project_proof') {
    if (!input.project_id) {
      throw new Error('A project id is required for this context pack')
    }

    const project = projectQueries.get(input.project_id)
    const payload = {
      project,
      blocks: blockQueries.list(project.id),
      linked_skills: skillQueries
        .listNodes()
        .filter((skill) =>
          skillQueries
            .getNode(skill.id)
            .evidence.some((evidence) => evidence.project_id === project.id)
        ),
      fragments: presenceQueries
        .listNarrativeFragments()
        .filter((fragment) => fragment.linked_project_id === project.id)
    }
    const title = `Project proof packet · ${project.name}`
    const markdown = buildMarkdown(title, [
      { heading: 'Project', body: payload.project },
      { heading: 'Blocks', body: payload.blocks },
      { heading: 'Linked skills', body: payload.linked_skills },
      { heading: 'Narrative fragments', body: payload.fragments }
    ])

    return {
      id,
      target: input.target,
      format,
      title,
      summary: 'Project-to-proof packet for promotion into evidence, narrative, or portfolio surfaces.',
      markdown,
      payload_json: JSON.stringify(payload, null, 2),
      prompt_bundle:
        'Use this packet to identify the strongest case-study angles, evidence claims, and portfolio-ready proof that should be promoted outward.',
      created_at: createdAt
    }
  }

  if (input.target === 'narrative_signal') {
    const payload = {
      fragments: presenceQueries.listNarrativeFragments(),
      assets: presenceQueries.listProfileAssets(),
      cvs: presenceQueries.listCvVariants(),
      ideas: presenceQueries.listContentIdeas(),
      posts: presenceQueries.listContentPosts()
    }
    const title = 'Narrative and public signal packet'
    const markdown = buildMarkdown(title, [
      { heading: 'Narrative fragments', body: payload.fragments },
      { heading: 'Profile assets', body: payload.assets },
      { heading: 'CV variants', body: payload.cvs },
      { heading: 'Content ideas', body: payload.ideas },
      { heading: 'Draft posts', body: payload.posts }
    ])

    return {
      id,
      target: input.target,
      format,
      title,
      summary: 'Presence-layer packet for public narrative, recruiter packaging, and profile updates.',
      markdown,
      payload_json: JSON.stringify(payload, null, 2),
      prompt_bundle:
        'Use this packet to draft LinkedIn updates, recruiter summaries, and sharper public-facing language from the current narrative system.',
      created_at: createdAt
    }
  }

  const payload = {
    dashboard: {
      plan_nodes: planQueries.listNodes(),
      projects: projectQueries.list(),
      skills: skillQueries.listNodes(),
      actions: actionQueries.list(),
      notes: noteQueries.list(),
      organizations: pipelineQueries.listOrganizations(),
      applications: pipelineQueries.listApplications(),
      documents: libraryQueries.listDocuments()
    }
  }
  const title = 'Full workspace dump'
  const markdown = buildMarkdown(title, [{ heading: 'Workspace data', body: payload }])

  return {
    id,
    target: input.target,
    format,
    title,
    summary: 'Machine-friendly and human-readable structured dump of the current workspace.',
    markdown,
    payload_json: JSON.stringify(payload, null, 2),
    prompt_bundle:
      'Use this workspace dump as the source of truth for synthesis, planning, summarization, or context transfer into another tool.',
    created_at: createdAt
  }
}

export const exportQueries = {
  listBundles(): ExportBundle[] {
    const db = getDb()
    return db
      .select()
      .from(exportBundlesTable)
      .orderBy(desc(exportBundlesTable.created_at))
      .all()
      .map(deserializeBundle)
  },

  generateContextPack(input: GenerateContextPackInput): ContextPack {
    const pack = buildPack(input)
    recordBundle(pack)
    return pack
  },

  saveContextPack(input: SaveContextPackInput): { ok: boolean; path?: string } {
    const pack = buildPack(input)
    const exportsDir = path.join(getAppDataDir(), 'context-packs')
    fs.mkdirSync(exportsDir, { recursive: true })
    const safeTitle = pack.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const extension = pack.format === 'json' ? 'json' : 'md'
    const outputPath =
      input.output_path ?? path.join(exportsDir, `${safeTitle || 'context-pack'}.${extension}`)
    const content = pack.format === 'json' ? pack.payload_json : pack.markdown

    fs.writeFileSync(outputPath, content, 'utf8')
    recordBundle(pack, outputPath)

    return { ok: true, path: outputPath }
  }
}
