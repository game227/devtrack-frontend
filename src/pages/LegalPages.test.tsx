import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { PrivacyPolicyPage } from './PrivacyPolicyPage'
import { TermsOfServicePage } from './TermsOfServicePage'

describe('PrivacyPolicyPage', () => {
  it('renders the Uzbek policy by default, with a way back home', () => {
    renderWithProviders(<PrivacyPolicyPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Maxfiylik siyosati')
    // A section heading is just its title; the section's text is a paragraph under it.
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toContain('Sizning tanlovlaringiz')
    expect(headings).toContain("Bog'lanish")
    expect(headings.every((h) => (h ?? '').length < 60)).toBe(true)
    expect(screen.getByRole('link', { name: /Bosh sahifaga qaytish/ })).toHaveAttribute('href', '/')
  })

  it('renders the English policy when switched', () => {
    renderWithProviders(<PrivacyPolicyPage />, { lang: 'en' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Privacy Policy')
    // Contact: email, phone and Instagram, each a real link.
    expect(screen.getByRole('link', { name: /safary12800@gmail\.com/ })).toHaveAttribute('href', 'mailto:safary12800@gmail.com')
    expect(screen.getByRole('link', { name: /\+998 77 416 66 98/ })).toHaveAttribute('href', 'tel:+998774166698')
    const instagram = screen.getByRole('link', { name: /@u767lb/ })
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/u767lb/')
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('TermsOfServicePage', () => {
  it('renders the Uzbek terms by default', () => {
    renderWithProviders(<TermsOfServicePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Foydalanish shartlari')
  })

  it('renders the English terms when switched, with the same contact details', () => {
    renderWithProviders(<TermsOfServicePage />, { lang: 'en' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Terms of Service')
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /safary12800@gmail\.com/ })).toBeInTheDocument()
  })
})
