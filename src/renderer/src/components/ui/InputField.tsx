import clsx from 'clsx'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import styles from './InputField.module.css'

interface SharedFieldProps {
  className?: string
  error?: string
  label?: string
  mono?: boolean
}

type InputFieldProps = SharedFieldProps & InputHTMLAttributes<HTMLInputElement>

export function InputField({
  className,
  error,
  label,
  mono,
  ...props
}: InputFieldProps): JSX.Element {
  return (
    <label className={clsx(styles.field, className)}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input {...props} className={clsx(styles.control, mono && styles.mono)} />
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  )
}

type TextareaFieldProps = SharedFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextareaField({
  className,
  error,
  label,
  mono,
  ...props
}: TextareaFieldProps): JSX.Element {
  return (
    <label className={clsx(styles.field, className)}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <textarea {...props} className={clsx(styles.control, mono && styles.mono)} />
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  )
}
