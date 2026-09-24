export type DueState = 'overdue' | 'soon' | 'later'

// Issues due within this many days (inclusive of today) count as "due soon".
export const DUE_SOON_DAYS = 3

function localIsoDate(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function dayNumber(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

// Whole days from today to a 'YYYY-MM-DD' due date (negative = already past), in the viewer's local calendar.
export function daysUntil(dueDate: string, now: Date = new Date()): number {
  return Math.round(dayNumber(dueDate) - dayNumber(localIsoDate(now)))
}

// How urgent an issue's due date is. Finished work and issues without a date have no state.
export function dueState(dueDate: string | null, status: string, now: Date = new Date()): DueState | null {
  if (!dueDate || status === 'done') return null
  const days = daysUntil(dueDate, now)
  if (days < 0) return 'overdue'
  if (days <= DUE_SOON_DAYS) return 'soon'
  return 'later'
}
