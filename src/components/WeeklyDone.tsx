import { useT } from '../i18n'

// A project's pace: issues finished in each of the last weeks, as tiny columns (counts are discrete, so
// columns rather than a line). Past weeks are muted, this week is in the accent; a quiet week is just the
// baseline. The total is said in words for screen readers; each column's number shows on hover.
export function WeeklyDone({ weeks, className = '' }: { weeks: number[]; className?: string }) {
  const t = useT()
  const max = Math.max(...weeks, 1)
  const total = weeks.reduce((sum, count) => sum + count, 0)
  const last = weeks.length - 1
  return (
    <span className={`flex flex-col items-end gap-1 ${className}`}>
      <span aria-hidden="true" className="flex h-6 items-end gap-[2px]">
        {weeks.map((count, index) => (
          <span
            key={index}
            title={t(index === last ? 'pace.thisWeek' : 'pace.weeksAgo', { count, weeks: last - index })}
            className="flex h-full w-[6px] items-end"
          >
            <span
              className={`block w-full rounded-t-[2px] ${count === 0 ? 'h-[2px] rounded-none bg-border' : index === last ? 'bg-orange' : 'bg-fg/35'}`}
              style={count === 0 ? undefined : { height: `${Math.max((count / max) * 100, 12)}%` }}
            />
          </span>
        ))}
      </span>
      <span className="text-[11px] leading-none text-fg-muted">{t('pace.label', { count: total })}</span>
    </span>
  )
}
