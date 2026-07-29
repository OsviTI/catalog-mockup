import type { ReactNode } from 'react'

interface BadgeProps {
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  children: ReactNode
  dot?: boolean
}

export default function Badge({ tone = 'neutral', children, dot = false }: BadgeProps) {
  const styles = {
    primary: 'bg-primary/10 text-primary ring-primary/15',
    success: 'bg-success/10 text-success-strong ring-success/20',
    warning: 'bg-warning/12 text-warning-strong ring-warning/20',
    danger: 'bg-error/10 text-error ring-error/15',
    neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  }

  const dots = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-error',
    neutral: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}
    >
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} /> : null}
      {children}
    </span>
  )
}
