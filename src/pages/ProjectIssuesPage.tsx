import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listIssues } from '../api/issues'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { IssueFilterBar } from '../components/IssueFilterBar'
import { IssueList, IssueRow } from '../components/IssueRow'
import { SkeletonList } from '../components/Skeleton'
import { button, pageHeader, pageTitle } from '../components/ui'
import { useNewIssue } from '../features/issues/newIssueContext'
import { useIssueFilters } from '../features/issues/useIssueFilters'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useI18n } from '../i18n'
import type { IssueFilters } from '../types/issue'

export function ProjectIssuesPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const openNewIssue = useNewIssue()
  const { currentWorkspace } = useWorkspace()
  const { filters, setFilter, applyFilters, isFiltered } = useIssueFilters()

  // `?new=1` (the "New issue" links) lands here with the new-issue dialog open for this project.
  const [searchParams] = useSearchParams()
  const wantsNew = searchParams.get('new') === '1'
  useEffect(() => {
    if (wantsNew && Number.isFinite(projectId)) openNewIssue(projectId)
  }, [wantsNew, projectId, openNewIssue])

  const issuesQuery = useQuery({
    queryKey: ['issues', projectId, filters],
    queryFn: () => listIssues({ project: projectId }, filters as IssueFilters),
    enabled: Number.isFinite(projectId),
  })

  const issues = issuesQuery.data ?? []

  return (
    <div>
      <div className={pageHeader}>
        <h1 className={pageTitle}>{t('issues.title')}</h1>
        <div className="flex items-center gap-2">
          <Link to={`/projects/${projectId}/board`} className={button('secondary')}>
            {t('nav.board')}
          </Link>
          <button type="button" onClick={() => openNewIssue(projectId)} className={button('primary')}>
            <Icon name="plus" />
            {t('issues.new')}
          </button>
        </div>
      </div>

      {currentWorkspace && Number.isFinite(projectId) && (
        <IssueFilterBar
          scope={{ project: projectId }}
          workspaceId={currentWorkspace.id}
          filters={filters}
          onFilter={setFilter}
          onApply={applyFilters}
          count={issuesQuery.isSuccess ? issues.length : undefined}
        />
      )}

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
            description={t('empty.issues.desc')}
            action={{ label: t('empty.issues.action'), onClick: () => openNewIssue(projectId) }}
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
