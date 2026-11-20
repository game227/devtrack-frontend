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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Har bir vazifa bitta chiziqda. Doim ko'z oldida.")
    const signUp = screen.getAllByRole('link', { name: /Ish maydoni yaratish/ })[0]
    expect(signUp).toHaveAttribute('href', '/register')
  })

  it('switches to English', () => {
    renderLanding({ lang: 'en' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Every task on one line. Always in view.')
    expect(screen.getByRole('heading', { name: 'Commits move issues for you' })).toBeInTheDocument()
    // The hero device's board names all five stations, and the steps to get started are a real sequence.
    for (const station of ['Backlog', 'Todo', 'In progress', 'In review', 'Done']) {
      expect(screen.getAllByText(station).length).toBeGreaterThanOrEqual(1)
    }
    // Language and theme are round buttons on the page itself.
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'From sign-up to a working board' })).toBeInTheDocument()
  })

  it('loads the screenshots of the selected language', () => {
    renderLanding({ lang: 'en' })
    const sources = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
    expect(sources.length).toBeGreaterThanOrEqual(5)
    expect(sources.every((src) => src?.startsWith('/screens/en/'))).toBe(true)
  })

  it('shows Russian visitors Russian screenshots', () => {
    renderLanding({ lang: 'ru' })
    const sources = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
    expect(sources.every((src) => src?.startsWith('/screens/ru/'))).toBe(true)
  })

  it('sends signed-in users straight to the dashboard', () => {
    renderLanding({ auth: makeAuth({ isAuthenticated: true }) })
    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })

  it('links to the privacy policy and terms of service in the footer', () => {
    renderLanding()
    expect(screen.getByRole('link', { name: 'Maxfiylik siyosati' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: 'Foydalanish shartlari' })).toHaveAttribute('href', '/terms')
  })
})
