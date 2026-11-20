import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n'
import { ToastProvider } from './ToastViewport'
import { useToast } from './toastContext'

function Trigger({ onUndo }: { onUndo: () => void }) {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast({ text: '#4 moved to Done', action: { label: 'Undo', onClick: onUndo } })}>
      move
    </button>
  )
}

describe('ToastProvider', () => {
  afterEach(() => vi.useRealTimers())

  it('announces a toast, runs its action once, and goes away', async () => {
    const onUndo = vi.fn()
    render(
      <I18nProvider>
        <MemoryRouter>
          <ToastProvider>
            <Trigger onUndo={onUndo} />
          </ToastProvider>
        </MemoryRouter>
      </I18nProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'move' }))
    expect(screen.getByRole('status')).toHaveTextContent('#4 moved to Done')
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledOnce()
    expect(screen.queryByText('#4 moved to Done')).not.toBeInTheDocument()
  })

  it('disappears by itself after a few seconds', async () => {
    vi.useFakeTimers()
    render(
      <I18nProvider>
        <MemoryRouter>
          <ToastProvider>
            <Trigger onUndo={vi.fn()} />
          </ToastProvider>
        </MemoryRouter>
      </I18nProvider>,
    )
    act(() => screen.getByRole('button', { name: 'move' }).click())
    expect(screen.getByText('#4 moved to Done')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(5100))
    expect(screen.queryByText('#4 moved to Done')).not.toBeInTheDocument()
  })
})
