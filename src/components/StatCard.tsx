export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated px-4 py-3">
      <div className="text-2xl font-semibold text-fg">{value}</div>
      <div className="text-xs text-fg-muted">{label}</div>
    </div>
  )
}
