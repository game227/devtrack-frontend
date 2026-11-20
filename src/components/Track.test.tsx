import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../i18n'
import { STORAGE_KEY } from '../i18n/core'
import { StatusStepper, StatusTrack, TrackProgress } from './Track'

function inEnglish(ui: React.ReactElement) {
  localStorage.setItem(STORAGE_KEY, 'en')
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('StatusTrack', () => {
  it('is named after the status it shows, and marks the stations up to it', () => {
    const { container } = inEnglish(<StatusTrack status="in_progress" />)
    expect(screen.getByRole('img', { name: 'In progress' })).toBeInTheDocument()
    // Five stations; the current one is the large marker.
    const circles = [...container.querySelectorAll('circle')]
    expect(circles).toHaveLength(5)
    expect(circles.map((c) => c.getAttribute('r'))).toEqual(['2.25', '2.25', '4', '2.25', '2.25'])
  })
})

describe('StatusStepper', () => {
  it('presses the current station and moves to another one when chosen', async () => {
    const onChange = vi.fn()
    inEnglish(<StatusStepper status="todo" onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Status' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Done' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'Todo' })) // already there: nothing to do
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'In review' }))
    expect(onChange).toHaveBeenCalledWith('in_review')
  })

  it('is read-only when disabled', async () => {
    const onChange = vi.fn()
    inEnglish(<StatusStepper status="todo" disabled onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Status' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('TrackProgress', () => {
  it('reports a clamped, rounded value', () => {
    inEnglish(<TrackProgress percent={142.4} label="Payments" />)
    expect(screen.getByRole('progressbar', { name: 'Payments' })).toHaveAttribute('aria-valuenow', '100')
  })
})
