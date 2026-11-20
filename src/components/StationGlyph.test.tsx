import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StationGlyph } from './Track'
import type { IssueStatus } from '../types/issue'

function glyph(status: IssueStatus) {
  const { container } = render(<StationGlyph status={status} />)
  return container.querySelector('svg')!
}

describe('StationGlyph', () => {
  it('tells the stations apart by shape, not only by colour', () => {
    expect(glyph('backlog').querySelector('circle')!.getAttribute('stroke-dasharray')).toBeTruthy()
    expect(glyph('todo').querySelectorAll('path')).toHaveLength(0)
    expect(glyph('in_progress').querySelector('path')!.getAttribute('d')).toContain('z')
    expect(glyph('in_review').querySelector('path')!.getAttribute('d')).not.toBe(glyph('in_progress').querySelector('path')!.getAttribute('d'))
    const done = glyph('done')
    expect(done.querySelector('circle')!.getAttribute('fill')).toContain('--color-st-done')
    expect(done.querySelector('path')).not.toBeNull()
    expect(done).toHaveAttribute('aria-hidden', 'true')
  })
})
