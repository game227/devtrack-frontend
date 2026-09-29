import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { PrivacyPolicyPage } from './PrivacyPolicyPage'
import { TermsOfServicePage } from './TermsOfServicePage'

describe('PrivacyPolicyPage', () => {
  it('renders the Uzbek policy by default, with a way back home', () => {
    renderWithProviders(<PrivacyPolicyPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Maxfiylik siyosati')
    expect(screen.getByRole('link', { name: /Bosh sahifaga qaytish/ })).toHaveAttribute('href', '/')
  })

  it('renders the English policy when switched', () => {
    renderWithProviders(<PrivacyPolicyPage />, { lang: 'en' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Privacy Policy')
    expect(screen.getByText(/abdulazizshukurov12@gmail.com/)).toBeInTheDocument()
  })
})

describe('TermsOfServicePage', () => {
  it('renders the Uzbek terms by default', () => {
    renderWithProviders(<TermsOfServicePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Foydalanish shartlari')
  })

  it('renders the English terms when switched', () => {
    renderWithProviders(<TermsOfServicePage />, { lang: 'en' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Terms of Service')
  })
})
