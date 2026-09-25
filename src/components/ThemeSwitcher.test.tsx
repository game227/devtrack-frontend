import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { setPreference } from '../lib/theme'
import { ThemeSwitcher } from './ThemeSwitcher'

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    setPreference('dark')
  })

  it('offers light, dark and system, marking the current one', () => {
    renderWithProviders(<ThemeSwitcher />, { lang: 'en' })
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Match system' })).toBeInTheDocument()
  })

  it('switches the page theme when a button is pressed', async () => {
    renderWithProviders(<ThemeSwitcher />, { lang: 'en' })
    await userEvent.click(screen.getByRole('button', { name: 'Light' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('devtrack_theme')).toBe('light')
  })

  it('keeps several switchers on the page in step', async () => {
    renderWithProviders(
      <>
        <ThemeSwitcher />
        <ThemeSwitcher />
      </>,
      { lang: 'en' },
    )
    await userEvent.click(screen.getAllByRole('button', { name: 'Light' })[0])
    for (const button of screen.getAllByRole('button', { name: 'Light' })) {
      expect(button).toHaveAttribute('aria-pressed', 'true')
    }
  })

  it('speaks Uzbek', () => {
    renderWithProviders(<ThemeSwitcher />)
    expect(screen.getByRole('group', { name: 'Mavzu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "Yorug'" })).toBeInTheDocument()
  })
})
