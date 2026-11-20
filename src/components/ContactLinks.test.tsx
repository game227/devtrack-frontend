import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ContactCircles, ContactList } from './ContactLinks'

describe('ContactLinks', () => {
  it('offers email, phone and Instagram as named round links', () => {
    renderWithProviders(<ContactCircles />, { lang: 'uz' })
    const list = screen.getByRole('list', { name: "Bog'lanish" })
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'mailto:safary12800@gmail.com',
      'tel:+998774166698',
      'https://www.instagram.com/u767lb/',
    ])
    expect(screen.getByRole('link', { name: "Qo'ng'iroq qilish: +998 77 416 66 98" })).toBeInTheDocument()
    // Only the external link opens a new tab, and it does so without handing over the opener.
    expect(links[2]).toHaveAttribute('target', '_blank')
    expect(links[2]).toHaveAttribute('rel', 'noopener noreferrer')
    expect(links[0]).not.toHaveAttribute('target')
  })

  it('lists each way to reach the team with its label', () => {
    renderWithProviders(<ContactList />, { lang: 'en' })
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Email safary12800@gmail\.com/ })).toHaveAttribute('href', 'mailto:safary12800@gmail.com')
    expect(screen.getByRole('link', { name: /Instagram @u767lb/ })).toHaveAttribute('href', 'https://www.instagram.com/u767lb/')
  })
})
