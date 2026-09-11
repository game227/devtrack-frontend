import type { DailyActivity } from '../types/analytics'

export function DailyActivityChart({ data }: { data: DailyActivity[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-fg-muted">No activity in this window yet.</p>
  }

  const maxCount = Math.max(...data.map((day) => day.count), 1)

  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((day) => {
        const heightPercent = (day.count / maxCount) * 100
        return (
          <div key={day.date} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-accent"
              style={{ height: `${day.count > 0 ? Math.max(heightPercent, 6) : 2}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] text-fg opacity-0 transition-opacity group-transition-opacity duration-150 hover:opacity-100">
              {day.date}: {day.count}
            </div>
          </div>
        )
      })}
    </div>
  )
}
