import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listIssues } from '../api/issues'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { IssueFilterBar } from '../components/IssueFilterBar'
import { IssueList, IssueRow } from '../components/IssueRow'
import { PageSkeleton, SkeletonList } from '../components/Skeleton'
import { button, pageHeader, pageLead, pageTitle } from '../components/ui'
import { useNewIssue } from '../features/issues/newIssueContext'
import { useIssueFilters } from '../features/issues/useIssueFilters'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useT } from '../i18n'
import type { IssueFilters } from '../types/issue'

export function IssuesPage() {
  const t = useT()
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const openNewIssue = useNewIssue()
  const { filters, setFilter, applyFilters, isFiltered } = useIssueFilters()

  const [searchParams] = useSearchParams()
  const wantsNew = searchParams.get('new') === '1'
  useEffect(() => {
    if (wantsNew) openNewIssue(null)
  }, [wantsNew, openNewIssue])

  const workspaceId = currentWorkspace?.id

  const issuesQuery = useQuery({
    queryKey: ['issues', 'workspace', workspaceId, filters],
    queryFn: () => listIssues({ workspace: workspaceId! }, filters as IssueFilters),
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

      <IssueFilterBar
        scope={{ workspace: currentWorkspace.id }}
        workspaceId={currentWorkspace.id}
        filters={filters}
        onFilter={setFilter}
        onApply={applyFilters}
        count={issuesQuery.isSuccess ? issues.length : undefined}
      />

      {issuesQuery.isLoading && <SkeletonList count={4} />}
      {issuesQuery.isError && <p className="text-sm text-danger">{t('issues.loadFailed')}</p>}
      {issuesQuery.isSuccess &&
        issues.length === 0 &&
        (isFiltered ? (
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
          {issues.map((issue, index) => (
            <IssueRow key={issue.id} issue={issue} index={index} />
          ))}
        </IssueList>
      )}
    </div>
  )
}
