import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { button } from './ui'

interface EmptyStateAction {
  label: string
  to?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon: IconName
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}

// "Nothing here yet": what this place is for, plus a single obvious next step. Drawn as a line whose
// last station is still empty, with a small traveller heading for it.
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-start gap-1 rounded-xl border border-dashed border-border-strong px-6 py-8 ${className}`}>
      <span aria-hidden="true" className="relative mb-4 block h-12 w-56">
        <svg viewBox="0 0 224 48" className="absolute inset-0 h-full w-full overflow-visible">
          <line x1="8" y1="24" x2="196" y2="24" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" />
          <line x1="8" y1="24" x2="88" y2="24" stroke="var(--color-border-strong)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="10" cy="24" r="5" fill="var(--color-border-strong)" />
          <circle cx="50" cy="24" r="5" fill="var(--color-border-strong)" />
          <circle cx="92" cy="24" r="5" fill="var(--color-surface)" stroke="var(--color-border-strong)" strokeWidth="2" />
          <circle cx="134" cy="24" r="5" fill="var(--color-surface)" stroke="var(--color-border-strong)" strokeWidth="2" />
          <circle className="empty-traveller" cx="10" cy="24" r="4" fill="var(--color-orange)" stroke="var(--color-surface)" strokeWidth="1.5" />
        </svg>
        <span className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-border-strong bg-surface text-fg-muted">
          <Icon name={icon} size={20} />
        </span>
      </span>
      <h2 className="text-base font-semibold tracking-[-0.01em] text-fg">{title}</h2>
      {description && <p className="max-w-md text-sm text-fg-muted">{description}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className={`mt-4 ${button('primary')}`}>
            <Icon name="plus" />
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={`mt-4 ${button('primary')}`}>
            <Icon name="plus" />
            {action.label}
          </button>
        ))}
    </div>
  )
}
