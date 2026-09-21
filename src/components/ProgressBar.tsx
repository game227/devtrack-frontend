export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
    >
      <div className="h-full rounded-full bg-fg" style={{ width: `${value}%` }} />
    </div>
  )
}
