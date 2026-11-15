import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import type { Issue } from '../types/issue'
import { Avatar } from './Avatar'
import { PriorityBadge } from './Badge'
import { DueChip } from './DueChip'
import { StatusTrack } from './Track'

// One issue in a list: where it is on the line first, so a column of rows reads like a progress chart.
// Rendered inside a <ul> (IssueList) whose rows are separated by hairlines.
export function IssueRow({ issue, index = 0 }: { issue: Issue; index?: number }) {
  const t = useT()
  const done = issue.status === 'done'
  return (
    <li style={{ '--i': index } as CSSProperties}>
      <Link
        to={`/issues/${issue.id}`}
        className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 transition-colors duration-150 hover:bg-well sm:flex-nowrap"
      >
        <StatusTrack status={issue.status} />
        <span className="w-10 shrink-0 font-mono text-xs text-fg-muted tabular">#{issue.number}</span>
        <span className="flex min-w-0 flex-1 basis-48 items-baseline gap-2">
          <span className={`truncate text-sm font-semibold ${done ? 'text-fg-muted line-through decoration-border-strong' : 'text-fg'}`}>
            {issue.title}
          </span>
          {/* Imported issues keep GitHub's number, so this only adds information when they differ. */}
          {issue.github_number !== null && issue.github_number !== issue.number && (
            <span className="shrink-0 font-mono text-xs text-fg-muted">GH#{issue.github_number}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="hidden w-24 truncate text-right text-xs text-fg-muted md:inline">{t(`issueType.${issue.type}`)}</span>
          <span className="hidden w-32 items-center justify-end gap-2.5 overflow-hidden lg:flex">
            {issue.labels.slice(0, 2).map((label) => (
              <span key={label.id} className="inline-flex min-w-0 items-center gap-1 text-xs text-fg-muted">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                <span className="truncate">{label.name}</span>
              </span>
            ))}
          </span>
          <span className="flex justify-end md:w-40">
            <DueChip dueDate={issue.due_date} status={issue.status} />
          </span>
          <span className="flex md:w-28">
            <PriorityBadge priority={issue.priority} />
          </span>
          {issue.assignee ? (
            <span title={issue.assignee.username} className="inline-flex">
              <Avatar name={issue.assignee.username} src={issue.assignee.avatar} size={22} />
              <span className="sr-only">{issue.assignee.username}</span>
            </span>
          ) : (
            <span
              title={t('common.unassigned')}
              className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-dashed border-border-strong"
            >
              <span className="sr-only">{t('common.unassigned')}</span>
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}

export function IssueList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul aria-label={label} className="stagger divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {children}
    </ul>
  )
}
