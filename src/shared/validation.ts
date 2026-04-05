import { z } from 'zod'
import type {
  AssetImportInput,
  BlockDataMap,
  BlockType,
  CreateProjectInput,
  OpenFilesOptions,
  PublicPageConfig,
  ReorderBlocksInput,
  SaveFileOptions,
  UpdateProjectInput,
  UpsertBlockInput
} from '../preload/types'
import {
  BLOCK_TYPES,
  PROJECT_EXECUTION_STAGES,
  PAGE_LAYOUT_VARIANTS,
  PROJECT_STATUSES,
  PROJECT_TYPES
} from '../preload/types'
import { cloneDefaultPageConfig, createDefaultBlockData } from './defaults'

const footerLinkSchema = z.object({
  label: z.string().trim().default(''),
  url: z.string().trim().default('')
})

export const pageConfigSchema = z.object({
  theme: z.object({
    accent: z.string().trim().default('#8d947f'),
    bg: z.string().trim().default('#111315'),
    surface: z.string().trim().default('#171a1d'),
    fontHeading: z.string().trim().default('IBM Plex Sans'),
    fontBody: z.string().trim().default('IBM Plex Mono'),
    layoutVariant: z.enum(PAGE_LAYOUT_VARIANTS).default('default')
  }),
  sections: z
    .array(
      z.object({
        blockId: z.string().trim().min(1),
        visible: z.boolean().default(true),
        sortOrder: z.number().default(0),
        customTitle: z.string().trim().optional()
      })
    )
    .default([]),
  hero: z.object({
    showCoverImage: z.boolean().default(true),
    tagline: z.string().trim().optional()
  }),
  footer: z.object({
    links: z.array(footerLinkSchema).default([])
  })
})

const bomDataSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).default(''),
        item: z.string().default(''),
        detail: z.string().default(''),
        qty: z.number().default(1),
        cost: z.string().optional()
      })
    )
    .default([])
})

const buildGuideDataSchema = z.object({
  steps: z
    .array(
      z.object({
        id: z.string().trim().min(1).default(''),
        title: z.string().default(''),
        body: z.string().default('<p></p>'),
        img_asset_id: z.string().trim().optional()
      })
    )
    .default([])
})

const caseStudyDataSchema = z.object({
  mode: z.enum(['free', 'structured']).default('structured'),
  paragraphs: z.array(z.string()).optional(),
  challenge: z.string().optional(),
  approach: z.string().optional(),
  outcome: z.string().optional()
})

const embedDataSchema = z.object({
  url: z.string().default(''),
  type: z.enum(['youtube', 'pdf', 'figma', 'generic']).default('generic')
})

const failedIterationDataSchema = z.object({
  title: z.string().default(''),
  summary: z.string().default(''),
  lessons: z.array(z.string()).default([]),
  status: z.enum(['discarded', 'parked', 'resolved']).default('discarded')
})

const gcodeDataSchema = z.object({
  code: z.string().default(''),
  machine: z.string().optional(),
  description: z.string().optional()
})

const howItWorksDataSchema = z.object({
  body: z.string().default('<p></p>')
})

const imageGalleryDataSchema = z.object({
  asset_ids: z.array(z.string()).default([]),
  captions: z.record(z.string()).default({}),
  layout: z.enum(['grid', 'carousel', 'fullwidth']).default('grid')
})

const linkDataSchema = z.object({
  url: z.string().default(''),
  label: z.string().default(''),
  description: z.string().optional(),
  favicon: z.string().optional()
})

const markdownDataSchema = z.object({
  raw: z.string().default(''),
  filename: z.string().optional(),
  frontmatter: z.record(z.unknown()).optional()
})

const noteDataSchema = z.object({
  body: z.string().default(''),
  colour: z.enum(['yellow', 'blue', 'red', 'green']).default('yellow')
})

const pinoutDataSchema = z.object({
  pins: z
    .array(
      z.object({
        id: z.string().trim().min(1).default(''),
        pin: z.string().default(''),
        label: z.string().default(''),
        function: z.string().default(''),
        voltage: z.string().optional(),
        notes: z.string().optional()
      })
    )
    .default([]),
  layout: z.enum(['vertical', 'two_column']).default('vertical')
})

const specTableDataSchema = z.object({
  headers: z.array(z.string()).default(['Property', 'Value']),
  rows: z.array(z.array(z.string())).default([['', '']])
})

const textDataSchema = z.object({
  html: z.string().default('<p></p>')
})

const todoDataSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).default(''),
        done: z.boolean().default(false),
        label: z.string().default('')
      })
    )
    .default([])
})

const blockDataSchemas: Record<BlockType, z.ZodTypeAny> = {
  bom: bomDataSchema,
  build_guide: buildGuideDataSchema,
  case_study: caseStudyDataSchema,
  embed: embedDataSchema,
  failed_iteration: failedIterationDataSchema,
  gcode: gcodeDataSchema,
  how_it_works: howItWorksDataSchema,
  image_gallery: imageGalleryDataSchema,
  link: linkDataSchema,
  markdown: markdownDataSchema,
  note: noteDataSchema,
  pinout: pinoutDataSchema,
  spec_table: specTableDataSchema,
  text: textDataSchema,
  todo: todoDataSchema
}

export const createProjectInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(PROJECT_TYPES),
  subtitle: z.string().trim().max(240).optional(),
  core_value: z.string().trim().max(240).optional()
})

export const updateProjectInputSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  type: z.enum(PROJECT_TYPES).optional(),
  execution_stage: z.enum(PROJECT_EXECUTION_STAGES).optional(),
  subtitle: z.string().trim().max(240).nullable().optional(),
  core_value: z.string().trim().max(240).nullable().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  page_config: pageConfigSchema.optional(),
  cover_asset_id: z.string().trim().nullable().optional(),
  git_enabled: z.boolean().optional(),
  git_remote: z.string().trim().nullable().optional(),
  git_pages_url: z.string().trim().nullable().optional()
})

export const upsertBlockInputSchema = z.object({
  id: z.string().trim().optional(),
  project_id: z.string().trim().min(1),
  type: z.enum(BLOCK_TYPES),
  sort_order: z.number().optional(),
  grid_col: z.number().int().min(0).optional(),
  grid_col_span: z.number().int().min(1).max(2).optional(),
  visible_on_page: z.boolean().optional(),
  data: z.unknown().optional()
})

export const reorderBlocksInputSchema = z.object({
  projectId: z.string().trim().min(1),
  orderedIds: z.array(z.string().trim().min(1))
})

export const assetImportInputSchema = z.object({
  projectId: z.string().trim().min(1),
  srcPath: z.string().trim().min(1),
  tags: z.array(z.string().trim()).optional()
})

export const openFilesOptionsSchema = z.object({
  title: z.string().optional(),
  filters: z
    .array(
      z.object({
        name: z.string(),
        extensions: z.array(z.string())
      })
    )
    .optional(),
  properties: z.array(z.enum(['openFile', 'multiSelections'])).optional()
})

export const saveFileOptionsSchema = z.object({
  title: z.string().optional(),
  defaultPath: z.string().optional(),
  filters: z
    .array(
      z.object({
        name: z.string(),
        extensions: z.array(z.string())
      })
    )
    .optional()
})

export function parsePageConfig(value: unknown): PublicPageConfig {
  const result = pageConfigSchema.safeParse(value)

  if (result.success) {
    const next = result.data

    if (
      next.theme.accent === '#4f8cff' &&
      next.theme.bg === '#0f1318' &&
      next.theme.surface === '#171c23'
    ) {
      return {
        ...next,
        theme: {
          ...next.theme,
          accent: '#8d947f',
          bg: '#111315',
          surface: '#171a1d'
        }
      }
    }

    return next
  }

  return cloneDefaultPageConfig()
}

export function parseBlockData<T extends BlockType>(type: T, value: unknown): BlockDataMap[T] {
  return blockDataSchemas[type].parse(value ?? createDefaultBlockData(type)) as BlockDataMap[T]
}

export function validateCreateProjectInput(input: unknown): CreateProjectInput {
  return createProjectInputSchema.parse(input)
}

export function validateUpdateProjectInput(input: unknown): UpdateProjectInput {
  return updateProjectInputSchema.parse(input)
}

export function validateUpsertBlockInput(input: unknown): UpsertBlockInput {
  return upsertBlockInputSchema.parse(input)
}

export function validateReorderBlocksInput(input: unknown): ReorderBlocksInput {
  return reorderBlocksInputSchema.parse(input)
}

export function validateAssetImportInput(input: unknown): AssetImportInput {
  return assetImportInputSchema.parse(input)
}

export function validateOpenFilesOptions(input: unknown): OpenFilesOptions {
  return openFilesOptionsSchema.parse(input ?? {})
}

export function validateSaveFileOptions(input: unknown): SaveFileOptions {
  return saveFileOptionsSchema.parse(input ?? {})
}
