import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export function Button({
  children,
  className,
  icon,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      {...props}
      type={type}
      className={clsx(styles.button, styles[variant], size !== 'md' && styles[size], className)}
    >
      {icon}
      {children}
    </button>
  )
}
