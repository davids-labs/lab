import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { getDatabasePath } from '../services/appPaths'
import { schema } from './schema'

let sqlite: Database.Database | null = null
let db: BetterSQLite3Database<typeof schema> | null = null

const SCHEMA_VERSION = 5

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

  const row = database
    .prepare(`SELECT value FROM app_meta WHERE key = 'schema_version'`)
    .get() as { value?: string } | undefined

  return Number(row?.value ?? 0) || 0
}

function setSchemaVersion(database: Database.Database, version: number): void {
  database
    .prepare(`
      INSERT INTO app_meta (key, value)
      VALUES ('schema_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
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
