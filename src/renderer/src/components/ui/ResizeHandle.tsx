import type { PointerEvent as ReactPointerEvent } from 'react'
import styles from './ResizeHandle.module.css'

interface ResizeHandleProps {
  active?: boolean
  ariaLabel: string
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
}

export function ResizeHandle({
  active = false,
  ariaLabel,
  onPointerDown
}: ResizeHandleProps): JSX.Element {
  return (
    <div
      aria-label={ariaLabel}
      className={`${styles.handle} ${active ? styles.active : ''}`}
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation="vertical"
    >
      <div className={styles.grip} />
    </div>
  )
}
