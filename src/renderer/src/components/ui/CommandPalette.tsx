import { useEffect, useMemo, useState } from 'react'
import styles from './CommandPalette.module.css'

export interface CommandPaletteAction {
  id: string
  title: string
  subtitle?: string
  group?: string
  onSelect: () => void
}

interface CommandPaletteProps {
  actions: CommandPaletteAction[]
  onClose: () => void
  open: boolean
}

export function CommandPalette({
  actions,
  onClose,
  open
}: CommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return actions
    }

    return actions.filter((action) =>
      `${action.title} ${action.subtitle ?? ''} ${action.group ?? ''}`
        .toLowerCase()
        .includes(normalized)
    )
  }, [actions, query])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.palette}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className={styles.searchWrap}>
          <input
            autoFocus
            className={styles.search}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jump to a workspace or action..."
            value={query}
          />
        </div>
        <div className={styles.results}>
          {filtered.length > 0 ? (
            filtered.map((action) => (
              <button
                key={action.id}
                className={styles.result}
                onClick={() => {
                  action.onSelect()
                  onClose()
                }}
                type="button"
              >
                <div className={styles.resultMain}>
                  <strong>{action.title}</strong>
                  {action.subtitle ? <span>{action.subtitle}</span> : null}
                </div>
                {action.group ? <span className={styles.group}>{action.group}</span> : null}
              </button>
            ))
          ) : (
            <div className={styles.empty}>No matching commands.</div>
          )}
        </div>
      </div>
    </div>
  )
}
