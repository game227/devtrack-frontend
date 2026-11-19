import { useState } from 'react'
import { useI18n } from '../i18n'
import { daysUntil } from '../lib/dueDate'
import { sortByUrgency } from '../lib/issueOrder'
import type { Issue } from '../types/issue'
import { IssueList, IssueRow } from './IssueRow'
import { sectionTitle } from './ui'

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const DAYS_AHEAD = 7

// 'focus' is today plus anything overdue; a number is that many days from today.
type Pick = 'focus' | 'overdue' | number

// The top of the home page: what of mine is due, day by day for the coming week. With nothing picked it
// shows what needs me today (overdue first); picking a day shows that day.
export function MyDay({
  issues,
  now,
  projectName,
}: {
  issues: Issue[]
  now: Date
  projectName?: (projectId: number) => string | undefined
}) {
  const { t, formatLongDay } = useI18n()
  const [pick, setPick] = useState<Pick>('focus')

  const dated = issues.filter((issue) => issue.due_date && issue.status !== 'done')
  const offset = (issue: Issue) => daysUntil(issue.due_date as string, now)
  const overdue = sortByUrgency(dated.filter((issue) => offset(issue) < 0))
  const days = Array.from({ length: DAYS_AHEAD }, (_, day) => sortByUrgency(dated.filter((issue) => offset(issue) === day)))

  const dayName = (day: number) => {
    if (day === 0) return t('myDay.today')
    if (day === 1) return t('myDay.tomorrow')
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day)
    return `${t(`week.${WEEKDAYS[date.getDay()]}`)} ${date.getDate()}`
  }
  const longDate = formatLongDay(now)

  let shown: Issue[]
  let caption: string
  let empty: string
  if (pick === 'focus') {
    shown = [...overdue, ...days[0]]
    caption = t('myDay.focus')
    empty = t('myDay.focusEmpty')
  } else if (pick === 'overdue') {
    shown = overdue
    caption = t('myDay.overdue')
    empty = t('myDay.overdueEmpty')
  } else {
    shown = days[pick]
    caption = dayName(pick)
    empty = t('myDay.dayEmpty')
  }

  const cell = (key: Pick, label: string, count: number, tone: 'danger' | 'today' | 'plain') => {
    const pressed = pick === key
    return (
      <button
        key={String(key)}
        type="button"
        aria-pressed={pressed}
        // Read as "Fri 20: 2", not "Fri 202" (the visible label comes first, WCAG 2.5.3).
        aria-label={`${label}: ${count}`}
        onClick={() => setPick(pressed ? 'focus' : key)}
        className={`flex min-w-0 flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left transition-[background-color,box-shadow] duration-150 ${
          pressed ? 'bg-brand-soft shadow-panel' : 'hover:bg-fg/[0.04]'
        }`}
      >
        <span className={`max-w-full truncate text-xs ${tone === 'today' ? 'font-semibold text-fg' : tone === 'danger' && count > 0 ? 'font-semibold text-danger' : 'text-fg-muted'}`}>
          {label}
        </span>
        <span className={`text-xl font-semibold leading-7 tabular ${tone === 'danger' && count > 0 ? 'text-danger' : count > 0 ? 'text-fg' : 'text-subtle'}`}>{count}</span>
        {/* One tick per issue (up to five): the busy days stand out at a glance. */}
        <span aria-hidden="true" className="flex h-1.5 gap-0.5">
          {Array.from({ length: Math.min(count, 5) }, (_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${tone === 'danger' ? 'bg-danger' : 'bg-fg/60'}`} />
          ))}
        </span>
      </button>
    )
  }

  return (
    <section aria-labelledby="my-day" className="mb-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="my-day" className={sectionTitle}>
          {t('myDay.title')}
        </h2>
        <p className="text-sm first-letter:uppercase text-fg-muted">{longDate}</p>
      </div>
      <div role="group" aria-label={t('myDay.week')} className="grid grid-cols-4 gap-0.5 rounded-xl border border-edge bg-surface p-1.5 shadow-panel sm:grid-cols-8">
        {cell('overdue', t('myDay.overdue'), overdue.length, 'danger')}
        {days.map((list, day) => cell(day, dayName(day), list.length, day === 0 ? 'today' : 'plain'))}
      </div>
      <p aria-live="polite" className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.06em] text-fg-muted">
        {caption}
      </p>
      {shown.length > 0 ? (
        <IssueList label={caption}>
          {shown.map((issue, index) => (
            <IssueRow key={issue.id} issue={issue} index={index} projectName={projectName?.(issue.project)} />
          ))}
        </IssueList>
      ) : (
        <p className="rounded-xl border border-dashed border-border-strong px-4 py-5 text-sm text-fg-muted">{empty}</p>
      )}
    </section>
  )
}
