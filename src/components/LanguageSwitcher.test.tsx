import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { I18nProvider, useT } from '../i18n'
import { STORAGE_KEY } from '../i18n/core'
import { LanguageSwitcher } from './LanguageSwitcher'

function Probe() {
  const t = useT()
  return <p>{t('common.save')}</p>
}

describe('LanguageSwitcher', () => {
  it('marks the current language as pressed and switches the whole UI', async () => {
    const user = userEvent.setup()
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: /o'zbekcha/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Saqlash')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /english/i }))

    expect(screen.getByRole('button', { name: /english/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en')
  })

  it('restores the stored language on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'en')
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByText('Save')).toBeInTheDocument()
  })
})
