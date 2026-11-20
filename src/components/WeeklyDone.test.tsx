import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { WeeklyDone } from './WeeklyDone'

describe('WeeklyDone', () => {
  it('says the total in words and each week on hover, this week last', () => {
    const { container } = renderWithProviders(<WeeklyDone weeks={[0, 1, 0, 0, 2, 0, 1, 3]} />, { lang: 'en' })
    expect(screen.getByText('7 done in 8 weeks')).toBeInTheDocument()
    const columns = container.querySelectorAll('[title]')
    expect(columns).toHaveLength(8)
    expect(columns[7]).toHaveAttribute('title', 'This week: 3 done')
    expect(columns[0]).toHaveAttribute('title', '7 weeks ago: 0 done')
  })
})
