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

export const appSettingsTable = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value_json: text('value_json').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const weeklyPrioritiesTable = sqliteTable('weekly_priorities', {
  id: text('id').primaryKey(),
  week_key: text('week_key').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull().default('planned'),
  linked_plan_node_id: text('linked_plan_node_id'),
  linked_application_id: text('linked_application_id'),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const weeklyReviewsTable = sqliteTable('weekly_reviews', {
  id: text('id').primaryKey(),
  week_key: text('week_key').notNull().unique(),
  wins: text('wins'),
  friction: text('friction'),
  focus_next: text('focus_next'),
  proof_move: text('proof_move'),
  pipeline_move: text('pipeline_move'),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const targetOrganizationsTable = sqliteTable('target_organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('Company'),
  location: text('location'),
  priority: text('priority').notNull().default('medium'),
  why_fit: text('why_fit'),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const targetRolesTable = sqliteTable('target_roles', {
  id: text('id').primaryKey(),
  organization_id: text('organization_id').references(() => targetOrganizationsTable.id, {
    onDelete: 'set null'
  }),
  title: text('title').notNull(),
  location: text('location'),
  role_type: text('role_type'),
  season: text('season'),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const applicationRecordsTable = sqliteTable('application_records', {
  id: text('id').primaryKey(),
  organization_id: text('organization_id').references(() => targetOrganizationsTable.id, {
    onDelete: 'set null'
  }),
  target_role_id: text('target_role_id').references(() => targetRolesTable.id, {
    onDelete: 'set null'
  }),
  title: text('title').notNull(),
  status: text('status').notNull().default('target'),
  deadline_at: integer('deadline_at'),
  applied_at: integer('applied_at'),
  follow_up_at: integer('follow_up_at'),
  notes: text('notes'),
  linked_project_id: text('linked_project_id'),
  linked_skill_id: text('linked_skill_id'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const contactRecordsTable = sqliteTable('contact_records', {
  id: text('id').primaryKey(),
  organization_id: text('organization_id').references(() => targetOrganizationsTable.id, {
    onDelete: 'set null'
  }),
  full_name: text('full_name').notNull(),
  role_title: text('role_title'),
  platform: text('platform'),
  profile_url: text('profile_url'),
  relationship_stage: text('relationship_stage'),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const interactionRecordsTable = sqliteTable('interaction_records', {
  id: text('id').primaryKey(),
  contact_id: text('contact_id')
    .notNull()
    .references(() => contactRecordsTable.id, { onDelete: 'cascade' }),
  interaction_type: text('interaction_type').notNull(),
  happened_at: integer('happened_at').notNull(),
  summary: text('summary').notNull(),
  next_action_at: integer('next_action_at'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const narrativeFragmentsTable = sqliteTable('narrative_fragments', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  fragment_type: text('fragment_type').notNull().default('story'),
  body: text('body').notNull().default(''),
  source_document_id: text('source_document_id'),
  source_excerpt_id: text('source_excerpt_id'),
  linked_project_id: text('linked_project_id'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const profileAssetsTable = sqliteTable('profile_assets', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  platform: text('platform').notNull().default('linkedin'),
  content: text('content').notNull().default(''),
  status: text('status').notNull().default('draft'),
  notes: text('notes'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const cvVariantsTable = sqliteTable('cv_variants', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  target_role: text('target_role'),
  summary: text('summary'),
  content: text('content').notNull().default(''),
  is_default: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const contentIdeasTable = sqliteTable('content_ideas', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  angle: text('angle'),
  status: text('status').notNull().default('backlog'),
  linked_project_id: text('linked_project_id'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const contentPostsTable = sqliteTable('content_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  channel: text('channel').notNull().default('linkedin'),
  body: text('body').notNull().default(''),
  status: text('status').notNull().default('draft'),
  publish_date: text('publish_date'),
  linked_idea_id: text('linked_idea_id'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const sourceDocumentsTable = sqliteTable('source_documents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  file_path: text('file_path').notNull(),
  mime_type: text('mime_type').notNull(),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('ready'),
  excerpt_count: integer('excerpt_count').notNull().default(0),
  imported_at: integer('imported_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const sourceExcerptsTable = sqliteTable('source_excerpts', {
  id: text('id').primaryKey(),
  document_id: text('document_id')
    .notNull()
    .references(() => sourceDocumentsTable.id, { onDelete: 'cascade' }),
  excerpt_index: integer('excerpt_index').notNull(),
  heading: text('heading'),
  content: text('content').notNull(),
  created_at: integer('created_at').notNull()
})

export const extractionSuggestionsTable = sqliteTable('extraction_suggestions', {
  id: text('id').primaryKey(),
  document_id: text('document_id')
    .notNull()
    .references(() => sourceDocumentsTable.id, { onDelete: 'cascade' }),
  excerpt_id: text('excerpt_id').references(() => sourceExcerptsTable.id, { onDelete: 'set null' }),
  suggestion_type: text('suggestion_type').notNull(),
  title: text('title').notNull(),
  payload_json: text('payload_json').notNull(),
  status: text('status').notNull().default('pending'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull()
})

export const suggestionResolutionsTable = sqliteTable('suggestion_resolutions', {
  id: text('id').primaryKey(),
  suggestion_id: text('suggestion_id')
    .notNull()
    .references(() => extractionSuggestionsTable.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  target_record_id: text('target_record_id'),
  created_at: integer('created_at').notNull()
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
  countdownItemsTable,
  appSettingsTable,
  weeklyPrioritiesTable,
  weeklyReviewsTable,
  targetOrganizationsTable,
  targetRolesTable,
  applicationRecordsTable,
  contactRecordsTable,
  interactionRecordsTable,
  narrativeFragmentsTable,
  profileAssetsTable,
  cvVariantsTable,
  contentIdeasTable,
  contentPostsTable,
  sourceDocumentsTable,
  sourceExcerptsTable,
  extractionSuggestionsTable,
  suggestionResolutionsTable
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
export type AppSettingsRow = typeof appSettingsTable.$inferSelect
export type WeeklyPriorityRow = typeof weeklyPrioritiesTable.$inferSelect
export type WeeklyReviewRow = typeof weeklyReviewsTable.$inferSelect
export type TargetOrganizationRow = typeof targetOrganizationsTable.$inferSelect
export type TargetRoleRow = typeof targetRolesTable.$inferSelect
export type ApplicationRecordRow = typeof applicationRecordsTable.$inferSelect
export type ContactRecordRow = typeof contactRecordsTable.$inferSelect
export type InteractionRecordRow = typeof interactionRecordsTable.$inferSelect
export type NarrativeFragmentRow = typeof narrativeFragmentsTable.$inferSelect
export type ProfileAssetRow = typeof profileAssetsTable.$inferSelect
export type CvVariantRow = typeof cvVariantsTable.$inferSelect
export type ContentIdeaRow = typeof contentIdeasTable.$inferSelect
export type ContentPostRow = typeof contentPostsTable.$inferSelect
export type SourceDocumentRow = typeof sourceDocumentsTable.$inferSelect
export type SourceExcerptRow = typeof sourceExcerptsTable.$inferSelect
export type ExtractionSuggestionRow = typeof extractionSuggestionsTable.$inferSelect
export type SuggestionResolutionRow = typeof suggestionResolutionsTable.$inferSelect
