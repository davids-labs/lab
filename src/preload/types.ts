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

export const SIDEBAR_TABS = ['assets', 'navigator'] as const
export type SidebarTab = (typeof SIDEBAR_TABS)[number]

export const SAVE_STATES = ['idle', 'saving', 'saved', 'error'] as const
export type SaveState = (typeof SAVE_STATES)[number]

export const PLAN_NODE_KINDS = ['phase', 'pillar', 'dependency', 'sprint'] as const
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
  'countdown_item'
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

export interface DashboardSummary {
  counts: {
    plan_nodes: number
    skills: number
    projects: number
    countdowns: number
    os_logs: number
  }
  active_phase: PlanNode | null
  active_phase_children: PlanNode[]
  countdowns: DashboardCountdown[]
  blocking_alerts: BlockingAlert[]
  skill_coverage: SkillCoverageSummary
  os: OsDashboardSummary
  ecosystem: EcosystemSummary
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
  sort_order?: number
}

export interface UpdateOsHabitInput {
  id: string
  name?: string
  description?: string | null
  frequency?: HabitFrequency
  target_count?: number
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

export interface FileFilter {
  name: string
  extensions: string[]
}

export interface OpenFilesOptions {
  title?: string
  filters?: FileFilter[]
  properties?: Array<'openFile' | 'multiSelections'>
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
    upsertHabitLog: (input: UpsertOsHabitLogInput) => Promise<OsHabitLog>
    listCountdowns: () => Promise<CountdownItem[]>
    createCountdown: (input: CreateCountdownInput) => Promise<CountdownItem>
    updateCountdown: (input: UpdateCountdownInput) => Promise<CountdownItem>
    deleteCountdown: (id: string) => Promise<{ ok: boolean }>
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
  }
}
