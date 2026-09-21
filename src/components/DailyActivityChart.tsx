import { useI18n } from '../i18n'
import type { DailyActivity } from '../types/analytics'

export function DailyActivityChart({ data }: { data: DailyActivity[] }) {
  const { t, formatDate } = useI18n()

  if (data.length === 0) {
    return <p className="text-sm text-fg-muted">{t('profile.noActivity')}</p>
  }

  const maxCount = Math.max(...data.map((day) => day.count), 1)

  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((day) => {
        const heightPercent = (day.count / maxCount) * 100
        const label = t('profile.activityBar', { date: formatDate(day.date), count: day.count })
        return (
          <div key={day.date} title={label} aria-label={label} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-fg"
              style={{ height: `${day.count > 0 ? Math.max(heightPercent, 6) : 2}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] text-fg opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
