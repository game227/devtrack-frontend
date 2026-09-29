import { Link } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import { useI18n } from '../i18n'
import { formatDate } from '../i18n/core'

// Legal copy is written as '## Heading' + paragraphs, separated by blank
// lines — simple enough for two static pages, no need for a markdown lib.
function renderBody(body: string) {
  return body.split('\n\n').map((block, index) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={index} className="mt-8 mb-2 text-base font-semibold text-fg first:mt-0">
          {block.slice(3)}
        </h2>
      )
    }
    return (
      <p key={index} className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">
        {block}
      </p>
    )
  })
}

// The date this copy was last reviewed — bump it whenever the text changes.
const LAST_UPDATED_ISO = '2026-09-29T00:00:00Z'

export function LegalPage({ titleKey, bodyKey }: { titleKey: string; bodyKey: string }) {
  const { t, lang } = useI18n()

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-fg hover:text-accent">
            <span aria-hidden="true">←</span>
            {t('legal.backToHome')}
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-fg">{t(titleKey)}</h1>
        <p className="mt-1 text-xs text-fg-muted">{t('legal.updated', { date: formatDate(lang, LAST_UPDATED_ISO) })}</p>
        <div className="mt-6 space-y-3">{renderBody(t(bodyKey))}</div>
      </main>
    </div>
  )
}
