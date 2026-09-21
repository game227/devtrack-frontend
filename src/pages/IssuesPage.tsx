import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listIssues } from '../api/issues'
import { formInputClass } from '../components/FormField'
import { IssueRow } from '../components/IssueRow'
import { Skeleton } from '../components/Skeleton'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useT } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus } from '../types/issue'

export function IssuesPage() {
  const t = useT()
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
    return <p className="text-sm text-fg-muted">{t('common.loadingWorkspace')}</p>
  }
  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">{t('common.noWorkspace')}</p>
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-fg">{t('issues.title')}</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <select
          aria-label={t('issues.filterStatus')}
          className={`${formInputClass} mt-0! w-auto!`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IssueStatus | '')}
        >
          <option value="">{t('issues.allStatuses')}</option>
          {ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-fg-muted">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          {t('issues.assignedToMe')}
        </label>
      </div>

      {issuesQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}
      {issuesQuery.isError && <p className="text-sm text-danger">{t('issues.loadFailed')}</p>}
      {issuesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">{t('issues.empty')}</p>}

      <div className="flex flex-col gap-2">
        {issuesQuery.data?.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
      </div>
    </div>
  )
}
