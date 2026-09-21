import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ConfirmButton } from './ConfirmButton'

describe('ConfirmButton', () => {
  it('needs a second click before it confirms', async () => {
    const onConfirm = vi.fn()
    renderWithProviders(<ConfirmButton onConfirm={onConfirm}>O'chirish</ConfirmButton>)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: "O'chirish" }))
    expect(onConfirm).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Ishonchingiz komilmi?' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: "O'chirish" })).toBeInTheDocument()
  })

  it('disarms itself after a few seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const onConfirm = vi.fn()
      renderWithProviders(<ConfirmButton onConfirm={onConfirm}>Delete</ConfirmButton>, { lang: 'en' })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await user.click(screen.getByRole('button', { name: 'Delete' }))
      expect(screen.getByRole('button', { name: 'Are you sure?' })).toBeInTheDocument()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3100)
      })
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
      expect(onConfirm).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
