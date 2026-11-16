import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { AppErrorBoundary } from './AppErrorBoundary'

let shouldThrow = true
function Flaky() {
  if (shouldThrow) throw new Error('boom')
  return <p>all good</p>
}

describe('AppErrorBoundary', () => {
  it('shows a way out instead of a blank page, and can try again', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderWithProviders(
      <AppErrorBoundary>
        <Flaky />
      </AppErrorBoundary>,
      { lang: 'en' },
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong on this page')
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument()
    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('all good')).toBeInTheDocument()
    spy.mockRestore()
  })
})
