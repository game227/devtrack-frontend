import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listIssues } from '../api/issues'
import { listProjects } from '../api/projects'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { BulkBar } from '../components/BulkBar'
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
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const toggle = (id: number, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

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

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId!),
    enabled: workspaceId !== undefined,
  })

  if (isWorkspaceLoading) {
    return <PageSkeleton rows={4} />
  }
  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">{t('common.noWorkspace')}</p>
  }

  // Open work first, finished work after it (each in the server's order).
  const issues = [...(issuesQuery.data ?? [])].sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
  const projectNames = new Map((projectsQuery.data ?? []).map((project) => [project.id, project.name]))

  return (
    <div>
      <div className={pageHeader}>
        <div>
          <h1 className={pageTitle}>{t('issues.title')}</h1>
          <p className={pageLead}>{t('issues.workspaceLead', { workspace: currentWorkspace.name })}</p>
        </div>
        {/* On phones the bottom bar's "+" does this. */}
        <button type="button" onClick={() => openNewIssue(null)} className={`${button('primary')} max-md:hidden`}>
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
            <IssueRow key={issue.id} issue={issue} index={index} projectName={projectNames.get(issue.project)} selected={selected.has(issue.id)} onSelect={toggle} />
          ))}
        </IssueList>
      )}

      {selected.size > 0 && (
        <BulkBar
          ids={[...selected]}
          allSelected={selected.size === issues.length}
          onAll={() => setSelected(new Set(issues.map((issue) => issue.id)))}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  )
}
