import clsx from 'clsx'
import type { Project } from '../../../../preload/types'
import styles from './Badge.module.css'

interface BadgeProps {
  type: Project['type']
}

export function Badge({ type }: BadgeProps): JSX.Element {
  return <span className={clsx(styles.badge, styles[type])}>{type}</span>
}
