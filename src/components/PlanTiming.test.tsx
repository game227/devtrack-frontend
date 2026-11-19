import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { PlanCount, PlanTiming } from './PlanTiming'

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 10, 17, 12) }))
afterEach(() => vi.useRealTimers())

describe('PlanTiming', () => {
  it('says where a cycle stands in time', () => {
    renderWithProviders(<PlanTiming start="2026-11-07" end="2026-11-20" done={0} total={7} />, { lang: 'en' })
    expect(screen.getByText('Day 11 of 14 · 3 days left')).toBeInTheDocument()
  })

  it('separates late work from an empty plan whose date has passed', () => {
    const { unmount } = renderWithProviders(<PlanTiming start={null} end="2026-11-11" done={4} total={7} />, { lang: 'en' })
    expect(screen.getByText('6 days past the date · 3 issues still open')).toBeInTheDocument()
    unmount()
    renderWithProviders(<PlanTiming start={null} end="2026-11-11" done={0} total={0} />, { lang: 'en' })
    expect(screen.getByText('The date passed 6 days ago')).toBeInTheDocument()
  })

  it('says when everything is done, and counts nothing for an empty plan', () => {
    renderWithProviders(
      <>
        <PlanTiming start="2026-10-01" end="2026-10-14" done={5} total={5} />
        <PlanCount done={0} total={0} />
      </>,
      { lang: 'uz' },
    )
    expect(screen.getByText('Barcha vazifalar bajarildi')).toBeInTheDocument()
    expect(screen.getByText("Hali vazifa yo'q")).toBeInTheDocument()
  })
})
