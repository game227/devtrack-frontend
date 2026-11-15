import { LANGS, useI18n } from '../i18n'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('lang.switch')}
      className={`inline-flex items-center gap-0.5 rounded-md bg-well p-0.5 ${className}`}
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
            className={`flex h-7 min-w-9 items-center justify-center rounded px-2 text-xs font-bold transition-colors ${
              active ? 'bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.12)] ring-1 ring-border' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
