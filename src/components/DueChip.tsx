import { useI18n } from '../i18n'
import { daysUntil, dueState } from '../lib/dueDate'
import type { DueState } from '../lib/dueDate'

const STATE_CLASS: Record<DueState, string> = {
  overdue: 'text-danger',
  soon: 'text-warning',
  later: 'text-fg-muted',
}

// A due date whose colour says how urgent it is: red once overdue, amber within a few days,
// muted otherwise. Renders nothing for finished issues or ones without a date.
export function DueChip({ dueDate, status }: { dueDate: string | null; status: string }) {
  const { t, formatDate } = useI18n()
  const state = dueState(dueDate, status)
  if (!dueDate || !state) return null

  const date = formatDate(dueDate)
  const key = state === 'soon' && daysUntil(dueDate) === 0 ? 'due.today' : `due.${state}`
  return <span className={`shrink-0 text-xs ${STATE_CLASS[state]}`}>{t(key, { date })}</span>
}
