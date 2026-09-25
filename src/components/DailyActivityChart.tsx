import { useI18n } from '../i18n'
import type { DailyActivity } from '../types/analytics'

// The bar area leaves room above the tallest bar for its number.
const MAX_BAR_PERCENT = 82

// One column per day (the API sends every day, quiet ones as 0): the count sits on top of each bar
// and the day of the month underneath, so the chart reads without hovering. Today is drawn solid,
// earlier days softer, and a day with no activity is just a hairline.
export function DailyActivityChart({ data }: { data: DailyActivity[] }) {
  const { t, formatDate } = useI18n()

  const total = data.reduce((sum, day) => sum + day.count, 0)
  if (data.length === 0 || total === 0) {
    return <p className="text-sm text-fg-muted">{t('profile.noActivity')}</p>
  }

  const busiest = data.reduce((best, day) => (day.count > best.count ? day : best), data[0])
  const summary = t('profile.activitySummary', {
    total,
    days: data.length,
    date: formatDate(busiest.date),
    count: busiest.count,
  })
  const lastIndex = data.length - 1

  return (
    <div>
      <p className="mb-2 text-xs text-fg-muted">{summary}</p>
      <div role="img" aria-label={summary} className="flex h-28 items-stretch gap-1">
        {data.map((day, index) => {
          const isToday = index === lastIndex
          const label = t('profile.activityBar', { date: formatDate(day.date), count: day.count })
          const heightPercent = (day.count / busiest.count) * MAX_BAR_PERCENT
          return (
            <div key={day.date} title={label} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full flex-1 flex-col items-center justify-end">
                {day.count > 0 ? (
                  <>
                    <span className={`mb-0.5 text-[10px] leading-none ${isToday ? 'text-fg' : 'text-fg-muted'}`}>
                      {day.count}
                    </span>
                    <div
                      className={`w-full rounded-t-md ${isToday ? 'bg-fg' : 'bg-fg/60'}`}
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    />
                  </>
                ) : (
                  <div className="h-px w-full bg-border" />
                )}
              </div>
              <span className={`mt-1 text-[10px] leading-none ${isToday ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
                {Number(day.date.slice(8, 10))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
