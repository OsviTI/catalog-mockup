interface ProgressCardProps {
  label: string
  value: string
  hint: string
}

export default function ProgressCard({ label, value, hint }: ProgressCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-bg p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </div>
  )
}
