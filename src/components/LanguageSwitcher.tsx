import { LANGS, useI18n } from '../i18n'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('lang.switch')}
      className={`inline-flex items-center rounded-md border border-border p-0.5 ${className}`}
    >
      {LANGS.map((code) => {
        const active = lang === code
        return (
          <button
            key={code}
            type="button"
            lang={code}
            title={t(`lang.${code}`)}
            aria-label={`${code.toUpperCase()} — ${t(`lang.${code}`)}`}
            aria-pressed={active}
            onClick={() => setLang(code)}
            className={`rounded px-2 py-0.5 text-xs font-medium uppercase transition-colors ${
              active ? 'bg-fg text-bg' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
