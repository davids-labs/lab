import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { getDatabasePath } from '../services/appPaths'
import { schema } from './schema'

let sqlite: Database.Database | null = null
let db: BetterSQLite3Database<typeof schema> | null = null

export function initializeDatabase(): void {
  if (sqlite && db) {
    return
  }

  sqlite = new Database(getDatabasePath())
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  sqlite.exec(`
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
