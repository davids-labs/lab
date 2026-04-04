import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const projectsTable = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull(),
  subtitle: text('subtitle'),
  core_value: text('core_value'),
  status: text('status').notNull().default('active'),
  page_config: text('page_config').notNull(),
  cover_asset_id: text('cover_asset_id'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
  git_enabled: integer('git_enabled', { mode: 'boolean' }).notNull().default(false),
  git_remote: text('git_remote'),
  git_pages_url: text('git_pages_url')
})

export const blocksTable = sqliteTable('blocks', {
  id: text('id').primaryKey(),
  project_id: text('project_id')
    .notNull()
    .references(() => projectsTable.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  sort_order: real('sort_order').notNull(),
  grid_col: integer('grid_col').notNull().default(0),
  grid_col_span: integer('grid_col_span').notNull().default(1),
  visible_on_page: integer('visible_on_page', { mode: 'boolean' }).notNull().default(true),
  data: text('data').notNull(),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const assetsTable = sqliteTable('assets', {
  id: text('id').primaryKey(),
  project_id: text('project_id')
    .notNull()
    .references(() => projectsTable.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  stored_path: text('stored_path').notNull(),
  mime_type: text('mime_type').notNull(),
  size_bytes: integer('size_bytes').notNull(),
  tags: text('tags').notNull().default('[]'),
  created_at: integer('created_at').notNull()
})

export const schema = {
  projectsTable,
  blocksTable,
  assetsTable
}

export type ProjectRow = typeof projectsTable.$inferSelect
export type BlockRow = typeof blocksTable.$inferSelect
export type AssetRow = typeof assetsTable.$inferSelect
