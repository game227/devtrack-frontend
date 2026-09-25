export type RelativeUnit = 'now' | 'minutes' | 'hours' | 'days'

export interface RelativeParts {
  unit: RelativeUnit
  count: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
// Older than this reads better as a date than as "41 days ago".
export const RELATIVE_LIMIT_DAYS = 30

// How long ago `iso` was, in the coarsest unit that is still exact enough. Returns null once it is
// too old for "ago" phrasing (the caller then shows a date). Future timestamps count as "now".
export function relativeParts(iso: string, now: Date = new Date()): RelativeParts | null {
  const elapsed = now.getTime() - new Date(iso).getTime()
  if (Number.isNaN(elapsed)) return null
  if (elapsed < MINUTE) return { unit: 'now', count: 0 }
  if (elapsed < HOUR) return { unit: 'minutes', count: Math.floor(elapsed / MINUTE) }
  if (elapsed < DAY) return { unit: 'hours', count: Math.floor(elapsed / HOUR) }
  const days = Math.floor(elapsed / DAY)
  return days <= RELATIVE_LIMIT_DAYS ? { unit: 'days', count: days } : null
}
