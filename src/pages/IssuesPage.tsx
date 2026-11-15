import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listIssues } from '../api/issues'
import { EmptyState } from '../components/EmptyState'
import { formInputClass } from '../components/FormField'
import { Icon } from '../components/Icon'
import { IssueList, IssueRow } from '../components/IssueRow'
import { PageSkeleton, SkeletonList } from '../components/Skeleton'
import { button, pageHeader, pageLead, pageTitle } from '../components/ui'
import { useNewIssue } from '../features/issues/newIssueContext'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useT } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus } from '../types/issue'

export function IssuesPage() {
  const t = useT()
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const openNewIssue = useNewIssue()
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('')
  const [mineOnly, setMineOnly] = useState(false)

  const [searchParams] = useSearchParams()
  const wantsNew = searchParams.get('new') === '1'
  useEffect(() => {
    if (wantsNew) openNewIssue(null)
  }, [wantsNew, openNewIssue])

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
    return <PageSkeleton rows={4} />
  }
  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">{t('common.noWorkspace')}</p>
  }

  const issues = issuesQuery.data ?? []

  return (
    <div>
      <div className={pageHeader}>
        <div>
          <h1 className={pageTitle}>{t('issues.title')}</h1>
          <p className={pageLead}>{t('issues.workspaceLead', { workspace: currentWorkspace.name })}</p>
        </div>
        <button type="button" onClick={() => openNewIssue(null)} className={button('primary')}>
          <Icon name="plus" />
          {t('issues.new')}
        </button>
      </div>

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
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 font-semibold text-fg-muted hover:text-fg">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          {t('issues.assignedToMe')}
        </label>
        {issuesQuery.isSuccess && <span className="ml-auto text-sm text-fg-muted tabular">{t('issues.count', { count: issues.length })}</span>}
      </div>

      {issuesQuery.isLoading && <SkeletonList count={4} />}
      {issuesQuery.isError && <p className="text-sm text-danger">{t('issues.loadFailed')}</p>}
      {issuesQuery.isSuccess &&
        issues.length === 0 &&
        (statusFilter || mineOnly ? (
          <p className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-sm text-fg-muted">{t('issues.empty')}</p>
        ) : (
          <EmptyState
            icon="issues"
            title={t('empty.issues.title')}
            description={t('empty.issuesWorkspace.desc')}
            action={{ label: t('empty.issuesWorkspace.action'), onClick: () => openNewIssue(null) }}
          />
        ))}

      {issues.length > 0 && (
        <IssueList label={t('issues.title')}>
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </IssueList>
      )}
    </div>
  )
}
