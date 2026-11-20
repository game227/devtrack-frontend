import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import { Icon } from './Icon'
import type { IconName } from './Icon'

const ITEMS: Array<{ to: string; labelKey: string; icon: IconName }> = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { to: '/projects', labelKey: 'nav.projects', icon: 'projects' },
  { to: '/issues', labelKey: 'nav.issues', icon: 'issues' },
  { to: '/teams', labelKey: 'nav.teams', icon: 'teams' },
]

// Phones: the main sections within thumb reach, with "New issue" in the middle. Hidden from md up, where
// the top navigation has room.
export function BottomNav({ onNewIssue }: { onNewIssue: () => void }) {
  const t = useT()
  const item = (entry: (typeof ITEMS)[number]) => (
    <NavLink
      key={entry.to}
      to={entry.to}
      className={({ isActive }) =>
        `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
          isActive ? 'text-fg' : 'text-fg-muted hover:text-fg'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? 'bg-brand-soft' : ''}`}>
            <Icon name={entry.icon} size={18} />
          </span>
          <span className="max-w-full truncate">{t(entry.labelKey)}</span>
        </>
      )}
    </NavLink>
  )
  return (
    <nav
      aria-label={t('nav.mobile')}
      className="glass-menu fixed inset-x-2 bottom-2 z-30 flex items-end gap-1 rounded-2xl px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 md:hidden print:hidden"
    >
      {ITEMS.slice(0, 2).map(item)}
      <button
        type="button"
        onClick={onNewIssue}
        aria-label={t('issues.new')}
        className="btn-ink mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-float"
      >
        <Icon name="plus" size={20} />
      </button>
      {ITEMS.slice(2).map(item)}
    </nav>
  )
}
