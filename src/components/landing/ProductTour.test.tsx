import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { ProductTour, STEP_MS } from './ProductTour'

function renderTour(lang: 'uz' | 'en' = 'en') {
  return renderWithProviders(<ProductTour />, { lang })
}

const tab = (name: RegExp | string) => screen.getByRole('tab', { name })

describe('ProductTour', () => {
  it('lists the five steps and starts on the first, with its explanation showing', () => {
    renderTour()
    expect(screen.getAllByRole('tab')).toHaveLength(5)
    expect(tab(/Create an issue/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/the issue lands on the board straight away/)).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/Create an issue/)
  })

  it('speaks Uzbek by default', () => {
    renderWithProviders(<ProductTour />)
    expect(tab(/Vazifa yarating/)).toBeInTheDocument()
    expect(tab(/Klaviaturada tez ishlang/)).toBeInTheDocument()
  })

  it('switches step on click and only the active step shows its text', async () => {
    renderTour()
    await userEvent.click(tab(/Let GitHub update the board/))
    expect(tab(/Let GitHub update the board/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/When the pull request merges, the issue closes itself/)).toBeInTheDocument()
    expect(screen.queryByText(/the issue lands on the board straight away/)).not.toBeInTheDocument()
  })

  it('moves between steps with the arrow keys, wrapping around, and keeps focus on the tab', async () => {
    renderTour()
    tab(/Create an issue/).focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(tab(/Work from the keyboard/)).toHaveAttribute('aria-selected', 'true')
    expect(tab(/Work from the keyboard/)).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(tab(/Create an issue/)).toHaveAttribute('aria-selected', 'true')
  })

  it('renders each step\'s scene without crashing', async () => {
    renderTour()
    for (const name of [/Drag it across the board/, /Assign it and set a deadline/, /Let GitHub update the board/, /Work from the keyboard/, /Create an issue/]) {
      await userEvent.click(tab(name))
      expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    }
  })
})

describe('ProductTour autoplay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // A viewport that always contains the tour, so it counts as "on screen".
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        callback: (entries: { isIntersecting: boolean }[]) => void
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          this.callback = callback
        }
        observe() {
          this.callback([{ isIntersecting: true }])
        }
        disconnect() {}
      },
    )
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('advances to the next step by itself while it is on screen', () => {
    renderTour()
    expect(tab(/Create an issue/)).toHaveAttribute('aria-selected', 'true')
    act(() => void vi.advanceTimersByTime(STEP_MS + 50))
    expect(tab(/Drag it across the board/)).toHaveAttribute('aria-selected', 'true')
  })

  it('pauses while the pointer is over it and resumes with a fresh clock afterwards', () => {
    const { container } = renderTour()
    const root = container.firstElementChild as HTMLElement
    fireEvent.mouseEnter(root)
    act(() => void vi.advanceTimersByTime(STEP_MS * 3))
    expect(tab(/Create an issue/)).toHaveAttribute('aria-selected', 'true')

    fireEvent.mouseLeave(root)
    act(() => void vi.advanceTimersByTime(STEP_MS - 100))
    expect(tab(/Create an issue/)).toHaveAttribute('aria-selected', 'true')
    act(() => void vi.advanceTimersByTime(200))
    expect(tab(/Drag it across the board/)).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps from the last step back to the first', () => {
    renderTour()
    // Each step schedules the next one only after it renders, so advance one step per act().
    for (let step = 0; step < 5; step++) act(() => void vi.advanceTimersByTime(STEP_MS + 50))
    expect(tab(/Create an issue/)).toHaveAttribute('aria-selected', 'true')
  })

  it('does not auto-advance when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    renderTour()
    act(() => void vi.advanceTimersByTime(STEP_MS * 3))
    expect(tab(/Create an issue/)).toHaveAttribute('aria-selected', 'true')
  })
})
