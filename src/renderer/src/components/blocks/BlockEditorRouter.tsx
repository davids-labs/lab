import type { Block, BlockDataMap } from '@preload/types'
import { BuildGuideBlock } from './BuildGuideBlock'
import { FailedIterationBlock, GCodeBlock, PinoutBlock } from './EngineeringBlocks'
import { MarkdownBlock, ImageGalleryBlock, PlaceholderBlock } from './MediaBlocks'
import { BomBlock, SpecTableBlock } from './TableBlocks'
import { EmbedBlock, LinkBlock, NoteBlock, TodoBlock } from './UtilityBlocks'
import { CaseStudyBlock, HowItWorksBlock, TextBlock } from './RichTextBlocks'

interface BlockEditorRouterProps {
  block: Block
}

export function BlockEditorRouter({ block }: BlockEditorRouterProps): JSX.Element {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block as Block<BlockDataMap['text']>} />
    case 'how_it_works':
      return <HowItWorksBlock block={block as Block<BlockDataMap['how_it_works']>} />
    case 'case_study':
      return <CaseStudyBlock block={block as Block<BlockDataMap['case_study']>} />
    case 'bom':
      return <BomBlock block={block as Block<BlockDataMap['bom']>} />
    case 'pinout':
      return <PinoutBlock block={block as Block<BlockDataMap['pinout']>} />
    case 'spec_table':
      return <SpecTableBlock block={block as Block<BlockDataMap['spec_table']>} />
    case 'gcode':
      return <GCodeBlock block={block as Block<BlockDataMap['gcode']>} />
    case 'link':
      return <LinkBlock block={block as Block<BlockDataMap['link']>} />
    case 'embed':
      return <EmbedBlock block={block as Block<BlockDataMap['embed']>} />
    case 'failed_iteration':
      return <FailedIterationBlock block={block as Block<BlockDataMap['failed_iteration']>} />
    case 'note':
      return <NoteBlock block={block as Block<BlockDataMap['note']>} />
    case 'todo':
      return <TodoBlock block={block as Block<BlockDataMap['todo']>} />
    case 'markdown':
      return <MarkdownBlock block={block as Block<BlockDataMap['markdown']>} />
    case 'image_gallery':
      return <ImageGalleryBlock block={block as Block<BlockDataMap['image_gallery']>} />
    case 'build_guide':
      return <BuildGuideBlock block={block as Block<BlockDataMap['build_guide']>} />
    default:
      return <PlaceholderBlock block={block} />
  }
}
