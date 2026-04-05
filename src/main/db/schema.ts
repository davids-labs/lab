import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const appMetaTable = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})

export const projectsTable = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull(),
  execution_stage: text('execution_stage').notNull().default('ideation'),
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

export const planNodesTable = sqliteTable('plan_nodes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  summary: text('summary'),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('not_started'),
  parent_id: text('parent_id'),
  start_at: integer('start_at'),
  due_at: integer('due_at'),
  notes: text('notes'),
  sort_order: real('sort_order').notNull().default(0),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const planNodeLinksTable = sqliteTable('plan_node_links', {
  id: text('id').primaryKey(),
  node_id: text('node_id')
    .notNull()
    .references(() => planNodesTable.id, { onDelete: 'cascade' }),
  target_type: text('target_type').notNull(),
  target_id: text('target_id').notNull(),
  required_stage: text('required_stage'),
  notes: text('notes'),
  created_at: integer('created_at').notNull()
})

export const skillDomainsTable = sqliteTable('skill_domains', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  sort_order: real('sort_order').notNull().default(0),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const skillNodesTable = sqliteTable('skill_nodes', {
  id: text('id').primaryKey(),
  domain_id: text('domain_id')
    .notNull()
    .references(() => skillDomainsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  sort_order: real('sort_order').notNull().default(0),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const skillEvidenceTable = sqliteTable('skill_evidence', {
  id: text('id').primaryKey(),
  skill_id: text('skill_id')
    .notNull()
    .references(() => skillNodesTable.id, { onDelete: 'cascade' }),
  source_type: text('source_type').notNull(),
  status: text('status').notNull().default('attached'),
  label: text('label').notNull(),
  notes: text('notes'),
  project_id: text('project_id'),
  certification_name: text('certification_name'),
  link_url: text('link_url'),
  required_stage: text('required_stage'),
  confirmed_at: integer('confirmed_at'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const osProfilesTable = sqliteTable('os_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  is_default: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const osTimeBlocksTable = sqliteTable('os_time_blocks', {
  id: text('id').primaryKey(),
  profile_id: text('profile_id')
    .notNull()
    .references(() => osProfilesTable.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  hours: real('hours').notNull(),
  color: text('color').notNull(),
  sort_order: real('sort_order').notNull().default(0),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const osDailyLogsTable = sqliteTable('os_daily_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(),
  profile_id: text('profile_id'),
  sleep_hours: real('sleep_hours').notNull().default(0),
  calories: integer('calories').notNull().default(0),
  protein_grams: integer('protein_grams').notNull().default(0),
  water_litres: real('water_litres').notNull().default(0),
  deep_work_minutes: integer('deep_work_minutes').notNull().default(0),
  gym_done: integer('gym_done', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const osHabitsTable = sqliteTable('os_habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  frequency: text('frequency').notNull().default('daily'),
  target_count: integer('target_count').notNull().default(1),
  sort_order: real('sort_order').notNull().default(0),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const osHabitLogsTable = sqliteTable('os_habit_logs', {
  id: text('id').primaryKey(),
  habit_id: text('habit_id')
    .notNull()
    .references(() => osHabitsTable.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const countdownItemsTable = sqliteTable('countdown_items', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  target_date: text('target_date').notNull(),
  category: text('category').notNull().default('General'),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const schema = {
  appMetaTable,
  projectsTable,
  blocksTable,
  assetsTable,
  planNodesTable,
  planNodeLinksTable,
  skillDomainsTable,
  skillNodesTable,
  skillEvidenceTable,
  osProfilesTable,
  osTimeBlocksTable,
  osDailyLogsTable,
  osHabitsTable,
  osHabitLogsTable,
  countdownItemsTable
}

export type AppMetaRow = typeof appMetaTable.$inferSelect
export type ProjectRow = typeof projectsTable.$inferSelect
export type BlockRow = typeof blocksTable.$inferSelect
export type AssetRow = typeof assetsTable.$inferSelect
export type PlanNodeRow = typeof planNodesTable.$inferSelect
export type PlanNodeLinkRow = typeof planNodeLinksTable.$inferSelect
export type SkillDomainRow = typeof skillDomainsTable.$inferSelect
export type SkillNodeRow = typeof skillNodesTable.$inferSelect
export type SkillEvidenceRow = typeof skillEvidenceTable.$inferSelect
export type OsProfileRow = typeof osProfilesTable.$inferSelect
export type OsTimeBlockRow = typeof osTimeBlocksTable.$inferSelect
export type OsDailyLogRow = typeof osDailyLogsTable.$inferSelect
export type OsHabitRow = typeof osHabitsTable.$inferSelect
export type OsHabitLogRow = typeof osHabitLogsTable.$inferSelect
export type CountdownItemRow = typeof countdownItemsTable.$inferSelect
