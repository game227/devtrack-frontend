import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import type { IconName } from './Icon'

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

const actionClass =
  'inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98]'

// One consistent "nothing here yet" block: what this place is for, plus a single obvious next step.
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-10 text-center ${className}`}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-border text-fg-muted">
        <Icon name={icon} size={20} />
      </span>
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className={`mt-4 ${actionClass}`}>
            <Icon name="plus" />
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={`mt-4 ${actionClass}`}>
            <Icon name="plus" />
            {action.label}
          </button>
        ))}
    </div>
  )
}
