import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './Modal.module.css'

interface ModalProps {
  children: ReactNode
  onClose: () => void
  title: string
}

export function Modal({ children, onClose, title }: ModalProps): JSX.Element {
  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <strong>{title}</strong>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
