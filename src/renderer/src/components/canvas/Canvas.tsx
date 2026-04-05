import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block } from '@preload/types'
import { BLOCK_LABELS } from '@shared/defaults'
import { BlockEditorRouter } from '@renderer/components/blocks/BlockEditorRouter'
import { Button } from '@renderer/components/ui/Button'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './Canvas.module.css'

interface CanvasProps {
  activeBlockId: string | null
  blocks: Block[]
}

export function Canvas({ activeBlockId, blocks }: CanvasProps): JSX.Element {
  const deleteBlock = useBlockStore((state) => state.deleteBlock)
  const reorderBlocks = useBlockStore((state) => state.reorderBlocks)
  const upsertBlock = useBlockStore((state) => state.upsertBlock)
  const openBlockPicker = useUiStore((state) => state.openBlockPicker)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ordered = [...blocks].sort((left, right) => left.sort_order - right.sort_order)

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = ordered.findIndex((block) => block.id === active.id)
    const newIndex = ordered.findIndex((block) => block.id === over.id)
    const next = arrayMove(ordered, oldIndex, newIndex)
    await reorderBlocks({
      projectId: ordered[0]?.project_id ?? '',
      orderedIds: next.map((block) => block.id)
    })
  }

  async function handleQuickUpdate(block: Block, changes: Partial<Block>): Promise<void> {
    await upsertBlock({
      id: block.id,
      project_id: block.project_id,
      type: block.type,
      sort_order: changes.sort_order ?? block.sort_order,
      grid_col: changes.grid_col ?? block.grid_col,
      grid_col_span: changes.grid_col_span ?? block.grid_col_span,
      visible_on_page: changes.visible_on_page ?? block.visible_on_page,
      data: changes.data ?? block.data
    })
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => void handleDragEnd(event)}
      >
        <SortableContext items={ordered.map((block) => block.id)} strategy={rectSortingStrategy}>
          <div className={styles.canvas}>
            {ordered.map((block) => (
              <SortableBlock
                key={block.id}
                active={activeBlockId === block.id}
                block={block}
                onDelete={() => void deleteBlock(block.id)}
                onInsertAfter={() => openBlockPicker(block.id)}
                onToggleSpan={() =>
                  void handleQuickUpdate(block, {
                    grid_col_span: block.grid_col_span === 2 ? 1 : 2
                  })
                }
                onToggleVisibility={() =>
                  void handleQuickUpdate(block, { visible_on_page: !block.visible_on_page })
                }
              />
            ))}
            <button
              className={`${styles.addButton} ${styles.full}`}
              onClick={() => openBlockPicker(null)}
              type="button"
            >
              + Add block
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </>
  )
}

interface SortableBlockProps {
  active: boolean
  block: Block
  onDelete: () => void
  onInsertAfter: () => void
  onToggleSpan: () => void
  onToggleVisibility: () => void
}

function SortableBlock({
  active,
  block,
  onDelete,
  onInsertAfter,
  onToggleSpan,
  onToggleVisibility
}: SortableBlockProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id
  })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.wrapper} ${block.grid_col_span === 2 ? styles.full : ''} ${active ? styles.active : ''}`}
      data-canvas-block-id={block.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1
      }}
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <span className={styles.label}>{BLOCK_LABELS[block.type]}</span>
        </div>
        <div className={`${styles.toolbarGroup} ${styles.toolbarActions}`}>
          <Button size="sm" variant={block.visible_on_page ? 'outline' : 'ghost'} onClick={onToggleVisibility}>
            {block.visible_on_page ? 'Public' : 'Private'}
          </Button>
          <details className={styles.moreMenu}>
            <summary className={styles.moreSummary}>•••</summary>
            <div className={styles.moreActions}>
              <Button size="sm" variant="ghost" {...attributes} {...listeners}>
                Drag
              </Button>
              <Button size="sm" variant="ghost" onClick={onToggleSpan}>
                {block.grid_col_span === 2 ? 'Half Width' : 'Full Width'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onInsertAfter}>
                Add After
              </Button>
              <Button size="sm" variant="danger" onClick={onDelete}>
                Delete
              </Button>
            </div>
          </details>
        </div>
      </div>
      <div className={styles.editorBody}>
        <BlockEditorRouter block={block} />
      </div>
    </div>
  )
}
