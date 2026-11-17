import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import type { User } from '../types/auth'
import { DemoBanner, DemoButton } from './DemoButton'

describe('DemoButton', () => {
  it('signs in to a demo and opens the dashboard', async () => {
    const startDemo = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(
      <Routes>
        <Route path="/" element={<DemoButton />} />
        <Route path="/dashboard" element={<p>dashboard</p>} />
      </Routes>,
      { lang: 'en', auth: { startDemo } },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try the demo' }))
    expect(startDemo).toHaveBeenCalled()
    expect(await screen.findByText('dashboard')).toBeInTheDocument()
  })

  it('says when the demo is busy', async () => {
    const startDemo = vi.fn().mockRejectedValue(new AxiosError('busy', '503', undefined, undefined, { status: 503, data: {} } as AxiosResponse))
    renderWithProviders(<DemoButton />, { lang: 'en', auth: { startDemo } })
    await userEvent.click(screen.getByRole('button', { name: 'Try the demo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The demo is busy right now.')
  })
})

describe('DemoBanner', () => {
  it('shows only for demo accounts', () => {
    const demo = { id: 1, username: 'demo-0a1b2c3d' } as User
    const { unmount } = renderWithProviders(<DemoBanner />, { lang: 'en', auth: { user: demo, isAuthenticated: true } })
    expect(screen.getByText(/You are in a demo/)).toBeInTheDocument()
    unmount()
    renderWithProviders(<DemoBanner />, { lang: 'en', auth: { user: { id: 2, username: 'aziza-0a1b2c3d' } as User, isAuthenticated: true } })
    expect(screen.queryByText(/You are in a demo/)).not.toBeInTheDocument()
  })
})
