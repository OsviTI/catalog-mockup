import type { ReactNode } from 'react'

interface BadgeProps {
  tone?: 'primary' | 'success' | 'warning' | 'neutral'
  children: ReactNode
}

export default function Badge({ tone = 'neutral', children }: BadgeProps) {
  const styles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    neutral: 'bg-bg text-text-secondary'
  }

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>
}
