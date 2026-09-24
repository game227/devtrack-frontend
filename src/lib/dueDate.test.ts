import { describe, expect, it } from 'vitest'
import { daysUntil, dueState } from './dueDate'

// Noon local time, so the result doesn't depend on the machine's timezone offset.
const today = new Date(2026, 8, 24, 12, 0, 0)

describe('daysUntil', () => {
  it('counts whole calendar days from today', () => {
    expect(daysUntil('2026-09-24', today)).toBe(0)
    expect(daysUntil('2026-09-27', today)).toBe(3)
    expect(daysUntil('2026-09-23', today)).toBe(-1)
  })

  it('handles month and year boundaries', () => {
    expect(daysUntil('2026-10-01', today)).toBe(7)
    expect(daysUntil('2027-01-01', today)).toBe(99)
  })
})

describe('dueState', () => {
  it('flags past dates as overdue and near dates as soon', () => {
    expect(dueState('2026-09-23', 'todo', today)).toBe('overdue')
    expect(dueState('2026-09-24', 'todo', today)).toBe('soon')
    expect(dueState('2026-09-27', 'in_progress', today)).toBe('soon')
    expect(dueState('2026-09-28', 'todo', today)).toBe('later')
  })

  it('has no state without a date or once the issue is done', () => {
    expect(dueState(null, 'todo', today)).toBeNull()
    expect(dueState('2026-09-01', 'done', today)).toBeNull()
  })
})
