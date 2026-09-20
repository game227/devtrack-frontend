import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          DevTrack
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm rounded-md border border-border bg-bg-elevated p-6">
          <h1 className="mb-6 text-lg font-semibold">{title}</h1>
          {children}
        </div>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-fg-muted">
        <Link to="/" className="hover:text-fg">
          {t('auth.backHome')}
        </Link>
      </footer>
    </div>
  )
}

export const primaryButtonClass =
  'w-full rounded-md border border-border px-3 py-2 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100'
