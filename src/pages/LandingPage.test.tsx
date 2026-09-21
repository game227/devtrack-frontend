import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { makeAuth, renderWithProviders } from '../test/utils'
import { LandingPage } from './LandingPage'

function renderLanding(options: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<p>dashboard page</p>} />
    </Routes>,
    { route: '/', ...options },
  )
}

describe('LandingPage', () => {
  it('speaks Uzbek by default and points to sign-up', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ishni boshqaring. Ishlab chiqishni tushuning.')
    const signUp = screen.getAllByRole('link', { name: /Ish maydoni yaratish/ })[0]
    expect(signUp).toHaveAttribute('href', '/register')
  })

  it('switches to English', () => {
    renderLanding({ lang: 'en' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Manage the work. Understand the development.')
    expect(screen.getByRole('heading', { name: 'Everything a small dev team needs' })).toBeInTheDocument()
  })

  it('loads the screenshots of the selected language', () => {
    renderLanding({ lang: 'en' })
    const sources = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
    expect(sources.length).toBeGreaterThanOrEqual(5)
    expect(sources.every((src) => src?.startsWith('/screens/en/'))).toBe(true)
  })

  it('sends signed-in users straight to the dashboard', () => {
    renderLanding({ auth: makeAuth({ isAuthenticated: true }) })
    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })
})
