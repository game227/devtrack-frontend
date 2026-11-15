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

// "Nothing here yet": what this place is for, plus a single obvious next step. Drawn as the end of a
// line with an empty station, waiting for its first stop.
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-start gap-1 rounded-xl border border-dashed border-border-strong px-6 py-8 ${className}`}>
      <span className="mb-3 flex items-center gap-2 text-fg-muted" aria-hidden="true">
        <span className="h-[3px] w-8 rounded-full bg-border" />
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-border-strong">
          <Icon name={icon} size={16} />
        </span>
      </span>
      <h2 className="text-base font-bold text-fg">{title}</h2>
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
