import { useTheme } from '../hooks/useTheme'
import { useT } from '../i18n'
import { THEME_PREFERENCES } from '../lib/theme'
import type { ThemePreference } from '../lib/theme'
import { Icon } from './Icon'
import type { IconName } from './Icon'

const ICONS: Record<ThemePreference, IconName> = { light: 'sun', dark: 'moon', system: 'monitor' }

export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const t = useT()
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label={t('theme.label')}
      className={`inline-flex items-center gap-0.5 rounded-xl bg-fg/[0.07] p-1 ${className}`}
    >
      {THEME_PREFERENCES.map((option) => {
        const active = preference === option
        return (
          <button
            key={option}
            type="button"
            title={t(`theme.${option}`)}
            aria-label={t(`theme.${option}`)}
            aria-pressed={active}
            onClick={() => setPreference(option)}
            className={`flex h-7 w-8 items-center justify-center rounded-lg transition-colors ${active ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:text-fg'}`}
          >
            <Icon name={ICONS[option]} size={14} />
          </button>
        )
      })}
    </div>
  )
}
