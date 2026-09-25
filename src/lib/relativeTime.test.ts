import { describe, expect, it } from 'vitest'
import { relativeParts } from './relativeTime'

const now = new Date('2026-09-25T12:00:00Z')
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

describe('relativeParts', () => {
  it('picks the coarsest exact unit', () => {
    expect(relativeParts(ago(20_000), now)).toEqual({ unit: 'now', count: 0 })
    expect(relativeParts(ago(5 * 60_000), now)).toEqual({ unit: 'minutes', count: 5 })
    expect(relativeParts(ago(3 * 3_600_000 + 1000), now)).toEqual({ unit: 'hours', count: 3 })
    expect(relativeParts(ago(2 * 86_400_000), now)).toEqual({ unit: 'days', count: 2 })
  })

  it('treats the future (clock skew) as now', () => {
    expect(relativeParts(ago(-5 * 60_000), now)).toEqual({ unit: 'now', count: 0 })
  })

  it('gives up on anything older than a month, and on garbage', () => {
    expect(relativeParts(ago(31 * 86_400_000), now)).toBeNull()
    expect(relativeParts('not a date', now)).toBeNull()
  })
})
