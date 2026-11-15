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
      className={`inline-flex items-center gap-0.5 rounded-md bg-well p-0.5 ${className}`}
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
            className={`flex h-7 w-8 items-center justify-center rounded transition-colors ${active ? 'bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.12)] ring-1 ring-border' : 'text-fg-muted hover:text-fg'}`}
          >
            <Icon name={ICONS[option]} size={14} />
          </button>
        )
      })}
    </div>
  )
}
