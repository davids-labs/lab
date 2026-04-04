import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

interface UseResizableWidthOptions {
  value: number
  min: number
  max: number
  onChange: (width: number) => void
}

export function useResizableWidth({ value, min, max, onChange }: UseResizableWidthOptions): {
  isResizing: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
} {
  const latest = useRef({ value, min, max, onChange })
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    latest.current = { value, min, max, onChange }
  }, [max, min, onChange, value])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()

    const startX = event.clientX
    const startWidth = latest.current.value
    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect

    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      const nextWidth = Math.max(
        latest.current.min,
        Math.min(latest.current.max, startWidth + moveEvent.clientX - startX)
      )

      latest.current.onChange(nextWidth)
    }

    const handlePointerUp = (): void => {
      setIsResizing(false)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }, [])

  return { isResizing, onPointerDown }
}
