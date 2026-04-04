import clsx from 'clsx'
import { useToastStore } from '@renderer/stores/toastStore'
import styles from './ToastStack.module.css'

export function ToastStack(): JSX.Element | null {
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className={styles.stack}>
      {toasts.map((toast) => (
        <div key={toast.id} className={clsx(styles.toast, styles[toast.type])}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
