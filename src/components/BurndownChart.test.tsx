import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { BurndownChart } from './BurndownChart'

const getBurndown = vi.fn()
vi.mock('../api/cycles', () => ({ getBurndown: (...a: unknown[]) => getBurndown(...a) }))

describe('BurndownChart', () => {
  it('summarises the work left and gives screen readers the numbers', async () => {
    getBurndown.mockResolvedValue({
      unit: 'points',
      total: 10,
      days: [
        { date: '2026-11-02', remaining: 10, ideal: 10 },
        { date: '2026-11-03', remaining: 6, ideal: 5 },
        { date: '2026-11-04', remaining: null, ideal: 0 },
      ],
    })
    renderWithProviders(<BurndownChart cycleId={4} name="Sprint 1" />, { lang: 'en' })
    expect(await screen.findByText('6 points left')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Burndown of Sprint 1' })
    expect(table).toHaveTextContent('—')
    expect(getBurndown).toHaveBeenCalledWith(4)
  })

  it('says what to do when the cycle is empty', async () => {
    getBurndown.mockResolvedValue({ unit: 'issues', total: 0, days: [] })
    renderWithProviders(<BurndownChart cycleId={5} name="Empty" />, { lang: 'en' })
    expect(await screen.findByText('Add issues to this cycle to see its burndown.')).toBeInTheDocument()
  })

  it('reads out one day at a time from the keyboard', async () => {
    getBurndown.mockResolvedValue({
      unit: 'points',
      total: 10,
      days: [
        { date: '2026-11-02', remaining: 10, ideal: 10 },
        { date: '2026-11-03', remaining: 6, ideal: 5 },
        { date: '2026-11-04', remaining: null, ideal: 0 },
      ],
    })
    renderWithProviders(<BurndownChart cycleId={6} name="Sprint 2" />, { lang: 'en' })
    const plot = await screen.findByRole('group', { name: 'Sprint 2: use the arrow keys to read each day' })
    await userEvent.tab()
    expect(plot).toHaveFocus()
    // Focus starts on the latest known day: 6 left against an ideal of 5.
    expect(plot).toHaveTextContent(/6\s*Left/)
    expect(plot).toHaveTextContent(/5\s*Ideal/)
    await userEvent.keyboard('{ArrowLeft}')
    expect(plot).toHaveTextContent(/10\s*Left/)
    await userEvent.keyboard('{End}')
    expect(plot).toHaveTextContent(/—\s*Left/)
  })
})
