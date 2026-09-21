import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function NotFoundPage() {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center text-fg">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <p className="font-mono text-sm text-code">404</p>
      <h1 className="text-xl font-semibold">{t('notFound.title')}</h1>
      <p className="max-w-sm text-sm text-fg-muted">{t('notFound.text')}</p>
      <Link
        to="/dashboard"
        className="rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-fg"
      >
        {t('notFound.home')}
      </Link>
    </div>
  )
}
