interface ProgressPanelProps {
  title: string
  steps: string[]
}

export default function ProgressPanel({ title, steps }: ProgressPanelProps) {
  return (
    <div className="rounded-[24px] border border-border bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-text">{title}</h3>
      <div className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl bg-bg px-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </div>
            <span className="text-sm text-text-secondary">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
