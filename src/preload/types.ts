export const PROJECT_TYPES = ['hero', 'build', 'design', 'concept'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export const PROJECT_STATUSES = ['active', 'archived', 'draft'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_EXECUTION_STAGES = [
  'ideation',
  'planning',
  'prototyping',
  'validation',
  'completed',
  'archived'
] as const
export type ProjectExecutionStage = (typeof PROJECT_EXECUTION_STAGES)[number]

export const BLOCK_TYPES = [
  'how_it_works',
  'bom',
  'build_guide',
  'case_study',
  'pinout',
  'gcode',
  'image_gallery',
  'markdown',
  'link',
  'spec_table',
  'embed',
  'text',
  'failed_iteration',
  'note',
  'todo'
] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

export const PAGE_LAYOUT_VARIANTS = ['default', 'minimal', 'magazine'] as const
export type PageLayoutVariant = (typeof PAGE_LAYOUT_VARIANTS)[number]

export const SIDEBAR_TABS = ['assets', 'navigator', 'connections'] as const
export type SidebarTab = (typeof SIDEBAR_TABS)[number]

export const SAVE_STATES = ['idle', 'saving', 'saved', 'error'] as const
export type SaveState = (typeof SAVE_STATES)[number]

export const PLAN_NODE_KINDS = ['arc', 'phase', 'pillar', 'dependency', 'sprint'] as const
export type PlanNodeKind = (typeof PLAN_NODE_KINDS)[number]

export const PLAN_NODE_STATUSES = [
  'not_started',
  'in_progress',
  'blocked',
  'at_risk',
  'complete',
  'paused'
] as const
export type PlanNodeStatus = (typeof PLAN_NODE_STATUSES)[number]

export const PLAN_LINK_TARGET_TYPES = [
  'plan_node',
  'project',
  'skill_node',
  'target_role',
  'countdown_item',
  'target_organization',
  'application_record',
  'contact_record',
  'weekly_priority',
  'narrative_fragment',
  'action_item',
  'note_page'
] as const
export type PlanLinkTargetType = (typeof PLAN_LINK_TARGET_TYPES)[number]

export const SKILL_STATES = ['unverified', 'in_progress', 'verified'] as const
export type SkillState = (typeof SKILL_STATES)[number]

export const SKILL_EVIDENCE_SOURCE_TYPES = ['project', 'certification', 'link'] as const
export type SkillEvidenceSourceType = (typeof SKILL_EVIDENCE_SOURCE_TYPES)[number]

export const SKILL_EVIDENCE_STATUSES = ['attached', 'suggested', 'confirmed'] as const
export type SkillEvidenceStatus = (typeof SKILL_EVIDENCE_STATUSES)[number]

export const HABIT_FREQUENCIES = ['daily', 'weekly'] as const
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number]

export const WEEKLY_PRIORITY_STATUSES = ['planned', 'active', 'done', 'dropped'] as const
export type WeeklyPriorityStatus = (typeof WEEKLY_PRIORITY_STATUSES)[number]

export const ORGANIZATION_PRIORITIES = ['north_star', 'high', 'medium', 'low'] as const
export type OrganizationPriority = (typeof ORGANIZATION_PRIORITIES)[number]

export const ROLE_REQUIREMENT_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const
export type RoleRequirementPriority = (typeof ROLE_REQUIREMENT_PRIORITIES)[number]

export const APPLICATION_STATUSES = [
  'target',
  'preparing',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'paused'
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const PRESENCE_ASSET_STATUSES = ['draft', 'ready', 'published'] as const
export type PresenceAssetStatus = (typeof PRESENCE_ASSET_STATUSES)[number]

export const CONTENT_STATUSES = ['backlog', 'drafting', 'ready', 'posted'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export const CV_SECTION_SOURCE_TYPES = ['skill_node', 'project', 'block'] as const
export type CvVariantSectionSourceType = (typeof CV_SECTION_SOURCE_TYPES)[number]

export const SOURCE_DOCUMENT_KINDS = ['docx', 'txt', 'md'] as const
export type SourceDocumentKind = (typeof SOURCE_DOCUMENT_KINDS)[number]

export const SOURCE_DOCUMENT_STATUSES = ['ready', 'error'] as const
export type SourceDocumentStatus = (typeof SOURCE_DOCUMENT_STATUSES)[number]

export const SUGGESTION_TYPES = [
  'plan_node',
  'skill_node',
  'target_organization',
  'content_idea',
  'narrative_fragment',
  'weekly_priority',
  'action_item',
  'note_page',
  'application_record'
] as const
export type SuggestionType = (typeof SUGGESTION_TYPES)[number]

export const SUGGESTION_STATUSES = ['pending', 'accepted', 'dismissed'] as const
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number]

export const SHELL_DENSITIES = ['comfortable', 'compact'] as const
export type ShellDensity = (typeof SHELL_DENSITIES)[number]

export const FONT_SCALES = ['sm', 'md', 'lg'] as const
export type FontScale = (typeof FONT_SCALES)[number]

export const SIDEBAR_MODES = ['full', 'compact', 'hidden'] as const
export type SidebarMode = (typeof SIDEBAR_MODES)[number]

export const HOME_LAYOUTS = ['horizons', 'focused'] as const
export type HomeLayout = (typeof HOME_LAYOUTS)[number]

export const WORKFLOW_VIEWS = ['day', 'week', 'month', 'six_months', 'year_arc'] as const
export type WorkflowView = (typeof WORKFLOW_VIEWS)[number]

export const SKILLS_PIPELINE_STATUSES = [
  'missing_skill',
  'needs_evidence',
  'needs_cv',
  'ready_to_apply',
  'applied'
] as const
export type SkillsPipelineStatus = (typeof SKILLS_PIPELINE_STATUSES)[number]

export const QUOTE_SORT_MODES = ['topic', 'author', 'recent'] as const
export type QuoteSortMode = (typeof QUOTE_SORT_MODES)[number]

export const CAPTURE_KINDS = [
  'note',
  'link',
  'idea',
  'opportunity',
  'reminder',
  'doc_snippet',
  'decision'
] as const
export type CaptureKind = (typeof CAPTURE_KINDS)[number]

export const CAPTURE_SOURCES = [
  'manual',
  'library',
  'watch_folder',
  'github',
  'calendar',
  'import'
] as const
export type CaptureSource = (typeof CAPTURE_SOURCES)[number]

export const CAPTURE_STATUSES = ['inbox', 'triaged', 'archived'] as const
export type CaptureStatus = (typeof CAPTURE_STATUSES)[number]

export const TRIAGE_TARGETS = [
  'direction',
  'execution',
  'proof',
  'pipeline',
  'presence',
  'library',
  'notes'
] as const
export type TriageTarget = (typeof TRIAGE_TARGETS)[number]

export const ACTION_STATUSES = [
  'inbox',
  'today',
  'this_week',
  'next',
  'waiting',
  'someday',
  'done',
  'cancelled'
] as const
export type ActionStatus = (typeof ACTION_STATUSES)[number]

export const ACTION_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type ActionPriority = (typeof ACTION_PRIORITIES)[number]

export const ACTION_RECURRENCES = ['none', 'daily', 'weekly', 'monthly'] as const
export type ActionRecurrence = (typeof ACTION_RECURRENCES)[number]

export const NOTE_PAGE_TYPES = ['strategy', 'meeting', 'journal', 'brief', 'reference'] as const
export type NotePageType = (typeof NOTE_PAGE_TYPES)[number]

export const NOTE_LINK_TARGET_TYPES = [
  'plan_node',
  'project',
  'application_record',
  'skill_node',
  'contact_record',
  'source_document',
  'source_excerpt',
  'action_item',
  'inbox_entry',
  'narrative_fragment'
] as const
export type NoteLinkTargetType = (typeof NOTE_LINK_TARGET_TYPES)[number]

export const CALENDAR_SOURCE_KINDS = ['ics', 'google'] as const
export type CalendarSourceKind = (typeof CALENDAR_SOURCE_KINDS)[number]

export const CALENDAR_SYNC_STATUSES = ['idle', 'syncing', 'ready', 'error'] as const
export type CalendarSyncStatus = (typeof CALENDAR_SYNC_STATUSES)[number]

export const REVIEW_SESSION_STATUSES = ['open', 'completed'] as const
export type ReviewSessionStatus = (typeof REVIEW_SESSION_STATUSES)[number]

export const EXPORT_FORMATS = ['json', 'markdown'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export const EXPORT_TARGETS = [
  'weekly_review',
  'application',
  'interview_prep',
  'project_proof',
  'narrative_signal',
  'workspace_dump'
] as const
export type ExportTarget = (typeof EXPORT_TARGETS)[number]

export const INTEGRATION_TYPES = ['google_calendar', 'github', 'watch_folder'] as const
export type IntegrationType = (typeof INTEGRATION_TYPES)[number]

export const SYNC_JOB_STATUSES = ['queued', 'running', 'success', 'error'] as const
export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number]

export const WATCH_FOLDER_MODES = ['library_documents', 'project_assets'] as const
export type WatchFolderMode = (typeof WATCH_FOLDER_MODES)[number]

export interface PublicPageConfig {
  theme: {
    accent: string
    bg: string
    surface: string
    fontHeading: string
    fontBody: string
    layoutVariant: PageLayoutVariant
  }
  sections: PublicPageSection[]
  hero: {
    showCoverImage: boolean
    tagline?: string
  }
  footer: {
    links: Array<{ label: string; url: string }>
  }
}

export interface PublicPageSection {
  blockId: string
  visible: boolean
  sortOrder: number
  customTitle?: string
}

export interface Project {
  id: string
  name: string
  slug: string
  type: ProjectType
  execution_stage: ProjectExecutionStage
  subtitle: string | null
  core_value: string | null
  status: ProjectStatus
  page_config: PublicPageConfig
  cover_asset_id: string | null
  created_at: number
  updated_at: number
  git_enabled: boolean
  git_remote: string | null
  git_pages_url: string | null
}

export interface Block<T = unknown> {
  id: string
  project_id: string
  type: BlockType
  sort_order: number
  grid_col: number
  grid_col_span: number
  visible_on_page: boolean
  data: T
  created_at: number
  updated_at: number
}

export interface Asset {
  id: string
  project_id: string
  filename: string
  stored_path: string
  mime_type: string
  size_bytes: number
  tags: string[]
  created_at: number
}

export interface PlanNode {
  id: string
  title: string
  summary: string | null
  kind: PlanNodeKind
  status: PlanNodeStatus
  parent_id: string | null
  horizon_year: number | null
  start_at: number | null
  due_at: number | null
  notes: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface PlanNodeLink {
  id: string
  node_id: string
  target_type: PlanLinkTargetType
  target_id: string
  required_stage: ProjectExecutionStage | null
  notes: string | null
  created_at: number
}

export interface PlanNodeDetail {
  node: PlanNode
  children: PlanNode[]
  links: PlanNodeLink[]
  blocking_reasons: string[]
}

export interface SkillDomain {
  id: string
  title: string
  description: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface SkillDomainSummary extends SkillDomain {
  total_nodes: number
  verified_nodes: number
  in_progress_nodes: number
  unverified_nodes: number
}

export interface SkillNode {
  id: string
  domain_id: string
  title: string
  description: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface SkillNodeSummary extends SkillNode {
  state: SkillState
  suggestion_count: number
  evidence_count: number
}

export interface SkillEvidence {
  id: string
  skill_id: string
  source_type: SkillEvidenceSourceType
  status: SkillEvidenceStatus
  label: string
  notes: string | null
  project_id: string | null
  certification_name: string | null
  link_url: string | null
  required_stage: ProjectExecutionStage | null
  confirmed_at: number | null
  created_at: number
  updated_at: number
}

export interface SkillNodeDetail {
  skill: SkillNodeSummary
  evidence: SkillEvidence[]
}

export interface OsProfile {
  id: string
  name: string
  is_default: boolean
  created_at: number
  updated_at: number
}

export interface OsTimeBlock {
  id: string
  profile_id: string
  label: string
  hours: number
  color: string
  sort_order: number
  created_at: number
  updated_at: number
}

export interface OsDailyLog {
  id: string
  date: string
  profile_id: string | null
  sleep_hours: number
  calories: number
  protein_grams: number
  water_litres: number
  deep_work_minutes: number
  gym_done: boolean
  notes: string | null
  created_at: number
  updated_at: number
}

export interface OsHabit {
  id: string
  name: string
  description: string | null
  frequency: HabitFrequency
  target_count: number
  trigger_context: string | null
  anchor_habit_id: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface OsHabitLog {
  id: string
  habit_id: string
  date: string
  completed: boolean
  notes: string | null
  created_at: number
  updated_at: number
}

export interface CountdownItem {
  id: string
  title: string
  target_date: string
  category: string
  notes: string | null
  created_at: number
  updated_at: number
}

export interface WeeklyPriority {
  id: string
  week_key: string
  title: string
  status: WeeklyPriorityStatus
  linked_plan_node_id: string | null
  linked_application_id: string | null
  notes: string | null
  created_at: number
  updated_at: number
}

export interface WeeklyReview {
  id: string
  week_key: string
  wins: string | null
  friction: string | null
  focus_next: string | null
  proof_move: string | null
  pipeline_move: string | null
  notes: string | null
  created_at: number
  updated_at: number
}

export interface DecisionLogEntry {
  id: string
  title: string
  decision: string
  rationale: string | null
  made_at: number
}

export interface UserProfile {
  full_name: string
  age: number | null
  location: string
  current_education: string
  degree_track: string
  current_employment: string
  north_star_goal: string
  target_geography: string
  github_url: string
  linkedin_url: string
  portfolio_url: string
}

export interface NarrativeProfile {
  origin_story: string
  strategic_narrative: string
  academic_focus: string
  columbia_strategy: string
  apple_strategy: string
  target_landscape_notes: string
  decision_log: DecisionLogEntry[]
}

export interface DashboardPreferences {
  visible_sections: string[]
  pinned_actions: string[]
  compact_mode: boolean
  focus_mode_default: boolean
  start_workspace: string
  show_onboarding: boolean
  sidebar_collapsed: boolean
  sidebar_mode: SidebarMode
  reduced_chrome: boolean
  command_palette_enabled: boolean
  preferred_home_layout: HomeLayout
}

export interface IntegrationSettings {
  github_repo_url: string
  sync_repo_url: string
  linkedin_profile_url: string
  default_document_directory: string
  default_watch_folder_path: string
  use_gh_cli: boolean
  github_monitor_orgs: string[]
  github_monitored_repos: string[]
  google_calendar_email: string
  google_oauth_client_id: string
}

export interface ThemeSettings {
  shell_density: ShellDensity
  accent_color: string
  font_scale: FontScale
}

export interface ArchetypeQuote {
  id: string
  text: string
  author: string
  work: string | null
  topics: string[]
  source_url: string | null
  source_type: 'builtin' | 'custom'
  created_at: number
  updated_at: number
}

export interface QuotePreferences {
  smart_rotation: boolean
  selected_topics: string[]
  sort_mode: QuoteSortMode
}

export interface SettingsBundle {
  user_profile: UserProfile
  narrative_profile: NarrativeProfile
  dashboard_preferences: DashboardPreferences
  integration_settings: IntegrationSettings
  theme_settings: ThemeSettings
  quote_preferences: QuotePreferences
  quote_library: ArchetypeQuote[]
}

export interface TargetOrganization {
  id: string
  name: string
  category: string
  location: string | null
  priority: OrganizationPriority
  why_fit: string | null
  notes: string | null
  created_at: number
  updated_at: number
}

export interface TargetRole {
  id: string
  organization_id: string | null
  title: string
  location: string | null
  role_type: string | null
  season: string | null
  notes: string | null
  created_at: number
  updated_at: number
}

export interface TargetRoleSkillRequirement {
  id: string
  role_id: string
  skill_id: string
  minimum_state: SkillState
  priority: RoleRequirementPriority
  notes: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface ApplicationRecord {
  id: string
  organization_id: string | null
  target_role_id: string | null
  cv_variant_id: string | null
  title: string
  status: ApplicationStatus
  deadline_at: number | null
  applied_at: number | null
  follow_up_at: number | null
  notes: string | null
  linked_project_id: string | null
  linked_skill_id: string | null
  created_at: number
  updated_at: number
}

export interface ContactRecord {
  id: string
  organization_id: string | null
  full_name: string
  role_title: string | null
  platform: string | null
  profile_url: string | null
  relationship_stage: string | null
  notes: string | null
  created_at: number
  updated_at: number
}

export interface InteractionRecord {
  id: string
  contact_id: string
  interaction_type: string
  happened_at: number
  summary: string
  next_action_at: number | null
  created_at: number
  updated_at: number
}

export interface NarrativeFragment {
  id: string
  title: string
  fragment_type: string
  body: string
  source_document_id: string | null
  source_excerpt_id: string | null
  linked_project_id: string | null
  created_at: number
  updated_at: number
}

export interface ProfileAsset {
  id: string
  title: string
  platform: string
  content: string
  status: PresenceAssetStatus
  notes: string | null
  created_at: number
  updated_at: number
}

export interface CvVariant {
  id: string
  title: string
  target_role: string | null
  target_role_id: string | null
  summary: string | null
  content: string
  is_default: boolean
  created_at: number
  updated_at: number
}

export interface CvVariantSection {
  id: string
  cv_variant_id: string
  title: string
  summary: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface CvVariantSectionSource {
  id: string
  section_id: string
  source_type: CvVariantSectionSourceType
  source_id: string
  notes: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface ContentIdea {
  id: string
  title: string
  angle: string | null
  status: ContentStatus
  linked_project_id: string | null
  created_at: number
  updated_at: number
}

export interface ContentPost {
  id: string
  title: string
  channel: string
  body: string
  status: string
  publish_date: string | null
  linked_idea_id: string | null
  created_at: number
  updated_at: number
}

export interface SourceDocument {
  id: string
  title: string
  file_path: string
  mime_type: string
  kind: SourceDocumentKind
  status: SourceDocumentStatus
  excerpt_count: number
  imported_at: number
  updated_at: number
}

export interface SourceExcerpt {
  id: string
  document_id: string
  excerpt_index: number
  heading: string | null
  content: string
  created_at: number
}

export interface ExtractionSuggestion {
  id: string
  document_id: string
  excerpt_id: string | null
  suggestion_type: SuggestionType
  title: string
  payload_json: string
  status: SuggestionStatus
  created_at: number
  updated_at: number
}

export interface SuggestionResolution {
  id: string
  suggestion_id: string
  status: Exclude<SuggestionStatus, 'pending'>
  target_record_id: string | null
  created_at: number
}

export interface InboxEntry {
  id: string
  title: string
  body: string | null
  kind: CaptureKind
  source: CaptureSource
  status: CaptureStatus
  triage_target: TriageTarget | null
  linked_source_document_id: string | null
  linked_excerpt_id: string | null
  linked_project_id: string | null
  linked_application_id: string | null
  created_at: number
  updated_at: number
}

export interface ActionItem {
  id: string
  title: string
  details: string | null
  status: ActionStatus
  priority: ActionPriority
  recurrence: ActionRecurrence
  due_at: number | null
  scheduled_for: string | null
  linked_plan_node_id: string | null
  linked_project_id: string | null
  linked_application_id: string | null
  linked_contact_id: string | null
  linked_note_id: string | null
  source_inbox_entry_id: string | null
  completed_at: number | null
  created_at: number
  updated_at: number
}

export interface NotePage {
  id: string
  title: string
  body: string
  type: NotePageType
  summary: string | null
  archived: boolean
  created_at: number
  updated_at: number
}

export interface NoteLink {
  id: string
  note_id: string
  target_type: NoteLinkTargetType
  target_id: string
  created_at: number
}

export interface CalendarSource {
  id: string
  label: string
  kind: CalendarSourceKind
  source_value: string
  sync_status: CalendarSyncStatus
  last_synced_at: number | null
  last_error: string | null
  created_at: number
  updated_at: number
}

export interface CalendarEvent {
  id: string
  source_id: string
  external_id: string
  title: string
  starts_at: number
  ends_at: number | null
  location: string | null
  notes: string | null
  created_at: number
  updated_at: number
}

export interface ReviewPrompt {
  id: string
  title: string
  body: string
  priority: 'normal' | 'high'
}

export interface ReviewArtifact {
  id: string
  label: string
  body: string
  entity_type: string | null
  entity_id: string | null
}

export interface ReviewSession {
  id: string
  week_key: string
  status: ReviewSessionStatus
  summary: string | null
  created_at: number
  updated_at: number
}

export interface WeeklyReviewSuggestion {
  text: string | null
  source_labels: string[]
}

export interface WeeklyReviewPrefill {
  week_key: string
  wins: WeeklyReviewSuggestion
  friction: WeeklyReviewSuggestion
  focus_next: WeeklyReviewSuggestion
  proof_move: WeeklyReviewSuggestion
  pipeline_move: WeeklyReviewSuggestion
}

export interface WeeklyReset {
  week_key: string
  prompts: ReviewPrompt[]
  artifacts: ReviewArtifact[]
  review: WeeklyReview | null
  priorities: WeeklyPriority[]
  actions: ActionItem[]
  prefill: WeeklyReviewPrefill
}

export interface ContextPack {
  id: string
  target: ExportTarget
  format: ExportFormat
  title: string
  summary: string
  markdown: string
  payload_json: string
  prompt_bundle: string
  created_at: number
}

export interface ExportBundle {
  id: string
  target: ExportTarget
  format: ExportFormat
  title: string
  summary: string | null
  file_path: string | null
  prompt_bundle: string | null
  created_at: number
}

export interface IntegrationAccount {
  id: string
  type: IntegrationType
  label: string
  config_json: string
  created_at: number
  updated_at: number
}

export interface GitHubCliStatus {
  authenticated: boolean
  login: string | null
  auth_source: 'gh-cli' | 'none'
}

export interface GoogleCalendarConnectionResult {
  account: IntegrationAccount
  source: CalendarSource
}

export interface SyncJob {
  id: string
  integration_type: IntegrationType
  status: SyncJobStatus
  label: string
  summary: string | null
  metadata_json: string | null
  started_at: number
  finished_at: number | null
}

export interface WatchFolder {
  id: string
  label: string
  folder_path: string
  mode: WatchFolderMode
  project_id: string | null
  enabled: boolean
  created_at: number
  updated_at: number
}

export interface DriftAlert {
  id: string
  title: string
  body: string
  severity: 'info' | 'warning' | 'critical'
  entity_type: string
  entity_id: string
}

export interface ProofGap {
  id: string
  title: string
  body: string
  target_role_id: string | null
  target_organization_id: string | null
  related_skill_id: string | null
  related_project_id: string | null
  severity: 'info' | 'warning' | 'critical'
}

export interface MorningDirective {
  headline: string
  reason: string
  target_route: string
  entity_type: string | null
  entity_id: string | null
}

export interface NextMove {
  id: string
  title: string
  reason: string
  target_route: string
  entity_type: string | null
  entity_id: string | null
  category: 'action' | 'habit' | 'pipeline' | 'plan' | 'countdown' | 'library'
  score: number
}

export interface ProjectConnectionSummary {
  project: Project
  plan_nodes: PlanNode[]
  skill_evidence: SkillEvidence[]
  cv_sections: Array<{
    section: CvVariantSection
    variant: CvVariant
    sources: CvVariantSectionSource[]
  }>
  applications: ApplicationRecord[]
  narrative_fragments: NarrativeFragment[]
  notes: NotePage[]
  actions: ActionItem[]
}

export interface SkillsPipelineEntry {
  id: string
  role: TargetRole
  requirement: TargetRoleSkillRequirement
  skill: SkillNodeSummary | null
  matching_projects: Project[]
  cv_sections: Array<{
    section: CvVariantSection
    variant: CvVariant
  }>
  applications: ApplicationRecord[]
  status: SkillsPipelineStatus
}

export interface WorkflowSnapshot {
  view: WorkflowView
  generated_at: number
  dashboard: DashboardSummary
  morning_directive: MorningDirective | null
  next_moves: NextMove[]
  weekly_reset: WeeklyReset | null
  weekly_review_prefill: WeeklyReviewPrefill | null
  weekly_evidence_queue: ProjectConnectionSummary[]
  monthly_prompts: string[]
  monthly_project_refreshes: ProjectConnectionSummary[]
  skills_pipeline: SkillsPipelineEntry[]
  arcs: PlanNode[]
  target_roles: TargetRole[]
}

export interface Recommendation {
  id: string
  title: string
  body: string
  target_route: string
}

export interface DashboardCountdown {
  id: string
  title: string
  target_date: string
  category: string
  days_remaining: number
}

export interface BlockingAlert {
  id: string
  node_id: string
  node_title: string
  reason: string
  severity: 'warning' | 'critical'
}

export interface SkillCoverageByDomain {
  domain_id: string
  title: string
  verified: number
  in_progress: number
  unverified: number
  total: number
  coverage: number
}

export interface SkillCoverageSummary {
  total: number
  verified: number
  in_progress: number
  unverified: number
  domains: SkillCoverageByDomain[]
}

export interface OsWeekSummary {
  days_logged: number
  average_sleep_hours: number
  average_calories: number
  average_protein_grams: number
  average_water_litres: number
  average_deep_work_minutes: number
  completed_gym_days: number
}

export interface OsHabitWithStatus extends OsHabit {
  today_completed: boolean
}

export interface OsDashboardSummary {
  today: OsDailyLog | null
  week: OsWeekSummary
  profiles: OsProfile[]
  active_profile_id: string | null
  time_blocks: OsTimeBlock[]
  habits: OsHabitWithStatus[]
}

export interface EcosystemSummary {
  total_projects: number
  by_type: Record<ProjectType, number>
  by_execution_stage: Record<ProjectExecutionStage, number>
  recently_updated: Project[]
}

export interface InboxSummary {
  open: number
  recent: InboxEntry[]
}

export interface ActionSummary {
  by_status: Record<ActionStatus, number>
  focus: ActionItem[]
  overdue: ActionItem[]
}

export interface NoteSummary {
  count: number
  recent: NotePage[]
}

export interface DashboardSummary {
  counts: {
    plan_nodes: number
    skills: number
    projects: number
    countdowns: number
    os_logs: number
    inbox_entries: number
    actions: number
    notes: number
  }
  active_phase: PlanNode | null
  active_phase_children: PlanNode[]
  countdowns: DashboardCountdown[]
  blocking_alerts: BlockingAlert[]
  skill_coverage: SkillCoverageSummary
  os: OsDashboardSummary
  ecosystem: EcosystemSummary
  weekly_priorities: WeeklyPriority[]
  weekly_review: WeeklyReview | null
  pipeline: {
    organizations: number
    active_applications: number
    next_actions: ApplicationRecord[]
  }
  presence: {
    ready_assets: number
    open_ideas: number
    prompts: string[]
  }
  library: {
    documents: number
    pending_suggestions: number
  }
  inbox: InboxSummary
  actions: ActionSummary
  notes: NoteSummary
  calendar: {
    sources: number
    upcoming: CalendarEvent[]
  }
  insights: {
    drift_alerts: DriftAlert[]
    proof_gaps: ProofGap[]
    recommendations: Recommendation[]
  }
  exports: {
    recent: ExportBundle[]
  }
  onboarding: {
    needs_setup: boolean
    missing: string[]
  }
}

export interface BomItem {
  id: string
  item: string
  detail: string
  qty: number
  cost?: string
}

export interface BomData {
  items: BomItem[]
}

export interface BuildGuideStep {
  id: string
  title: string
  body: string
  img_asset_id?: string
}

export interface BuildGuideData {
  steps: BuildGuideStep[]
}

export interface PinoutData {
  pins: Array<{
    id: string
    pin: string
    label: string
    function: string
    voltage?: string
    notes?: string
  }>
  layout: 'vertical' | 'two_column'
}

export interface GCodeData {
  code: string
  machine?: string
  description?: string
}

export interface CaseStudyData {
  mode: 'free' | 'structured'
  paragraphs?: string[]
  challenge?: string
  approach?: string
  outcome?: string
}

export interface HowItWorksData {
  body: string
}

export interface ImageGalleryData {
  asset_ids: string[]
  captions: Record<string, string>
  layout: 'grid' | 'carousel' | 'fullwidth'
}

export interface MarkdownData {
  raw: string
  filename?: string
  frontmatter?: Record<string, unknown>
}

export interface LinkData {
  url: string
  label: string
  description?: string
  favicon?: string
}

export interface TextData {
  html: string
}

export interface SpecTableData {
  headers: string[]
  rows: string[][]
}

export interface EmbedData {
  url: string
  type: 'youtube' | 'pdf' | 'figma' | 'generic'
}

export interface NoteData {
  body: string
  colour: 'yellow' | 'blue' | 'red' | 'green'
}

export interface FailedIterationData {
  title: string
  summary: string
  lessons: string[]
  status: 'discarded' | 'parked' | 'resolved'
}

export interface TodoData {
  items: Array<{ id: string; done: boolean; label: string }>
}

export type BlockDataMap = {
  bom: BomData
  build_guide: BuildGuideData
  case_study: CaseStudyData
  embed: EmbedData
  failed_iteration: FailedIterationData
  gcode: GCodeData
  how_it_works: HowItWorksData
  image_gallery: ImageGalleryData
  link: LinkData
  markdown: MarkdownData
  note: NoteData
  pinout: PinoutData
  spec_table: SpecTableData
  text: TextData
  todo: TodoData
}

export interface CreateProjectInput {
  name: string
  type: ProjectType
  subtitle?: string
  core_value?: string
}

export interface UpdateProjectInput {
  id: string
  name?: string
  type?: ProjectType
  execution_stage?: ProjectExecutionStage
  subtitle?: string | null
  core_value?: string | null
  status?: ProjectStatus
  page_config?: PublicPageConfig
  cover_asset_id?: string | null
  git_enabled?: boolean
  git_remote?: string | null
  git_pages_url?: string | null
}

export interface UpsertBlockInput<T = unknown> {
  id?: string
  project_id: string
  type: BlockType
  sort_order?: number
  grid_col?: number
  grid_col_span?: number
  visible_on_page?: boolean
  data?: T
}

export interface ReorderBlocksInput {
  projectId: string
  orderedIds: string[]
}

export interface AssetImportInput {
  projectId: string
  srcPath: string
  tags?: string[]
}

export interface CreatePlanNodeInput {
  title: string
  kind: PlanNodeKind
  parent_id?: string | null
  horizon_year?: number | null
  summary?: string | null
  status?: PlanNodeStatus
  start_at?: number | null
  due_at?: number | null
  notes?: string | null
  sort_order?: number
}

export interface UpdatePlanNodeInput {
  id: string
  title?: string
  kind?: PlanNodeKind
  parent_id?: string | null
  horizon_year?: number | null
  summary?: string | null
  status?: PlanNodeStatus
  start_at?: number | null
  due_at?: number | null
  notes?: string | null
  sort_order?: number
}

export interface CreatePlanLinkInput {
  node_id: string
  target_type: PlanLinkTargetType
  target_id: string
  required_stage?: ProjectExecutionStage | null
  notes?: string | null
}

export interface CreateSkillDomainInput {
  title: string
  description?: string | null
  sort_order?: number
}

export interface UpdateSkillDomainInput {
  id: string
  title?: string
  description?: string | null
  sort_order?: number
}

export interface CreateSkillNodeInput {
  domain_id: string
  title: string
  description?: string | null
  sort_order?: number
}

export interface UpdateSkillNodeInput {
  id: string
  domain_id?: string
  title?: string
  description?: string | null
  sort_order?: number
}

export interface CreateSkillEvidenceInput {
  skill_id: string
  source_type: SkillEvidenceSourceType
  label: string
  notes?: string | null
  project_id?: string | null
  certification_name?: string | null
  link_url?: string | null
  required_stage?: ProjectExecutionStage | null
}

export interface UpdateSkillEvidenceInput {
  id: string
  label?: string
  notes?: string | null
  project_id?: string | null
  certification_name?: string | null
  link_url?: string | null
  required_stage?: ProjectExecutionStage | null
}

export interface CreateOsProfileInput {
  name: string
  is_default?: boolean
}

export interface UpdateOsProfileInput {
  id: string
  name?: string
  is_default?: boolean
}

export interface UpsertOsTimeBlockInput {
  id?: string
  profile_id: string
  label: string
  hours: number
  color: string
  sort_order?: number
}

export interface UpsertOsDailyLogInput {
  id?: string
  date: string
  profile_id?: string | null
  sleep_hours?: number
  calories?: number
  protein_grams?: number
  water_litres?: number
  deep_work_minutes?: number
  gym_done?: boolean
  notes?: string | null
}

export interface CreateOsHabitInput {
  name: string
  description?: string | null
  frequency?: HabitFrequency
  target_count?: number
  trigger_context?: string | null
  anchor_habit_id?: string | null
  sort_order?: number
}

export interface UpdateOsHabitInput {
  id: string
  name?: string
  description?: string | null
  frequency?: HabitFrequency
  target_count?: number
  trigger_context?: string | null
  anchor_habit_id?: string | null
  sort_order?: number
}

export interface UpsertOsHabitLogInput {
  id?: string
  habit_id: string
  date: string
  completed: boolean
  notes?: string | null
}

export interface CreateCountdownInput {
  title: string
  target_date: string
  category?: string
  notes?: string | null
}

export interface UpdateCountdownInput {
  id: string
  title?: string
  target_date?: string
  category?: string
  notes?: string | null
}

export interface CreateWeeklyPriorityInput {
  week_key: string
  title: string
  status?: WeeklyPriorityStatus
  linked_plan_node_id?: string | null
  linked_application_id?: string | null
  notes?: string | null
}

export interface UpdateWeeklyPriorityInput {
  id: string
  title?: string
  status?: WeeklyPriorityStatus
  linked_plan_node_id?: string | null
  linked_application_id?: string | null
  notes?: string | null
}

export interface UpsertWeeklyReviewInput {
  week_key: string
  wins?: string | null
  friction?: string | null
  focus_next?: string | null
  proof_move?: string | null
  pipeline_move?: string | null
  notes?: string | null
}

export interface UpdateUserProfileInput {
  full_name?: string
  age?: number | null
  location?: string
  current_education?: string
  degree_track?: string
  current_employment?: string
  north_star_goal?: string
  target_geography?: string
  github_url?: string
  linkedin_url?: string
  portfolio_url?: string
}

export interface UpdateNarrativeProfileInput {
  origin_story?: string
  strategic_narrative?: string
  academic_focus?: string
  columbia_strategy?: string
  apple_strategy?: string
  target_landscape_notes?: string
  decision_log?: DecisionLogEntry[]
}

export interface UpdateDashboardPreferencesInput {
  visible_sections?: string[]
  pinned_actions?: string[]
  compact_mode?: boolean
  focus_mode_default?: boolean
  start_workspace?: string
  show_onboarding?: boolean
  sidebar_collapsed?: boolean
  sidebar_mode?: SidebarMode
  reduced_chrome?: boolean
  command_palette_enabled?: boolean
  preferred_home_layout?: HomeLayout
}

export interface UpdateIntegrationSettingsInput {
  github_repo_url?: string
  sync_repo_url?: string
  linkedin_profile_url?: string
  default_document_directory?: string
  default_watch_folder_path?: string
  use_gh_cli?: boolean
  github_monitor_orgs?: string[]
  github_monitored_repos?: string[]
  google_calendar_email?: string
  google_oauth_client_id?: string
}

export interface UpdateThemeSettingsInput {
  shell_density?: ShellDensity
  accent_color?: string
  font_scale?: FontScale
}

export interface UpdateQuotePreferencesInput {
  smart_rotation?: boolean
  selected_topics?: string[]
  sort_mode?: QuoteSortMode
}

export interface CreateArchetypeQuoteInput {
  text: string
  author: string
  work?: string | null
  topics?: string[]
  source_url?: string | null
}

export interface UpdateArchetypeQuoteInput {
  id: string
  text?: string
  author?: string
  work?: string | null
  topics?: string[]
  source_url?: string | null
}

export interface ImportArchetypeQuotesInput {
  quotes: CreateArchetypeQuoteInput[]
}

export interface CreateTargetOrganizationInput {
  name: string
  category?: string | null
  location?: string | null
  priority?: OrganizationPriority
  why_fit?: string | null
  notes?: string | null
}

export interface UpdateTargetOrganizationInput {
  id: string
  name?: string
  category?: string | null
  location?: string | null
  priority?: OrganizationPriority
  why_fit?: string | null
  notes?: string | null
}

export interface CreateTargetRoleInput {
  organization_id?: string | null
  title: string
  location?: string | null
  role_type?: string | null
  season?: string | null
  notes?: string | null
}

export interface UpdateTargetRoleInput {
  id: string
  organization_id?: string | null
  title?: string
  location?: string | null
  role_type?: string | null
  season?: string | null
  notes?: string | null
}

export interface CreateTargetRoleSkillRequirementInput {
  role_id: string
  skill_id: string
  minimum_state?: SkillState
  priority?: RoleRequirementPriority
  notes?: string | null
  sort_order?: number
}

export interface UpdateTargetRoleSkillRequirementInput {
  id: string
  skill_id?: string
  minimum_state?: SkillState
  priority?: RoleRequirementPriority
  notes?: string | null
  sort_order?: number
}

export interface CreateApplicationRecordInput {
  organization_id?: string | null
  target_role_id?: string | null
  cv_variant_id?: string | null
  title: string
  status?: ApplicationStatus
  deadline_at?: number | null
  applied_at?: number | null
  follow_up_at?: number | null
  notes?: string | null
  linked_project_id?: string | null
  linked_skill_id?: string | null
}

export interface UpdateApplicationRecordInput {
  id: string
  organization_id?: string | null
  target_role_id?: string | null
  cv_variant_id?: string | null
  title?: string
  status?: ApplicationStatus
  deadline_at?: number | null
  applied_at?: number | null
  follow_up_at?: number | null
  notes?: string | null
  linked_project_id?: string | null
  linked_skill_id?: string | null
}

export interface CreateContactRecordInput {
  organization_id?: string | null
  full_name: string
  role_title?: string | null
  platform?: string | null
  profile_url?: string | null
  relationship_stage?: string | null
  notes?: string | null
}

export interface UpdateContactRecordInput {
  id: string
  organization_id?: string | null
  full_name?: string
  role_title?: string | null
  platform?: string | null
  profile_url?: string | null
  relationship_stage?: string | null
  notes?: string | null
}

export interface CreateInteractionRecordInput {
  contact_id: string
  interaction_type: string
  happened_at?: number
  summary: string
  next_action_at?: number | null
}

export interface UpdateInteractionRecordInput {
  id: string
  interaction_type?: string
  happened_at?: number
  summary?: string
  next_action_at?: number | null
}

export interface CreateNarrativeFragmentInput {
  title: string
  fragment_type?: string
  body?: string
  source_document_id?: string | null
  source_excerpt_id?: string | null
  linked_project_id?: string | null
}

export interface UpdateNarrativeFragmentInput {
  id: string
  title?: string
  fragment_type?: string
  body?: string
  source_document_id?: string | null
  source_excerpt_id?: string | null
  linked_project_id?: string | null
}

export interface CreateProfileAssetInput {
  title: string
  platform?: string
  content?: string
  status?: PresenceAssetStatus
  notes?: string | null
}

export interface UpdateProfileAssetInput {
  id: string
  title?: string
  platform?: string
  content?: string
  status?: PresenceAssetStatus
  notes?: string | null
}

export interface CreateCvVariantInput {
  title: string
  target_role?: string | null
  target_role_id?: string | null
  summary?: string | null
  content?: string
  is_default?: boolean
}

export interface UpdateCvVariantInput {
  id: string
  title?: string
  target_role?: string | null
  target_role_id?: string | null
  summary?: string | null
  content?: string
  is_default?: boolean
}

export interface CreateCvVariantSectionInput {
  cv_variant_id: string
  title: string
  summary?: string | null
  sort_order?: number
}

export interface UpdateCvVariantSectionInput {
  id: string
  title?: string
  summary?: string | null
  sort_order?: number
}

export interface CreateCvVariantSectionSourceInput {
  section_id: string
  source_type: CvVariantSectionSourceType
  source_id: string
  notes?: string | null
  sort_order?: number
}

export interface UpdateCvVariantSectionSourceInput {
  id: string
  notes?: string | null
  sort_order?: number
}

export interface CreateContentIdeaInput {
  title: string
  angle?: string | null
  status?: ContentStatus
  linked_project_id?: string | null
}

export interface UpdateContentIdeaInput {
  id: string
  title?: string
  angle?: string | null
  status?: ContentStatus
  linked_project_id?: string | null
}

export interface CreateContentPostInput {
  title: string
  channel?: string
  body?: string
  status?: string
  publish_date?: string | null
  linked_idea_id?: string | null
}

export interface UpdateContentPostInput {
  id: string
  title?: string
  channel?: string
  body?: string
  status?: string
  publish_date?: string | null
  linked_idea_id?: string | null
}

export interface ImportSourceDocumentsInput {
  file_paths: string[]
}

export interface ResolveSuggestionInput {
  suggestion_id: string
  action: Exclude<SuggestionStatus, 'pending'>
}

export interface CreateInboxEntryInput {
  title: string
  body?: string | null
  kind?: CaptureKind
  source?: CaptureSource
  linked_source_document_id?: string | null
  linked_excerpt_id?: string | null
  linked_project_id?: string | null
  linked_application_id?: string | null
}

export interface UpdateInboxEntryInput {
  id: string
  title?: string
  body?: string | null
  kind?: CaptureKind
  status?: CaptureStatus
  triage_target?: TriageTarget | null
  linked_project_id?: string | null
  linked_application_id?: string | null
}

export interface TriageInboxEntryInput {
  id: string
  target: TriageTarget
  create_follow_up?: 'action' | 'note' | 'application' | 'narrative_fragment' | 'weekly_priority' | null
}

export interface CreateActionItemInput {
  title: string
  details?: string | null
  status?: ActionStatus
  priority?: ActionPriority
  recurrence?: ActionRecurrence
  due_at?: number | null
  scheduled_for?: string | null
  linked_plan_node_id?: string | null
  linked_project_id?: string | null
  linked_application_id?: string | null
  linked_contact_id?: string | null
  linked_note_id?: string | null
  source_inbox_entry_id?: string | null
}

export interface UpdateActionItemInput {
  id: string
  title?: string
  details?: string | null
  status?: ActionStatus
  priority?: ActionPriority
  recurrence?: ActionRecurrence
  due_at?: number | null
  scheduled_for?: string | null
  linked_plan_node_id?: string | null
  linked_project_id?: string | null
  linked_application_id?: string | null
  linked_contact_id?: string | null
  linked_note_id?: string | null
  completed_at?: number | null
}

export interface CreateNotePageInput {
  title: string
  body?: string
  type?: NotePageType
  summary?: string | null
}

export interface UpdateNotePageInput {
  id: string
  title?: string
  body?: string
  type?: NotePageType
  summary?: string | null
  archived?: boolean
}

export interface CreateNoteLinkInput {
  note_id: string
  target_type: NoteLinkTargetType
  target_id: string
}

export interface CreateCalendarSourceInput {
  label: string
  kind?: CalendarSourceKind
  source_value: string
}

export interface UpdateCalendarSourceInput {
  id: string
  label?: string
  kind?: CalendarSourceKind
  source_value?: string
  sync_status?: CalendarSyncStatus
  last_error?: string | null
}

export interface ImportCalendarSourceInput {
  file_path: string
  label?: string
}

export interface CreateReviewSessionInput {
  week_key: string
  summary?: string | null
}

export interface UpdateReviewSessionInput {
  id: string
  summary?: string | null
  status?: ReviewSessionStatus
}

export interface GenerateContextPackInput {
  target: ExportTarget
  format?: ExportFormat
  project_id?: string | null
  application_id?: string | null
  note_id?: string | null
  target_role_id?: string | null
  target_organization_id?: string | null
}

export interface SaveContextPackInput extends GenerateContextPackInput {
  output_path?: string | null
}

export interface CreateIntegrationAccountInput {
  type: IntegrationType
  label: string
  config_json?: string
}

export interface UpdateIntegrationAccountInput {
  id: string
  label?: string
  config_json?: string
}

export interface SyncGitHubReposInput {
  repo_urls?: string[]
}

export interface CreateWatchFolderInput {
  label: string
  folder_path: string
  mode?: WatchFolderMode
  project_id?: string | null
  enabled?: boolean
}

export interface UpdateWatchFolderInput {
  id: string
  label?: string
  folder_path?: string
  mode?: WatchFolderMode
  project_id?: string | null
  enabled?: boolean
}

export interface FileFilter {
  name: string
  extensions: string[]
}

export interface OpenFilesOptions {
  title?: string
  filters?: FileFilter[]
  properties?: Array<'openFile' | 'multiSelections' | 'openDirectory'>
}

export interface SaveFileOptions {
  title?: string
  defaultPath?: string
  filters?: FileFilter[]
}

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>
  body: string
  excerpt?: string
}

export interface GitCommitRecord {
  hash: string
  message: string
  timestamp: number
}

export interface GitStatus {
  enabled: boolean
  hasRepository: boolean
  remoteUrl: string | null
  hasToken: boolean
  authSource: 'gh-cli' | 'saved-token' | 'none'
  pagesUrl: string | null
  autoCommitPending: boolean
}

export interface GitPublishResult {
  ok: boolean
  url: string | null
}

export interface LabBridge {
  dashboard: {
    summary: () => Promise<DashboardSummary>
    importStarterTemplate: () => Promise<{ ok: boolean }>
  }
  capture: {
    list: (status?: CaptureStatus) => Promise<InboxEntry[]>
    create: (input: CreateInboxEntryInput) => Promise<InboxEntry>
    update: (input: UpdateInboxEntryInput) => Promise<InboxEntry>
    triage: (input: TriageInboxEntryInput) => Promise<InboxEntry>
    delete: (id: string) => Promise<{ ok: boolean }>
  }
  actions: {
    list: (status?: ActionStatus) => Promise<ActionItem[]>
    create: (input: CreateActionItemInput) => Promise<ActionItem>
    update: (input: UpdateActionItemInput) => Promise<ActionItem>
    delete: (id: string) => Promise<{ ok: boolean }>
  }
  notes: {
    list: () => Promise<NotePage[]>
    get: (id: string) => Promise<NotePage>
    create: (input: CreateNotePageInput) => Promise<NotePage>
    update: (input: UpdateNotePageInput) => Promise<NotePage>
    delete: (id: string) => Promise<{ ok: boolean }>
    listLinks: (noteId?: string) => Promise<NoteLink[]>
    createLink: (input: CreateNoteLinkInput) => Promise<NoteLink>
    deleteLink: (id: string) => Promise<{ ok: boolean }>
  }
  calendar: {
    listSources: () => Promise<CalendarSource[]>
    createSource: (input: CreateCalendarSourceInput) => Promise<CalendarSource>
    updateSource: (input: UpdateCalendarSourceInput) => Promise<CalendarSource>
    deleteSource: (id: string) => Promise<{ ok: boolean }>
    importIcs: (input: ImportCalendarSourceInput) => Promise<CalendarSource>
    syncSource: (id: string) => Promise<CalendarSource>
    listEvents: (sourceId?: string) => Promise<CalendarEvent[]>
  }
  review: {
    listSessions: () => Promise<ReviewSession[]>
    createSession: (input: CreateReviewSessionInput) => Promise<ReviewSession>
    updateSession: (input: UpdateReviewSessionInput) => Promise<ReviewSession>
    getWeeklyReset: (weekKey: string) => Promise<WeeklyReset>
  }
  exports: {
    listBundles: () => Promise<ExportBundle[]>
    generateContextPack: (input: GenerateContextPackInput) => Promise<ContextPack>
    saveContextPack: (input: SaveContextPackInput) => Promise<{ ok: boolean; path?: string }>
  }
  integrations: {
    listAccounts: () => Promise<IntegrationAccount[]>
    createAccount: (input: CreateIntegrationAccountInput) => Promise<IntegrationAccount>
    updateAccount: (input: UpdateIntegrationAccountInput) => Promise<IntegrationAccount>
    deleteAccount: (id: string) => Promise<{ ok: boolean }>
    getGitHubCliStatus: () => Promise<GitHubCliStatus>
    syncGitHubRepos: (input?: SyncGitHubReposInput) => Promise<SyncJob>
    connectGoogleCalendar: (clientId?: string) => Promise<GoogleCalendarConnectionResult>
    syncGoogleCalendar: (accountId?: string) => Promise<SyncJob>
    disconnectGoogleCalendar: (accountId: string) => Promise<{ ok: boolean }>
    listWatchFolders: () => Promise<WatchFolder[]>
    createWatchFolder: (input: CreateWatchFolderInput) => Promise<WatchFolder>
    updateWatchFolder: (input: UpdateWatchFolderInput) => Promise<WatchFolder>
    deleteWatchFolder: (id: string) => Promise<{ ok: boolean }>
    listSyncJobs: () => Promise<SyncJob[]>
    syncWatchFolder: (id: string) => Promise<SyncJob>
  }
  plan: {
    listNodes: () => Promise<PlanNode[]>
    getNode: (id: string) => Promise<PlanNodeDetail>
    createNode: (input: CreatePlanNodeInput) => Promise<PlanNode>
    updateNode: (input: UpdatePlanNodeInput) => Promise<PlanNode>
    deleteNode: (id: string) => Promise<{ ok: boolean }>
    listLinks: (nodeId?: string) => Promise<PlanNodeLink[]>
    createLink: (input: CreatePlanLinkInput) => Promise<PlanNodeLink>
    deleteLink: (id: string) => Promise<{ ok: boolean }>
  }
  workflow: {
    getSnapshot: (view: WorkflowView) => Promise<WorkflowSnapshot>
    getProjectConnections: (projectId: string) => Promise<ProjectConnectionSummary>
    getSkillsPipeline: (targetRoleId?: string | null) => Promise<SkillsPipelineEntry[]>
  }
  skills: {
    listDomains: () => Promise<SkillDomainSummary[]>
    createDomain: (input: CreateSkillDomainInput) => Promise<SkillDomain>
    updateDomain: (input: UpdateSkillDomainInput) => Promise<SkillDomain>
    deleteDomain: (id: string) => Promise<{ ok: boolean }>
    listNodes: (domainId?: string) => Promise<SkillNodeSummary[]>
    getNode: (id: string) => Promise<SkillNodeDetail>
    createNode: (input: CreateSkillNodeInput) => Promise<SkillNode>
    updateNode: (input: UpdateSkillNodeInput) => Promise<SkillNode>
    deleteNode: (id: string) => Promise<{ ok: boolean }>
    addEvidence: (input: CreateSkillEvidenceInput) => Promise<SkillEvidence>
    updateEvidence: (input: UpdateSkillEvidenceInput) => Promise<SkillEvidence>
    confirmEvidence: (id: string) => Promise<SkillEvidence>
    deleteEvidence: (id: string) => Promise<{ ok: boolean }>
  }
  os: {
    listProfiles: () => Promise<OsProfile[]>
    createProfile: (input: CreateOsProfileInput) => Promise<OsProfile>
    updateProfile: (input: UpdateOsProfileInput) => Promise<OsProfile>
    deleteProfile: (id: string) => Promise<{ ok: boolean }>
    listTimeBlocks: (profileId: string) => Promise<OsTimeBlock[]>
    upsertTimeBlock: (input: UpsertOsTimeBlockInput) => Promise<OsTimeBlock>
    deleteTimeBlock: (id: string) => Promise<{ ok: boolean }>
    listDailyLogs: () => Promise<OsDailyLog[]>
    getDailyLog: (date: string) => Promise<OsDailyLog | null>
    upsertDailyLog: (input: UpsertOsDailyLogInput) => Promise<OsDailyLog>
    listHabits: () => Promise<OsHabit[]>
    createHabit: (input: CreateOsHabitInput) => Promise<OsHabit>
    updateHabit: (input: UpdateOsHabitInput) => Promise<OsHabit>
    deleteHabit: (id: string) => Promise<{ ok: boolean }>
    listHabitLogs: () => Promise<OsHabitLog[]>
    upsertHabitLog: (input: UpsertOsHabitLogInput) => Promise<OsHabitLog>
    listCountdowns: () => Promise<CountdownItem[]>
    createCountdown: (input: CreateCountdownInput) => Promise<CountdownItem>
    updateCountdown: (input: UpdateCountdownInput) => Promise<CountdownItem>
    deleteCountdown: (id: string) => Promise<{ ok: boolean }>
    listWeeklyPriorities: (weekKey?: string) => Promise<WeeklyPriority[]>
    createWeeklyPriority: (input: CreateWeeklyPriorityInput) => Promise<WeeklyPriority>
    updateWeeklyPriority: (input: UpdateWeeklyPriorityInput) => Promise<WeeklyPriority>
    deleteWeeklyPriority: (id: string) => Promise<{ ok: boolean }>
    getWeeklyReview: (weekKey: string) => Promise<WeeklyReview | null>
    upsertWeeklyReview: (input: UpsertWeeklyReviewInput) => Promise<WeeklyReview>
  }
  settings: {
    getBundle: () => Promise<SettingsBundle>
    updateUserProfile: (input: UpdateUserProfileInput) => Promise<UserProfile>
    updateNarrativeProfile: (input: UpdateNarrativeProfileInput) => Promise<NarrativeProfile>
    updateDashboardPreferences: (
      input: UpdateDashboardPreferencesInput
    ) => Promise<DashboardPreferences>
    updateIntegrationSettings: (
      input: UpdateIntegrationSettingsInput
    ) => Promise<IntegrationSettings>
    updateThemeSettings: (input: UpdateThemeSettingsInput) => Promise<ThemeSettings>
    listQuotes: () => Promise<ArchetypeQuote[]>
    createQuote: (input: CreateArchetypeQuoteInput) => Promise<ArchetypeQuote>
    updateQuote: (input: UpdateArchetypeQuoteInput) => Promise<ArchetypeQuote>
    deleteQuote: (id: string) => Promise<{ ok: boolean }>
    importQuotes: (input: ImportArchetypeQuotesInput) => Promise<ArchetypeQuote[]>
    getQuotePreferences: () => Promise<QuotePreferences>
    updateQuotePreferences: (input: UpdateQuotePreferencesInput) => Promise<QuotePreferences>
  }
  pipeline: {
    listOrganizations: () => Promise<TargetOrganization[]>
    createOrganization: (input: CreateTargetOrganizationInput) => Promise<TargetOrganization>
    updateOrganization: (input: UpdateTargetOrganizationInput) => Promise<TargetOrganization>
    deleteOrganization: (id: string) => Promise<{ ok: boolean }>
    listRoles: () => Promise<TargetRole[]>
    createRole: (input: CreateTargetRoleInput) => Promise<TargetRole>
    updateRole: (input: UpdateTargetRoleInput) => Promise<TargetRole>
    deleteRole: (id: string) => Promise<{ ok: boolean }>
    listRoleRequirements: (roleId?: string) => Promise<TargetRoleSkillRequirement[]>
    createRoleRequirement: (
      input: CreateTargetRoleSkillRequirementInput
    ) => Promise<TargetRoleSkillRequirement>
    updateRoleRequirement: (
      input: UpdateTargetRoleSkillRequirementInput
    ) => Promise<TargetRoleSkillRequirement>
    deleteRoleRequirement: (id: string) => Promise<{ ok: boolean }>
    listApplications: () => Promise<ApplicationRecord[]>
    createApplication: (input: CreateApplicationRecordInput) => Promise<ApplicationRecord>
    updateApplication: (input: UpdateApplicationRecordInput) => Promise<ApplicationRecord>
    deleteApplication: (id: string) => Promise<{ ok: boolean }>
    listContacts: () => Promise<ContactRecord[]>
    createContact: (input: CreateContactRecordInput) => Promise<ContactRecord>
    updateContact: (input: UpdateContactRecordInput) => Promise<ContactRecord>
    deleteContact: (id: string) => Promise<{ ok: boolean }>
    listInteractions: (contactId?: string) => Promise<InteractionRecord[]>
    createInteraction: (input: CreateInteractionRecordInput) => Promise<InteractionRecord>
    updateInteraction: (input: UpdateInteractionRecordInput) => Promise<InteractionRecord>
    deleteInteraction: (id: string) => Promise<{ ok: boolean }>
  }
  presence: {
    listNarrativeFragments: () => Promise<NarrativeFragment[]>
    createNarrativeFragment: (
      input: CreateNarrativeFragmentInput
    ) => Promise<NarrativeFragment>
    updateNarrativeFragment: (
      input: UpdateNarrativeFragmentInput
    ) => Promise<NarrativeFragment>
    deleteNarrativeFragment: (id: string) => Promise<{ ok: boolean }>
    listProfileAssets: () => Promise<ProfileAsset[]>
    createProfileAsset: (input: CreateProfileAssetInput) => Promise<ProfileAsset>
    updateProfileAsset: (input: UpdateProfileAssetInput) => Promise<ProfileAsset>
    deleteProfileAsset: (id: string) => Promise<{ ok: boolean }>
    listCvVariants: () => Promise<CvVariant[]>
    createCvVariant: (input: CreateCvVariantInput) => Promise<CvVariant>
    updateCvVariant: (input: UpdateCvVariantInput) => Promise<CvVariant>
    deleteCvVariant: (id: string) => Promise<{ ok: boolean }>
    listCvSections: (cvVariantId?: string) => Promise<CvVariantSection[]>
    createCvSection: (input: CreateCvVariantSectionInput) => Promise<CvVariantSection>
    updateCvSection: (input: UpdateCvVariantSectionInput) => Promise<CvVariantSection>
    deleteCvSection: (id: string) => Promise<{ ok: boolean }>
    listCvSectionSources: (sectionId?: string) => Promise<CvVariantSectionSource[]>
    createCvSectionSource: (
      input: CreateCvVariantSectionSourceInput
    ) => Promise<CvVariantSectionSource>
    updateCvSectionSource: (
      input: UpdateCvVariantSectionSourceInput
    ) => Promise<CvVariantSectionSource>
    deleteCvSectionSource: (id: string) => Promise<{ ok: boolean }>
    syncCvVariantContent: (id: string) => Promise<CvVariant>
    listContentIdeas: () => Promise<ContentIdea[]>
    createContentIdea: (input: CreateContentIdeaInput) => Promise<ContentIdea>
    updateContentIdea: (input: UpdateContentIdeaInput) => Promise<ContentIdea>
    deleteContentIdea: (id: string) => Promise<{ ok: boolean }>
    listContentPosts: () => Promise<ContentPost[]>
    createContentPost: (input: CreateContentPostInput) => Promise<ContentPost>
    updateContentPost: (input: UpdateContentPostInput) => Promise<ContentPost>
    deleteContentPost: (id: string) => Promise<{ ok: boolean }>
  }
  library: {
    listDocuments: () => Promise<SourceDocument[]>
    importDocuments: (input: ImportSourceDocumentsInput) => Promise<SourceDocument[]>
    deleteDocument: (id: string) => Promise<{ ok: boolean }>
    listExcerpts: (documentId: string) => Promise<SourceExcerpt[]>
    listSuggestions: (documentId?: string) => Promise<ExtractionSuggestion[]>
    listResolutions: (suggestionId?: string) => Promise<SuggestionResolution[]>
    resolveSuggestion: (input: ResolveSuggestionInput) => Promise<SuggestionResolution>
  }
  project: {
    list: () => Promise<Project[]>
    get: (id: string) => Promise<Project>
    create: (input: CreateProjectInput) => Promise<Project>
    update: (input: UpdateProjectInput) => Promise<Project>
    delete: (id: string) => Promise<{ ok: boolean }>
  }
  block: {
    list: (projectId: string) => Promise<Block[]>
    upsert: (input: UpsertBlockInput) => Promise<Block>
    delete: (id: string) => Promise<{ ok: boolean }>
    reorder: (input: ReorderBlocksInput) => Promise<{ ok: boolean }>
  }
  asset: {
    import: (input: AssetImportInput) => Promise<Asset>
    list: (projectId: string) => Promise<Asset[]>
    delete: (id: string) => Promise<{ ok: boolean }>
    getDataUri: (id: string) => Promise<string>
  }
  page: {
    render: (projectId: string) => Promise<string>
    exportHtml: (projectId: string, outputPath?: string) => Promise<{ ok: boolean; path?: string }>
    exportZip: (projectId: string, outputPath?: string) => Promise<{ ok: boolean; path?: string }>
  }
  git: {
    status: (projectId: string) => Promise<GitStatus>
    init: (projectId: string) => Promise<{ ok: boolean }>
    commit: (projectId: string, message?: string) => Promise<{ hash: string }>
    log: (projectId: string) => Promise<GitCommitRecord[]>
    push: (projectId: string) => Promise<{ ok: boolean }>
    restore: (projectId: string, hash: string) => Promise<{ ok: boolean }>
    setRemote: (projectId: string, url: string) => Promise<{ ok: boolean }>
    setToken: (token: string | null) => Promise<{ ok: boolean }>
    publish: (projectId: string) => Promise<GitPublishResult>
  }
  system: {
    openFiles: (options?: OpenFilesOptions) => Promise<string[]>
    saveFile: (options?: SaveFileOptions) => Promise<string | null>
    readTextFile: (filePath: string) => Promise<string>
    toggleFullscreen: () => Promise<boolean>
    setFullscreen: (fullscreen: boolean) => Promise<boolean>
    isFullscreen: () => Promise<boolean>
  }
}
