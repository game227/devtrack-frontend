import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { DailyActivityChart } from './DailyActivityChart'

function days(counts: number[]) {
  return counts.map((count, index) => ({ date: `2026-09-${String(index + 10).padStart(2, '0')}`, count }))
}

describe('DailyActivityChart', () => {
  it('prints the count above each active bar and the day of the month under every bar', () => {
    renderWithProviders(<DailyActivityChart data={days([0, 3, 0, 5])} />, { lang: 'en' })
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    for (const day of ['10', '11', '12', '13']) expect(screen.getByText(day)).toBeInTheDocument()
  })

  it('summarises the window, naming the busiest day', () => {
    renderWithProviders(<DailyActivityChart data={days([0, 3, 0, 5])} />, { lang: 'en' })
    const summary = screen.getByRole('img')
    expect(summary).toHaveAccessibleName(/8 actions in the last 4 days/)
    expect(summary).toHaveAccessibleName(/\(5\)/)
  })

  it('scales bars to the busiest day, with the busiest below full height so its number fits', () => {
    const { container } = renderWithProviders(<DailyActivityChart data={days([2, 4])} />, { lang: 'en' })
    const heights = [...container.querySelectorAll<HTMLElement>('[style*="height"]')].map((el) => parseFloat(el.style.height))
    expect(heights[1]).toBeLessThan(100)
    expect(heights[0]).toBeCloseTo(heights[1] / 2, 0)
  })

  it('draws a quiet day as a hairline instead of a bar', () => {
    const { container } = renderWithProviders(<DailyActivityChart data={days([0, 4])} />, { lang: 'en' })
    expect(container.querySelectorAll('.h-px')).toHaveLength(1)
  })

  it('says so when there was no activity at all, instead of drawing an empty chart', () => {
    renderWithProviders(<DailyActivityChart data={days([0, 0, 0])} />, { lang: 'en' })
    expect(screen.getByText('No activity in this window yet.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('speaks Uzbek', () => {
    renderWithProviders(<DailyActivityChart data={days([1, 2])} />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/So'nggi 2 kunda 3 ta harakat/)
  })
})
