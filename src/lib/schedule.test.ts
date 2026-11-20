import { describe, expect, it } from 'vitest'
import { addDays, computeSchedule } from './schedule'

describe('computeSchedule', () => {
  const today = '2026-11-17'

  it('runs between the dates, counting whole calendar days', () => {
    expect(computeSchedule('2026-11-01', '2026-11-30', false, today)).toEqual({ state: 'running', totalDays: 30, dayNumber: 17, days: 13, percent: 55 })
  })

  it('knows before the start, the last day and after the target', () => {
    expect(computeSchedule('2026-11-20', '2026-12-20', false, today)).toMatchObject({ state: 'upcoming', days: 3, percent: 0 })
    expect(computeSchedule('2026-11-01', today, false, today)).toMatchObject({ state: 'dueToday', days: 0, percent: 100 })
    expect(computeSchedule('2026-10-01', '2026-11-10', false, today)).toMatchObject({ state: 'overdue', days: 7, percent: 100 })
  })

  it('handles a single date and none', () => {
    expect(computeSchedule(null, null, false, today).state).toBe('none')
    expect(computeSchedule('2026-11-01', null, false, today)).toMatchObject({ state: 'startOnly' })
    expect(computeSchedule('2026-11-30', null, false, today)).toMatchObject({ state: 'upcoming', days: 13 })
    expect(computeSchedule(null, '2026-11-27', false, today)).toMatchObject({ state: 'targetOnly', days: 10 })
    expect(computeSchedule(null, '2026-11-15', false, today)).toMatchObject({ state: 'overdue', days: 2 })
  })

  it('stops counting once the project is finished', () => {
    expect(computeSchedule('2026-10-01', '2026-11-10', true, today).state).toBe('closed')
  })

  it('adds days across months', () => {
    expect(addDays('2026-11-17', 14)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})
