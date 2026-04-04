import { useEffect, useMemo, useRef } from 'react'
import type { Block } from '../../../preload/types'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'

export function usePersistBlock<T>(block: Block<T>, draft: T): void {
  const upsertBlock = useBlockStore((state) => state.upsertBlock)
  const pushToast = useToastStore((state) => state.push)
  const setSaveState = useUiStore((state) => state.setSaveState)
  const lastSaved = useRef(JSON.stringify(block.data))

  const currentSerialised = useMemo(() => JSON.stringify(draft), [draft])

  useEffect(() => {
    lastSaved.current = JSON.stringify(block.data)
  }, [block.data, block.updated_at])

  useEffect(() => {
    if (currentSerialised === lastSaved.current) {
      return
    }

    setSaveState('saving')

    const timer = window.setTimeout(() => {
      void upsertBlock({
        id: block.id,
        project_id: block.project_id,
        type: block.type,
        sort_order: block.sort_order,
        grid_col: block.grid_col,
        grid_col_span: block.grid_col_span,
        visible_on_page: block.visible_on_page,
        data: draft
      })
        .then(() => {
          lastSaved.current = currentSerialised
          setSaveState('saved')
        })
        .catch((error) => {
          setSaveState('error')
          pushToast({
            message: `Failed to save ${block.type}: ${String(error)}`,
            type: 'error'
          })
        })
    }, 450)

    return () => window.clearTimeout(timer)
  }, [
    block.grid_col,
    block.grid_col_span,
    block.id,
    block.project_id,
    block.sort_order,
    block.type,
    block.visible_on_page,
    currentSerialised,
    draft,
    pushToast,
    setSaveState,
    upsertBlock
  ])
}
