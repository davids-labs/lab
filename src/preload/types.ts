export const PROJECT_TYPES = ['hero', 'build', 'design', 'concept'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export const PROJECT_STATUSES = ['active', 'archived', 'draft'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const BLOCK_TYPES = [
  'how_it_works',
  'bom',
  'build_guide',
  'case_study',
  'image_gallery',
  'markdown',
  'link',
  'spec_table',
  'embed',
  'text',
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

export interface TodoData {
  items: Array<{ id: string; done: boolean; label: string }>
}

export type BlockDataMap = {
  bom: BomData
  build_guide: BuildGuideData
  case_study: CaseStudyData
  embed: EmbedData
  how_it_works: HowItWorksData
  image_gallery: ImageGalleryData
  link: LinkData
  markdown: MarkdownData
  note: NoteData
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
  pagesUrl: string | null
  autoCommitPending: boolean
}

export interface GitPublishResult {
  ok: boolean
  url: string | null
}

export interface LabBridge {
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
