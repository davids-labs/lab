import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { getDatabasePath } from '../services/appPaths'
import { schema } from './schema'

let sqlite: Database.Database | null = null
let db: BetterSQLite3Database<typeof schema> | null = null

const SCHEMA_VERSION = 9

type Migration = {
  version: number
  description: string
  run: (database: Database.Database) => void
}

function hasTable(database: Database.Database, tableName: string): boolean {
  const row = database
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = ?
      `
    )
    .get(tableName)

  return Boolean(row)
}

function hasColumn(database: Database.Database, tableName: string, columnName: string): boolean {
  const rows = database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
  return rows.some((row) => row.name === columnName)
}

function ensureMetaTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

function getSchemaVersion(database: Database.Database): number {
  ensureMetaTable(database)

  const row = database.prepare(`SELECT value FROM app_meta WHERE key = 'schema_version'`).get() as
    | { value?: string }
    | undefined

  return Number(row?.value ?? 0) || 0
}

function setSchemaVersion(database: Database.Database, version: number): void {
  database
    .prepare(
      `
      INSERT INTO app_meta (key, value)
      VALUES ('schema_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `
    )
    .run(String(version))
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Create core project tables',
    run(database) {
      database.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          subtitle TEXT,
          core_value TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          page_config TEXT NOT NULL,
          cover_asset_id TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          git_enabled INTEGER NOT NULL DEFAULT 0,
          git_remote TEXT,
          git_pages_url TEXT
        );

        CREATE TABLE IF NOT EXISTS blocks (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          sort_order REAL NOT NULL,
          grid_col INTEGER NOT NULL DEFAULT 0,
          grid_col_span INTEGER NOT NULL DEFAULT 1,
          visible_on_page INTEGER NOT NULL DEFAULT 1,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          filename TEXT NOT NULL,
          stored_path TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          tags TEXT NOT NULL DEFAULT '[]',
          created_at INTEGER NOT NULL
        );
      `)
    }
  },
  {
    version: 2,
    description: 'Add project execution stage',
    run(database) {
      if (!hasColumn(database, 'projects', 'execution_stage')) {
        database.exec(`
          ALTER TABLE projects ADD COLUMN execution_stage TEXT NOT NULL DEFAULT 'ideation';
          UPDATE projects SET execution_stage = 'ideation' WHERE execution_stage IS NULL;
        `)
      }
    }
  },
  {
    version: 3,
    description: 'Create master plan tables',
    run(database) {
      if (!hasTable(database, 'plan_nodes')) {
        database.exec(`
          CREATE TABLE plan_nodes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            summary TEXT,
            kind TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'not_started',
            parent_id TEXT,
            start_at INTEGER,
            due_at INTEGER,
            notes TEXT,
            sort_order REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_plan_nodes_parent ON plan_nodes(parent_id);
        `)
      }

      if (!hasTable(database, 'plan_node_links')) {
        database.exec(`
          CREATE TABLE plan_node_links (
            id TEXT PRIMARY KEY,
            node_id TEXT NOT NULL REFERENCES plan_nodes(id) ON DELETE CASCADE,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            required_stage TEXT,
            notes TEXT,
            created_at INTEGER NOT NULL
          );

          CREATE INDEX idx_plan_node_links_node ON plan_node_links(node_id);
          CREATE INDEX idx_plan_node_links_target ON plan_node_links(target_type, target_id);
        `)
      }
    }
  },
  {
    version: 4,
    description: 'Create skill matrix tables',
    run(database) {
      if (!hasTable(database, 'skill_domains')) {
        database.exec(`
          CREATE TABLE skill_domains (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            sort_order REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'skill_nodes')) {
        database.exec(`
          CREATE TABLE skill_nodes (
            id TEXT PRIMARY KEY,
            domain_id TEXT NOT NULL REFERENCES skill_domains(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            sort_order REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_skill_nodes_domain ON skill_nodes(domain_id);
        `)
      }

      if (!hasTable(database, 'skill_evidence')) {
        database.exec(`
          CREATE TABLE skill_evidence (
            id TEXT PRIMARY KEY,
            skill_id TEXT NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
            source_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'attached',
            label TEXT NOT NULL,
            notes TEXT,
            project_id TEXT,
            certification_name TEXT,
            link_url TEXT,
            required_stage TEXT,
            confirmed_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_skill_evidence_skill ON skill_evidence(skill_id);
          CREATE INDEX idx_skill_evidence_project ON skill_evidence(project_id);
        `)
      }
    }
  },
  {
    version: 5,
    description: 'Create Personal OS and countdown tables',
    run(database) {
      if (!hasTable(database, 'os_profiles')) {
        database.exec(`
          CREATE TABLE os_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'os_time_blocks')) {
        database.exec(`
          CREATE TABLE os_time_blocks (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL REFERENCES os_profiles(id) ON DELETE CASCADE,
            label TEXT NOT NULL,
            hours REAL NOT NULL,
            color TEXT NOT NULL,
            sort_order REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_os_time_blocks_profile ON os_time_blocks(profile_id);
        `)
      }

      if (!hasTable(database, 'os_daily_logs')) {
        database.exec(`
          CREATE TABLE os_daily_logs (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL UNIQUE,
            profile_id TEXT,
            sleep_hours REAL NOT NULL DEFAULT 0,
            calories INTEGER NOT NULL DEFAULT 0,
            protein_grams INTEGER NOT NULL DEFAULT 0,
            water_litres REAL NOT NULL DEFAULT 0,
            deep_work_minutes INTEGER NOT NULL DEFAULT 0,
            gym_done INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'os_habits')) {
        database.exec(`
          CREATE TABLE os_habits (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            frequency TEXT NOT NULL DEFAULT 'daily',
            target_count INTEGER NOT NULL DEFAULT 1,
            sort_order REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'os_habit_logs')) {
        database.exec(`
          CREATE TABLE os_habit_logs (
            id TEXT PRIMARY KEY,
            habit_id TEXT NOT NULL REFERENCES os_habits(id) ON DELETE CASCADE,
            date TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_os_habit_logs_habit_date ON os_habit_logs(habit_id, date);
        `)
      }

      if (!hasTable(database, 'countdown_items')) {
        database.exec(`
          CREATE TABLE countdown_items (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            target_date TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'General',
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }
    }
  },
  {
    version: 6,
    description: 'Create LifeOS settings, pipeline, presence, library, and weekly review tables',
    run(database) {
      if (!hasTable(database, 'app_settings')) {
        database.exec(`
          CREATE TABLE app_settings (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'weekly_priorities')) {
        database.exec(`
          CREATE TABLE weekly_priorities (
            id TEXT PRIMARY KEY,
            week_key TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'planned',
            linked_plan_node_id TEXT,
            linked_application_id TEXT,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_weekly_priorities_week ON weekly_priorities(week_key);
        `)
      }

      if (!hasTable(database, 'weekly_reviews')) {
        database.exec(`
          CREATE TABLE weekly_reviews (
            id TEXT PRIMARY KEY,
            week_key TEXT NOT NULL UNIQUE,
            wins TEXT,
            friction TEXT,
            focus_next TEXT,
            proof_move TEXT,
            pipeline_move TEXT,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'target_organizations')) {
        database.exec(`
          CREATE TABLE target_organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Company',
            location TEXT,
            priority TEXT NOT NULL DEFAULT 'medium',
            why_fit TEXT,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'target_roles')) {
        database.exec(`
          CREATE TABLE target_roles (
            id TEXT PRIMARY KEY,
            organization_id TEXT,
            title TEXT NOT NULL,
            location TEXT,
            role_type TEXT,
            season TEXT,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_target_roles_org ON target_roles(organization_id);
        `)
      }

      if (!hasTable(database, 'application_records')) {
        database.exec(`
          CREATE TABLE application_records (
            id TEXT PRIMARY KEY,
            organization_id TEXT,
            target_role_id TEXT,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'target',
            deadline_at INTEGER,
            applied_at INTEGER,
            follow_up_at INTEGER,
            notes TEXT,
            linked_project_id TEXT,
            linked_skill_id TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_application_records_org ON application_records(organization_id);
          CREATE INDEX idx_application_records_status ON application_records(status);
        `)
      }

      if (!hasTable(database, 'contact_records')) {
        database.exec(`
          CREATE TABLE contact_records (
            id TEXT PRIMARY KEY,
            organization_id TEXT,
            full_name TEXT NOT NULL,
            role_title TEXT,
            platform TEXT,
            profile_url TEXT,
            relationship_stage TEXT,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_contact_records_org ON contact_records(organization_id);
        `)
      }

      if (!hasTable(database, 'interaction_records')) {
        database.exec(`
          CREATE TABLE interaction_records (
            id TEXT PRIMARY KEY,
            contact_id TEXT NOT NULL,
            interaction_type TEXT NOT NULL,
            happened_at INTEGER NOT NULL,
            summary TEXT NOT NULL,
            next_action_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_interaction_records_contact ON interaction_records(contact_id);
        `)
      }

      if (!hasTable(database, 'narrative_fragments')) {
        database.exec(`
          CREATE TABLE narrative_fragments (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            fragment_type TEXT NOT NULL DEFAULT 'story',
            body TEXT NOT NULL DEFAULT '',
            source_document_id TEXT,
            source_excerpt_id TEXT,
            linked_project_id TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'profile_assets')) {
        database.exec(`
          CREATE TABLE profile_assets (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            platform TEXT NOT NULL DEFAULT 'linkedin',
            content TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'draft',
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'cv_variants')) {
        database.exec(`
          CREATE TABLE cv_variants (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            target_role TEXT,
            summary TEXT,
            content TEXT NOT NULL DEFAULT '',
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'content_ideas')) {
        database.exec(`
          CREATE TABLE content_ideas (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            angle TEXT,
            status TEXT NOT NULL DEFAULT 'backlog',
            linked_project_id TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'content_posts')) {
        database.exec(`
          CREATE TABLE content_posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            channel TEXT NOT NULL DEFAULT 'linkedin',
            body TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'draft',
            publish_date TEXT,
            linked_idea_id TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'source_documents')) {
        database.exec(`
          CREATE TABLE source_documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            kind TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ready',
            excerpt_count INTEGER NOT NULL DEFAULT 0,
            imported_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'source_excerpts')) {
        database.exec(`
          CREATE TABLE source_excerpts (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
            excerpt_index INTEGER NOT NULL,
            heading TEXT,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL
          );

          CREATE INDEX idx_source_excerpts_document ON source_excerpts(document_id);
        `)
      }

      if (!hasTable(database, 'extraction_suggestions')) {
        database.exec(`
          CREATE TABLE extraction_suggestions (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
            excerpt_id TEXT REFERENCES source_excerpts(id) ON DELETE SET NULL,
            suggestion_type TEXT NOT NULL,
            title TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_extraction_suggestions_document ON extraction_suggestions(document_id);
          CREATE INDEX idx_extraction_suggestions_status ON extraction_suggestions(status);
        `)
      }

      if (!hasTable(database, 'suggestion_resolutions')) {
        database.exec(`
          CREATE TABLE suggestion_resolutions (
            id TEXT PRIMARY KEY,
            suggestion_id TEXT NOT NULL REFERENCES extraction_suggestions(id) ON DELETE CASCADE,
            status TEXT NOT NULL,
            target_record_id TEXT,
            created_at INTEGER NOT NULL
          );
        `)
      }
    }
  },
  {
    version: 7,
    description: 'Create V4 capture, actions, notes, calendar, exports, and integration tables',
    run(database) {
      if (!hasTable(database, 'inbox_entries')) {
        database.exec(`
          CREATE TABLE inbox_entries (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            body TEXT,
            kind TEXT NOT NULL DEFAULT 'note',
            source TEXT NOT NULL DEFAULT 'manual',
            status TEXT NOT NULL DEFAULT 'inbox',
            triage_target TEXT,
            linked_source_document_id TEXT,
            linked_excerpt_id TEXT,
            linked_project_id TEXT,
            linked_application_id TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_inbox_entries_status ON inbox_entries(status);
          CREATE INDEX idx_inbox_entries_updated ON inbox_entries(updated_at);
        `)
      }

      if (!hasTable(database, 'note_pages')) {
        database.exec(`
          CREATE TABLE note_pages (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            body TEXT NOT NULL DEFAULT '',
            type TEXT NOT NULL DEFAULT 'strategy',
            summary TEXT,
            archived INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'note_links')) {
        database.exec(`
          CREATE TABLE note_links (
            id TEXT PRIMARY KEY,
            note_id TEXT NOT NULL REFERENCES note_pages(id) ON DELETE CASCADE,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            created_at INTEGER NOT NULL
          );

          CREATE INDEX idx_note_links_note ON note_links(note_id);
        `)
      }

      if (!hasTable(database, 'action_items')) {
        database.exec(`
          CREATE TABLE action_items (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            details TEXT,
            status TEXT NOT NULL DEFAULT 'inbox',
            priority TEXT NOT NULL DEFAULT 'medium',
            recurrence TEXT NOT NULL DEFAULT 'none',
            due_at INTEGER,
            scheduled_for TEXT,
            linked_plan_node_id TEXT,
            linked_project_id TEXT,
            linked_application_id TEXT,
            linked_contact_id TEXT,
            linked_note_id TEXT,
            source_inbox_entry_id TEXT,
            completed_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_action_items_status ON action_items(status);
          CREATE INDEX idx_action_items_due ON action_items(due_at);
          CREATE INDEX idx_action_items_scheduled ON action_items(scheduled_for);
        `)
      }

      if (!hasTable(database, 'calendar_sources')) {
        database.exec(`
          CREATE TABLE calendar_sources (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            kind TEXT NOT NULL DEFAULT 'ics',
            source_value TEXT NOT NULL,
            sync_status TEXT NOT NULL DEFAULT 'idle',
            last_synced_at INTEGER,
            last_error TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'calendar_events')) {
        database.exec(`
          CREATE TABLE calendar_events (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL REFERENCES calendar_sources(id) ON DELETE CASCADE,
            external_id TEXT NOT NULL,
            title TEXT NOT NULL,
            starts_at INTEGER NOT NULL,
            ends_at INTEGER,
            location TEXT,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_calendar_events_source ON calendar_events(source_id);
          CREATE INDEX idx_calendar_events_starts ON calendar_events(starts_at);
        `)
      }

      if (!hasTable(database, 'review_sessions')) {
        database.exec(`
          CREATE TABLE review_sessions (
            id TEXT PRIMARY KEY,
            week_key TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'open',
            summary TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'export_bundles')) {
        database.exec(`
          CREATE TABLE export_bundles (
            id TEXT PRIMARY KEY,
            target TEXT NOT NULL,
            format TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT,
            file_path TEXT,
            prompt_bundle TEXT,
            created_at INTEGER NOT NULL
          );

          CREATE INDEX idx_export_bundles_created ON export_bundles(created_at);
        `)
      }

      if (!hasTable(database, 'integration_accounts')) {
        database.exec(`
          CREATE TABLE integration_accounts (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            label TEXT NOT NULL,
            config_json TEXT NOT NULL DEFAULT '{}',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }

      if (!hasTable(database, 'sync_jobs')) {
        database.exec(`
          CREATE TABLE sync_jobs (
            id TEXT PRIMARY KEY,
            integration_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'queued',
            label TEXT NOT NULL,
            summary TEXT,
            metadata_json TEXT,
            started_at INTEGER NOT NULL,
            finished_at INTEGER
          );

          CREATE INDEX idx_sync_jobs_started ON sync_jobs(started_at);
        `)
      }

      if (!hasTable(database, 'watch_folders')) {
        database.exec(`
          CREATE TABLE watch_folders (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            folder_path TEXT NOT NULL,
            mode TEXT NOT NULL DEFAULT 'library_documents',
            project_id TEXT,
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `)
      }
    }
  },
  {
    version: 8,
    description: 'Add habit trigger and anchor metadata',
    run(database) {
      if (!hasColumn(database, 'os_habits', 'trigger_context')) {
        database.exec(`
          ALTER TABLE os_habits ADD COLUMN trigger_context TEXT;
        `)
      }

      if (!hasColumn(database, 'os_habits', 'anchor_habit_id')) {
        database.exec(`
          ALTER TABLE os_habits ADD COLUMN anchor_habit_id TEXT;
        `)
      }
    }
  },
  {
    version: 9,
    description: 'Add horizon workflow, arc planning, and structured skills pipeline tables',
    run(database) {
      if (!hasColumn(database, 'plan_nodes', 'horizon_year')) {
        database.exec(`
          ALTER TABLE plan_nodes ADD COLUMN horizon_year INTEGER;
        `)
      }

      if (!hasTable(database, 'target_role_skill_requirements')) {
        database.exec(`
          CREATE TABLE target_role_skill_requirements (
            id TEXT PRIMARY KEY,
            role_id TEXT NOT NULL REFERENCES target_roles(id) ON DELETE CASCADE,
            skill_id TEXT NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
            minimum_state TEXT NOT NULL DEFAULT 'verified',
            priority TEXT NOT NULL DEFAULT 'high',
            notes TEXT,
            sort_order REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_role_requirements_role ON target_role_skill_requirements(role_id);
          CREATE INDEX idx_role_requirements_skill ON target_role_skill_requirements(skill_id);
        `)
      }

      if (!hasColumn(database, 'application_records', 'cv_variant_id')) {
        database.exec(`
          ALTER TABLE application_records ADD COLUMN cv_variant_id TEXT;
        `)
      }

      if (!hasColumn(database, 'cv_variants', 'target_role_id')) {
        database.exec(`
          ALTER TABLE cv_variants ADD COLUMN target_role_id TEXT;
        `)
      }

      if (!hasTable(database, 'cv_variant_sections')) {
        database.exec(`
          CREATE TABLE cv_variant_sections (
            id TEXT PRIMARY KEY,
            cv_variant_id TEXT NOT NULL REFERENCES cv_variants(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            summary TEXT,
            sort_order REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_cv_variant_sections_variant ON cv_variant_sections(cv_variant_id);
        `)
      }

      if (!hasTable(database, 'cv_variant_section_sources')) {
        database.exec(`
          CREATE TABLE cv_variant_section_sources (
            id TEXT PRIMARY KEY,
            section_id TEXT NOT NULL REFERENCES cv_variant_sections(id) ON DELETE CASCADE,
            source_type TEXT NOT NULL,
            source_id TEXT NOT NULL,
            notes TEXT,
            sort_order REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE INDEX idx_cv_section_sources_section ON cv_variant_section_sources(section_id);
        `)
      }

      const arcCount = database
        .prepare(`SELECT COUNT(*) AS count FROM plan_nodes WHERE kind = 'arc'`)
        .get() as { count: number }

      if (arcCount.count === 0) {
        const now = Date.now()
        const userProfileRow = database
          .prepare(`SELECT value_json FROM app_settings WHERE key = 'user_profile'`)
          .get() as { value_json?: string } | undefined
        let arcTitle = 'Current arc'

        try {
          const parsed = JSON.parse(userProfileRow?.value_json ?? '{}') as {
            north_star_goal?: string
          }
          if (typeof parsed.north_star_goal === 'string' && parsed.north_star_goal.trim().length > 0) {
            arcTitle = parsed.north_star_goal.trim()
          }
        } catch {
          arcTitle = 'Current arc'
        }

        const rootPhaseCount = database
          .prepare(
            `SELECT COUNT(*) AS count FROM plan_nodes WHERE kind = 'phase' AND parent_id IS NULL`
          )
          .get() as { count: number }
        const arcId = `arc-${now}`

        database
          .prepare(
            `
              INSERT INTO plan_nodes (
                id, title, summary, kind, status, parent_id, horizon_year, start_at, due_at, notes, sort_order, created_at, updated_at
              ) VALUES (?, ?, ?, 'arc', ?, NULL, ?, NULL, NULL, NULL, 0, ?, ?)
            `
          )
          .run(
            arcId,
            arcTitle,
            'Long-range arc anchoring the current planning horizons.',
            rootPhaseCount.count > 0 ? 'in_progress' : 'not_started',
            new Date().getUTCFullYear(),
            now,
            now
          )

        database
          .prepare(
            `
              UPDATE plan_nodes
              SET parent_id = ?, updated_at = ?
              WHERE kind = 'phase' AND parent_id IS NULL
            `
          )
          .run(arcId, now)
      }

      const variants = database
        .prepare(`SELECT id, content FROM cv_variants`)
        .all() as Array<{ id: string; content: string }>

      for (const variant of variants) {
        const sectionCount = database
          .prepare(`SELECT COUNT(*) AS count FROM cv_variant_sections WHERE cv_variant_id = ?`)
          .get(variant.id) as { count: number }

        if (sectionCount.count > 0) {
          continue
        }

        const now = Date.now()
        const summary = variant.content.trim().length > 0 ? variant.content.trim().slice(0, 400) : null
        database
          .prepare(
            `
              INSERT INTO cv_variant_sections (
                id, cv_variant_id, title, summary, sort_order, created_at, updated_at
              ) VALUES (?, ?, ?, ?, 0, ?, ?)
            `
          )
          .run(`cv-section-${variant.id}`, variant.id, 'Manual baseline', summary, now, now)
      }
    }
  }
]

function runMigrations(database: Database.Database): void {
  const currentVersion = getSchemaVersion(database)
  const pending = migrations.filter((migration) => migration.version > currentVersion)

  if (pending.length === 0) {
    return
  }

  for (const migration of pending) {
    database.transaction(() => {
      migration.run(database)
      setSchemaVersion(database, migration.version)
    })()
  }
}

export function initializeDatabase(): void {
  if (sqlite && db) {
    return
  }

  sqlite = new Database(getDatabasePath())
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  runMigrations(sqlite)

  if (getSchemaVersion(sqlite) < SCHEMA_VERSION) {
    setSchemaVersion(sqlite, SCHEMA_VERSION)
  }

  db = drizzle(sqlite, { schema })
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    throw new Error('Database has not been initialised')
  }

  return db
}

export function getSqlite(): Database.Database {
  if (!sqlite) {
    throw new Error('SQLite has not been initialised')
  }

  return sqlite
}
