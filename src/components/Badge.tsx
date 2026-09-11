import type { Priority, ProjectStatus } from '../types/project'
import type { IssueStatus } from '../types/issue'

const STATUS_STYLES: Record<ProjectStatus, string> = {
  planned: 'bg-slate-500/15 text-slate-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  paused: 'bg-amber-500/15 text-amber-300',
  completed: 'bg-blue-500/15 text-blue-300',
  archived: 'bg-fg-muted/15 text-fg-muted',
}

const ISSUE_STATUS_STYLES: Record<IssueStatus, string> = {
  backlog: 'bg-fg-muted/15 text-fg-muted',
  todo: 'bg-slate-500/15 text-slate-300',
  in_progress: 'bg-amber-500/15 text-amber-300',
  in_review: 'bg-blue-500/15 text-blue-300',
  done: 'bg-emerald-500/15 text-emerald-300',
}

const PRIORITY_STYLES: Record<Priority, string> = {
  none: 'bg-fg-muted/15 text-fg-muted',
  low: 'bg-slate-500/15 text-slate-300',
  medium: 'bg-amber-500/15 text-amber-300',
  high: 'bg-orange-500/15 text-orange-300',
  urgent: 'bg-red-500/15 text-red-300',
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${className}`}>
      {label.replace('_', ' ')}
    </span>
  )
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge label={status} className={STATUS_STYLES[status]} />
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <Badge label={status} className={ISSUE_STATUS_STYLES[status]} />
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge label={priority} className={PRIORITY_STYLES[priority]} />
}
