import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { STATUS_COLOR } from '../lib/statusColors'
import { ISSUE_STATUSES } from '../types/issue'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Logo } from './Track'
import { button, pageTitle } from './ui'

// Sign-in, sign-up and recovery: the form on a frosted card, and on wide screens an ink panel with the
// line of stations, framed like the landing page's device.
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col text-fg">
      <header className="px-3 pt-3 sm:pt-5">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 sm:px-4">
          <Link to="/" className="flex h-9 items-center rounded-lg">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="glass mx-auto w-full max-w-md rounded-[24px] p-6 sm:p-8">
          <h1 className={`mb-7 ${pageTitle}`}>{title}</h1>
          {children}
        </div>
        <aside aria-hidden="true" className="relative hidden p-10 lg:block">
          <span className="corners absolute inset-0 [--corner-size:28px]" />
          <span className="crosshair right-[4%] top-[12%]" />
          <span className="crosshair bottom-[14%] left-[6%]" />
          <div className="device-float">
            <div className="on-ink rounded-[30px] bg-[linear-gradient(155deg,#3a3a38_0%,#141414_38%,#050505_100%)] p-10 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.65),inset_0_1px_0_rgb(255_255_255/0.16)]">
              <div className="relative mx-auto flex w-fit flex-col gap-10">
                <span className="absolute bottom-[13px] left-[13px] top-[13px] w-[3px] -translate-x-1/2 rounded-full bg-white/80" />
                {ISSUE_STATUSES.map((status) => (
                  <div key={status} className="relative flex items-center gap-5">
                    <span className="block h-[26px] w-[26px] shrink-0 rounded-full ring-[5px] ring-[#121212]" style={{ backgroundColor: STATUS_COLOR[status] }} />
                    <span className="text-2xl font-medium tracking-[-0.03em] text-white">{t(`status.${status}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>
      <footer className="px-4 pb-6 text-center text-sm text-fg-muted">
        <Link to="/" className="hover:text-fg hover:underline">
          {t('auth.backHome')}
        </Link>
      </footer>
    </div>
  )
}

export const primaryButtonClass = `${button('primary', 'lg')} w-full rounded-xl`
