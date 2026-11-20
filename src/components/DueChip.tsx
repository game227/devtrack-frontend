import { useI18n } from '../i18n'
import { daysUntil, dueState } from '../lib/dueDate'
import type { DueState } from '../lib/dueDate'

const STATE_CLASS: Record<DueState, string> = {
  overdue: 'border-danger/40 bg-danger/10 text-danger',
  soon: 'border-warning/40 bg-warning/10 text-warning',
  later: 'border-border bg-surface text-fg-muted',
}

// A due date whose colour says how urgent it is: red once overdue, amber within a few days,
// muted otherwise. Renders nothing for finished issues or ones without a date.
export function DueChip({ dueDate, status }: { dueDate: string | null; status: string }) {
  const { t, formatShortDate } = useI18n()
  const state = dueState(dueDate, status)
  if (!dueDate || !state) return null

  const date = formatShortDate(dueDate)
  const key = state === 'soon' && daysUntil(dueDate) === 0 ? 'due.today' : `due.${state}`
  return (
    <span className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold ${STATE_CLASS[state]}`}>
      {t(key, { date })}
    </span>
  )
}
