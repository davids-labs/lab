import type { BlockDataMap, BlockType, PublicPageConfig, PublicPageSection } from '../preload/types'

export const BLOCK_LABELS: Record<BlockType, string> = {
  bom: 'Bill of Materials',
  build_guide: 'Build Guide',
  case_study: 'Case Study',
  embed: 'Embed',
  failed_iteration: 'Failed Iteration',
  gcode: 'G-Code Snippet',
  how_it_works: 'How It Works',
  image_gallery: 'Image Gallery',
  link: 'Link',
  markdown: 'Markdown',
  note: 'Note',
  pinout: 'Pinout Diagram',
  spec_table: 'Spec Table',
  text: 'Text',
  todo: 'Todo'
}

export const WORKSPACE_ONLY_BLOCK_TYPES: BlockType[] = ['failed_iteration', 'note', 'todo']

export const BLOCK_GROUPS: Array<{ title: string; types: BlockType[] }> = [
  {
    title: 'Structured',
    types: ['bom', 'build_guide', 'how_it_works', 'case_study', 'pinout', 'spec_table']
  },
  {
    title: 'Media & Content',
    types: ['gcode', 'image_gallery', 'markdown', 'text', 'link', 'embed']
  },
  {
    title: 'Workspace Only',
    types: ['failed_iteration', 'note', 'todo']
  }
]

const DEFAULT_PAGE_CONFIG: PublicPageConfig = {
  theme: {
    accent: '#4f8cff',
    bg: '#0f1318',
    surface: '#171c23',
    fontHeading: 'IBM Plex Sans',
    fontBody: 'IBM Plex Mono',
    layoutVariant: 'default'
  },
  sections: [],
  hero: {
    showCoverImage: true
  },
  footer: {
    links: []
  }
}

const DEFAULT_BLOCK_DATA: BlockDataMap = {
  bom: {
    items: []
  },
  build_guide: {
    steps: []
  },
  case_study: {
    mode: 'structured',
    challenge: '',
    approach: '',
    outcome: ''
  },
  embed: {
    url: '',
    type: 'generic'
  },
  failed_iteration: {
    title: '',
    summary: '',
    lessons: [],
    status: 'discarded'
  },
  gcode: {
    code: '',
    machine: '',
    description: ''
  },
  how_it_works: {
    body: '<p></p>'
  },
  image_gallery: {
    asset_ids: [],
    captions: {},
    layout: 'grid'
  },
  link: {
    url: '',
    label: '',
    description: ''
  },
  markdown: {
    raw: ''
  },
  note: {
    body: '',
    colour: 'yellow'
  },
  pinout: {
    pins: [],
    layout: 'vertical'
  },
  spec_table: {
    headers: ['Property', 'Value'],
    rows: [['', '']]
  },
  text: {
    html: '<p></p>'
  },
  todo: {
    items: []
  }
}

export function cloneDefaultPageConfig(): PublicPageConfig {
  return structuredClone(DEFAULT_PAGE_CONFIG)
}

export function createDefaultBlockData<T extends BlockType>(type: T): BlockDataMap[T] {
  return structuredClone(DEFAULT_BLOCK_DATA[type])
}

export function getDefaultVisibility(type: BlockType): boolean {
  return !WORKSPACE_ONLY_BLOCK_TYPES.includes(type)
}

export function ensureSection(
  sections: PublicPageSection[],
  blockId: string,
  visible: boolean,
  sortOrder: number
): PublicPageSection[] {
  const existing = sections.find((section) => section.blockId === blockId)

  if (existing) {
    return sections.map((section) =>
      section.blockId === blockId
        ? {
            ...section,
            visible,
            sortOrder
          }
        : section
    )
  }

  return [...sections, { blockId, visible, sortOrder }]
}

export function removeSection(sections: PublicPageSection[], blockId: string): PublicPageSection[] {
  return sections.filter((section) => section.blockId !== blockId)
}
