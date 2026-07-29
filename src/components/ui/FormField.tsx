import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldShellProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}

const FieldShell = ({ label, htmlFor, hint, error, children }: FieldShellProps) => (
  <div>
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-text">
        {label}
      </label>
      {hint ? <span className="text-xs text-text-tertiary">{hint}</span> : null}
    </div>
    {children}
    {error ? <p className="mt-1.5 text-xs font-medium text-error">{error}</p> : null}
  </div>
)

export const InputField = ({
  label,
  hint,
  error,
  className = '',
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & Omit<FieldShellProps, 'htmlFor' | 'children'>) => {
  const inputId = id ?? `field-${label.toLowerCase().replaceAll(' ', '-')}`
  return (
    <FieldShell label={label} htmlFor={inputId} hint={hint} error={error}>
      <input
        id={inputId}
        className={`field-control ${error ? 'border-error/50 focus:border-error focus:ring-error/10' : ''} ${className}`}
        {...props}
      />
    </FieldShell>
  )
}

export const TextareaField = ({
  label,
  hint,
  error,
  className = '',
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & Omit<FieldShellProps, 'htmlFor' | 'children'>) => {
  const inputId = id ?? `field-${label.toLowerCase().replaceAll(' ', '-')}`
  return (
    <FieldShell label={label} htmlFor={inputId} hint={hint} error={error}>
      <textarea
        id={inputId}
        className={`field-control min-h-24 resize-y ${className}`}
        {...props}
      />
    </FieldShell>
  )
}

export const SelectField = ({
  label,
  hint,
  error,
  className = '',
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> &
  Omit<FieldShellProps, 'htmlFor' | 'children'> & { children: ReactNode }) => {
  const inputId = id ?? `field-${label.toLowerCase().replaceAll(' ', '-')}`
  return (
    <FieldShell label={label} htmlFor={inputId} hint={hint} error={error}>
      <select id={inputId} className={`field-control ${className}`} {...props}>
        {children}
      </select>
    </FieldShell>
  )
}
