import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listIssues } from '../api/issues'
import { PriorityBadge } from '../components/Badge'
import { formInputClass } from '../components/FormField'
import { useWorkspace } from '../features/workspace/WorkspaceContext'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus } from '../types/issue'

export function IssuesPage() {
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('')
  const [mineOnly, setMineOnly] = useState(false)

  const workspaceId = currentWorkspace?.id

  const issuesQuery = useQuery({
    queryKey: ['issues', 'workspace', workspaceId, statusFilter, mineOnly],
    queryFn: () =>
      listIssues(
        { workspace: workspaceId! },
        { status: statusFilter || undefined, assignee: mineOnly ? 'me' : undefined },
      ),
    enabled: workspaceId !== undefined,
  })

  if (isWorkspaceLoading) {
    return <p className="text-sm text-fg-muted">Loading workspace…</p>
  }
  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">No workspace found.</p>
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-fg">Issues</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <select
          className={formInputClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IssueStatus | '')}
        >
          <option value="">All statuses</option>
          {ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-fg-muted">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          Assigned to me
        </label>
      </div>

      {issuesQuery.isLoading && <p className="text-sm text-fg-muted">Loading issues…</p>}
      {issuesQuery.isError && (
        <p className="text-sm text-red-400">Couldn't load issues. Is the backend running?</p>
      )}
      {issuesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">No issues yet.</p>}

      <div className="flex flex-col gap-2">
        {issuesQuery.data?.map((issue) => (
          <Link
            key={issue.id}
            to={`/issues/${issue.id}`}
            className="flex items-center justify-between rounded border border-border bg-bg-elevated px-4 py-3 hover:border-accent"
          >
            <div>
              <div className="text-sm font-medium text-fg">{issue.title}</div>
              <div className="text-xs text-fg-muted">
                {issue.type} · {issue.status.replace('_', ' ')}
                {issue.assignee && ` · ${issue.assignee.username}`}
              </div>
            </div>
            <PriorityBadge priority={issue.priority} />
          </Link>
        ))}
      </div>
    </div>
  )
}
