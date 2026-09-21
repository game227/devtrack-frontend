import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import type { Issue } from '../types/issue'
import { PriorityBadge } from './Badge'

export function IssueRow({ issue }: { issue: Issue }) {
  const t = useT()
  const meta = [t(`issueType.${issue.type}`), t(`status.${issue.status}`), issue.assignee?.username]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      to={`/issues/${issue.id}`}
      className="flex items-center justify-between gap-3 rounded border border-border bg-bg-elevated px-4 py-3 transition-colors duration-150 hover:border-fg"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 font-mono text-xs text-code">#{issue.id}</span>
          {issue.github_number !== null && (
            <span className="shrink-0 font-mono text-xs text-fg-muted">GH#{issue.github_number}</span>
          )}
          <span className="truncate text-sm font-medium text-fg">{issue.title}</span>
        </div>
        <div className="text-xs text-fg-muted">{meta}</div>
      </div>
      <PriorityBadge priority={issue.priority} />
    </Link>
  )
}
