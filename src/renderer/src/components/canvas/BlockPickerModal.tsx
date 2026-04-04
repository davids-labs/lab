import { useMemo, useState } from 'react'
import type { BlockType } from '@preload/types'
import { BLOCK_GROUPS, BLOCK_LABELS, createDefaultBlockData } from '@shared/defaults'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { Modal } from '@renderer/components/ui/Modal'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useUiStore } from '@renderer/stores/uiStore'

interface BlockPickerModalProps {
  projectId: string
}

export function BlockPickerModal({ projectId }: BlockPickerModalProps): JSX.Element | null {
  const blocks = useBlockStore((state) => state.blocks)
  const upsertBlock = useBlockStore((state) => state.upsertBlock)
  const blockPickerOpen = useUiStore((state) => state.blockPickerOpen)
  const insertAfterBlockId = useUiStore((state) => state.insertAfterBlockId)
  const closeBlockPicker = useUiStore((state) => state.closeBlockPicker)
  const [query, setQuery] = useState('')

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BLOCK_GROUPS.map((group) => ({
      ...group,
      types: group.types.filter((type) => BLOCK_LABELS[type].toLowerCase().includes(q))
    })).filter((group) => group.types.length > 0)
  }, [query])

  if (!blockPickerOpen) {
    return null
  }

  async function handleCreate(type: BlockType): Promise<void> {
    const ordered = [...blocks].sort((left, right) => left.sort_order - right.sort_order)
    const index = insertAfterBlockId
      ? ordered.findIndex((block) => block.id === insertAfterBlockId)
      : ordered.length - 1
    const previous = index >= 0 ? ordered[index] : null
    const next = index >= 0 ? ordered[index + 1] : null
    const sortOrder =
      previous && next
        ? (previous.sort_order + next.sort_order) / 2
        : previous
          ? previous.sort_order + 1
          : ordered.length + 1

    await upsertBlock({
      project_id: projectId,
      type,
      sort_order: sortOrder,
      data: createDefaultBlockData(type)
    })

    closeBlockPicker()
  }

  return (
    <Modal onClose={closeBlockPicker} title="Add Block">
      <InputField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search blocks…"
      />
      {filteredGroups.map((group) => (
        <div key={group.title} style={{ display: 'grid', gap: 10 }}>
          <div
            style={{
              color: 'var(--lab-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '0.78rem'
            }}
          >
            {group.title}
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}
          >
            {group.types.map((type) => (
              <Button key={type} variant="outline" onClick={() => void handleCreate(type)}>
                {BLOCK_LABELS[type]}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  )
}
