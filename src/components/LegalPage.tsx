import { Link } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Track'
import { ThemeSwitcher } from './ThemeSwitcher'
import { useI18n } from '../i18n'
import { formatDate } from '../i18n/core'

// Legal copy is written as '## Heading' + paragraphs, separated by blank
// lines — simple enough for two static pages, no need for a markdown lib.
function renderBody(body: string) {
  return body.split('\n\n').map((block, index) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={index} className="mb-2 mt-10 text-lg font-bold text-fg first:mt-0">
          {block.slice(3)}
        </h2>
      )
    }
    return (
      <p key={index} className="max-w-[68ch] whitespace-pre-line text-[15px] leading-relaxed text-fg">
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
    <div className="min-h-screen px-3 text-fg">
      <header className="px-3 pt-3 sm:pt-5">
        <div className="glass mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 rounded-2xl px-3 sm:px-4">
          <Link to="/" className="flex h-9 items-center rounded-md">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="glass mx-auto my-8 max-w-3xl rounded-[24px] px-6 py-10 sm:px-10">
        <h1 className="text-4xl font-medium tracking-[-0.04em] text-fg">{t(titleKey)}</h1>
        <p className="mb-10 mt-2 text-sm text-fg-muted">{t('legal.updated', { date: formatDate(lang, LAST_UPDATED_ISO) })}</p>
        <div className="space-y-3">{renderBody(t(bodyKey))}</div>
        <Link to="/" className="mt-12 inline-block text-sm font-semibold text-accent hover:underline">
          {t('legal.backToHome')}
        </Link>
      </main>
    </div>
  )
}
