import type { Priority, ProjectStatus } from '../types/project'
import type { IssueStatus } from '../types/issue'
import type { ProjectHealthStatus } from '../types/health'
import type { PullRequestState } from '../types/integrations'

const NEUTRAL = '#6e727a'
const SUCCESS = '#3ad389'
const WARNING = '#ffca16'
const INFO = '#70b8ff'
const DANGER = '#ff9592'
const MERGED_VIOLET = '#baa7ff'

const STATUS_COLORS: Record<ProjectStatus, string | null> = {
  planned: NEUTRAL,
  active: SUCCESS,
  paused: WARNING,
  completed: INFO,
  archived: null,
}

const ISSUE_STATUS_COLORS: Record<IssueStatus, string | null> = {
  backlog: null,
  todo: null,
  in_progress: WARNING,
  in_review: INFO,
  done: SUCCESS,
}

const PRIORITY_COLORS: Record<Priority, string | null> = {
  none: null,
  low: null,
  medium: WARNING,
  high: DANGER,
  urgent: DANGER,
}

const HEALTH_STATUS_COLORS: Record<ProjectHealthStatus, string> = {
  healthy: SUCCESS,
  needs_attention: WARNING,
  at_risk: DANGER,
}

const PULL_REQUEST_STATE_COLORS: Record<'open' | 'closed' | 'merged', string> = {
  open: SUCCESS,
  merged: MERGED_VIOLET,
  closed: DANGER,
}

function Badge({ label, color }: { label: string; color: string | null }) {
  const textColor = color ?? NEUTRAL
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium capitalize"
      style={{ color: textColor }}
    >
      {color && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      {label.replace('_', ' ')}
    </span>
  )
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge label={status} color={STATUS_COLORS[status]} />
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <Badge label={status} color={ISSUE_STATUS_COLORS[status]} />
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge label={priority} color={PRIORITY_COLORS[priority]} />
}

export function HealthStatusBadge({ status }: { status: ProjectHealthStatus }) {
  return <Badge label={status} color={HEALTH_STATUS_COLORS[status]} />
}

export function PullRequestStatusBadge({ state, merged }: { state: PullRequestState; merged: boolean }) {
  const effective = merged ? 'merged' : state
  return <Badge label={effective} color={PULL_REQUEST_STATE_COLORS[effective]} />
}
