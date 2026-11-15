import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { STATUS_COLOR } from '../lib/statusColors'
import { ISSUE_STATUSES } from '../types/issue'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Logo } from './Track'
import { button } from './ui'

// Sign-in, sign-up and recovery pages: the form on the left, the line on the right (wide screens).
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const t = useT()
  return (
    <div className="grid min-h-screen bg-bg text-fg lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link to="/" className="flex h-9 items-center rounded-md">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-sm">
            <h1 className="mb-8 text-3xl font-extrabold tracking-[-0.025em]">{title}</h1>
            {children}
          </div>
        </main>
        <footer className="px-4 pb-6 text-sm text-fg-muted sm:px-8">
          <Link to="/" className="hover:text-fg hover:underline">
            {t('auth.backHome')}
          </Link>
        </footer>
      </div>
      <aside aria-hidden="true" className="relative hidden overflow-hidden border-l border-border bg-well lg:block">
        <div className="flex h-full items-center justify-center">
          <div className="relative flex flex-col gap-11">
            <span className="absolute bottom-[15px] left-[15px] top-[15px] w-[4px] -translate-x-1/2 rounded-full bg-brand" />
            {ISSUE_STATUSES.map((status) => (
              <div key={status} className="relative flex items-center gap-5">
                <span className="block h-[30px] w-[30px] shrink-0 rounded-full ring-[6px] ring-well" style={{ backgroundColor: STATUS_COLOR[status] }} />
                <span className="text-2xl font-extrabold tracking-[-0.02em] text-fg">{t(`status.${status}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

export const primaryButtonClass = `${button('primary', 'lg')} w-full`
