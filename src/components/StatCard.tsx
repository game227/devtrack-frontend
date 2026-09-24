interface StatCardProps {
  label: string
  value: number | string
  // Colours the number (only while it is non-zero) when the figure signals a problem.
  tone?: 'danger' | 'warning'
}

const TONE_CLASS = { danger: 'text-danger', warning: 'text-warning' } as const

export function StatCard({ label, value, tone }: StatCardProps) {
  const toneClass = tone && Number(value) > 0 ? TONE_CLASS[tone] : 'text-fg'
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated px-4 py-3">
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
      <div className="text-xs text-fg-muted">{label}</div>
    </div>
  )
}
