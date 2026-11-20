import { describe, expect, it } from 'vitest'
import { scrubUrl } from './sentry'

describe('scrubUrl', () => {
  it('hides reset and verification tokens in paths', () => {
    expect(scrubUrl('https://app.devtrack.uz/reset-password/MQ/c3k-abc123/')).toBe('https://app.devtrack.uz/reset-password/:uid/:token/')
    expect(scrubUrl('/verify-email/Mg/zz-99?x=1')).toBe('/verify-email/:uid/:token?x=1')
  })

  it('hides OAuth and ticket parameters but keeps the rest', () => {
    expect(scrubUrl('/settings?github_pending=abc&tab=1')).toBe('/settings?github_pending=[redacted]&tab=1')
    expect(scrubUrl('https://x.test/cb?code=123&state=xyz')).toBe('https://x.test/cb?code=[redacted]&state=[redacted]')
    expect(scrubUrl('/projects/7/board')).toBe('/projects/7/board')
  })
})
