import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { DueChip } from './DueChip'

describe('DueChip', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 24, 12, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('marks a past date as overdue', () => {
    renderWithProviders(<DueChip dueDate="2026-09-20" status="todo" />, { lang: 'en' })
    expect(screen.getByText(/^Overdue/)).toHaveClass('text-danger')
  })

  it('says "today" for a date that is due today', () => {
    renderWithProviders(<DueChip dueDate="2026-09-24" status="todo" />, { lang: 'en' })
    expect(screen.getByText('Due today')).toHaveClass('text-warning')
  })

  it('stays muted for a distant date', () => {
    renderWithProviders(<DueChip dueDate="2026-12-01" status="todo" />, { lang: 'en' })
    expect(screen.getByText(/2026/)).toHaveClass('text-fg-muted')
  })

  it('renders nothing for finished issues or missing dates', () => {
    const { container } = renderWithProviders(
      <>
        <DueChip dueDate="2026-09-01" status="done" />
        <DueChip dueDate={null} status="todo" />
      </>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
