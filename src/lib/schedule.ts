// Where a project stands against its dates. Calendar dates only ("2026-11-17"), compared as whole days in
// local time, so a project never looks a day late just because of the time zone.

export type ScheduleState = 'none' | 'startOnly' | 'targetOnly' | 'upcoming' | 'running' | 'dueToday' | 'overdue' | 'closed'

export interface Schedule {
  state: ScheduleState
  // Whole days from start to target, counting both (a one-day project is 1).
  totalDays: number
  // Which day of the schedule today is (1 = the start day), while running.
  dayNumber: number
  // Days until the target (running), until the start (upcoming), or past the target (overdue).
  days: number
  // Share of the schedule that has passed, 0-100.
  percent: number
}

const DAY = 86_400_000

export function toDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY
}

export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(iso: string, days: number): string {
  const date = new Date(toDay(iso) * DAY + days * DAY)
  return date.toISOString().slice(0, 10)
}

export function computeSchedule(start: string | null, target: string | null, closed: boolean, today: string = todayIso()): Schedule {
  const base = { totalDays: 0, dayNumber: 0, days: 0, percent: 0 }
  if (!start && !target) return { state: 'none', ...base }
  if (closed) return { state: 'closed', ...base, percent: 100 }
  const now = toDay(today)
  if (start && !target) {
    const until = toDay(start) - now
    return { state: until > 0 ? 'upcoming' : 'startOnly', ...base, days: Math.max(until, 0) }
  }
  if (!start && target) {
    const left = toDay(target) - now
    return { state: left < 0 ? 'overdue' : left === 0 ? 'dueToday' : 'targetOnly', ...base, days: Math.abs(left) }
  }
  const from = toDay(start!)
  const to = toDay(target!)
  const totalDays = to - from + 1
  if (now < from) return { state: 'upcoming', totalDays, dayNumber: 0, days: from - now, percent: 0 }
  if (now > to) return { state: 'overdue', totalDays, dayNumber: totalDays, days: now - to, percent: 100 }
  const dayNumber = now - from + 1
  return {
    state: now === to ? 'dueToday' : 'running',
    totalDays,
    dayNumber,
    days: to - now,
    percent: Math.round(((now - from) / Math.max(to - from, 1)) * 100),
  }
}
