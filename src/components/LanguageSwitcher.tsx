import { LANGS, useI18n } from '../i18n'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('lang.switch')}
      className={`inline-flex items-center gap-0.5 rounded-xl bg-fg/[0.07] p-1 ${className}`}
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
            className={`flex h-7 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
              active ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
