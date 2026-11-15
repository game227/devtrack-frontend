import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Logo } from '../components/Track'
import { button } from '../components/ui'

// A line that runs out: the stations end and the rail goes on, dashed, to nowhere.
export function NotFoundPage() {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link to="/" className="flex h-9 items-center rounded-md">
          <Logo />
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 flex-col justify-center px-4 pb-24 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div aria-hidden="true" className="mb-10 flex items-center">
            <span className="block h-5 w-5 shrink-0 rounded-full bg-st-done" />
            <span className="h-[4px] w-24 bg-brand sm:w-40" />
            <span className="block h-5 w-5 shrink-0 rounded-full bg-brand" />
            <span className="h-[4px] flex-1 bg-[repeating-linear-gradient(90deg,var(--color-border-strong)_0_10px,transparent_10px_18px)]" />
          </div>
          <p className="font-mono text-sm text-fg-muted">404</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">{t('notFound.title')}</h1>
          <p className="mt-3 max-w-md text-[15px] text-fg-muted">{t('notFound.text')}</p>
          <Link to="/dashboard" className={`mt-8 ${button('primary', 'lg')}`}>
            {t('notFound.home')}
          </Link>
        </div>
      </main>
    </div>
  )
}
