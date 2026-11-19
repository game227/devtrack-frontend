import { useT } from '../i18n'
import type { Priority, ProjectStatus } from '../types/project'
import type { IssueStatus } from '../types/issue'
import type { ProjectHealthStatus } from '../types/health'
import type { PullRequestState } from '../types/integrations'
import { StationGlyph } from './Track'

// Chips: a coloured dot for the state, the label in text colour (so it always reads at 4.5:1).

const NEUTRAL = 'var(--color-st-backlog)'
const SUCCESS = 'var(--color-success)'
const WARNING = 'var(--color-st-progress)'
const INFO = 'var(--color-st-todo)'
const DANGER = 'var(--color-danger)'
const MERGED = 'var(--color-merged)'

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string | null> = {
  planned: INFO,
  active: SUCCESS,
  paused: WARNING,
  completed: NEUTRAL,
  archived: null,
}

const HEALTH_STATUS_COLORS: Record<ProjectHealthStatus, string> = {
  healthy: SUCCESS,
  needs_attention: WARNING,
  at_risk: DANGER,
}

const PULL_REQUEST_STATE_COLORS: Record<'open' | 'closed' | 'merged', string> = {
  open: SUCCESS,
  merged: MERGED,
  closed: DANGER,
}

function Chip({ label, color }: { label: string; color: string | null }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface/70 px-2.5 text-xs font-medium text-fg">
      {color && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      {label}
    </span>
  )
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const t = useT()
  return <Chip label={t(`projectStatus.${status}`)} color={PROJECT_STATUS_COLORS[status]} />
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const t = useT()
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface/70 px-2.5 text-xs font-medium text-fg">
      <StationGlyph status={status} size={11} />
      {t(`status.${status}`)}
    </span>
  )
}

// Priority as signal bars (one to three, urgent is a solid red chip). "No priority" shows nothing:
// it is the absence of a signal, not one more label in every row.
const PRIORITY_LEVEL: Record<Priority, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 3 }

export function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useT()
  if (priority === 'none') return null
  const label = t(`priority.${priority}`)
  if (priority === 'urgent') {
    return (
      <span className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-danger px-2.5 text-xs font-bold text-bg">
        <span aria-hidden="true">!</span>
        {label}
      </span>
    )
  }
  const level = PRIORITY_LEVEL[priority]
  const color = priority === 'high' ? 'var(--color-danger)' : priority === 'medium' ? WARNING : 'var(--color-fg-muted)'
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-fg-muted">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        {[0, 1, 2].map((bar) => (
          <rect
            key={bar}
            x={1 + bar * 4}
            y={8 - bar * 3}
            width="2.5"
            height={3 + bar * 3}
            rx="0.75"
            fill={bar < level ? color : 'var(--color-border-strong)'}
            opacity={bar < level ? 1 : 0.45}
          />
        ))}
      </svg>
      {label}
    </span>
  )
}

export function HealthStatusBadge({ status }: { status: ProjectHealthStatus }) {
  const t = useT()
  return <Chip label={t(`health.${status}`)} color={HEALTH_STATUS_COLORS[status]} />
}

export function PullRequestStatusBadge({ state, merged }: { state: PullRequestState; merged: boolean }) {
  const t = useT()
  const effective = merged ? 'merged' : state
  return <Chip label={t(`pr.${effective}`)} color={PULL_REQUEST_STATE_COLORS[effective]} />
}
