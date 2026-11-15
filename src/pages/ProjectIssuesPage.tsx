import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listIssues } from '../api/issues'
import { EmptyState } from '../components/EmptyState'
import { formInputClass } from '../components/FormField'
import { Icon } from '../components/Icon'
import { IssueList, IssueRow } from '../components/IssueRow'
import { SkeletonList } from '../components/Skeleton'
import { button, pageHeader, pageTitle } from '../components/ui'
import { useNewIssue } from '../features/issues/newIssueContext'
import { useI18n } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus, IssueType } from '../types/issue'

const TYPES: IssueType[] = ['task', 'bug', 'feature', 'improvement', 'chore']

export function ProjectIssuesPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const openNewIssue = useNewIssue()

  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<IssueType | ''>('')
  const [mineOnly, setMineOnly] = useState(false)

  // `?new=1` (the "New issue" links) lands here with the new-issue dialog open for this project.
  const [searchParams] = useSearchParams()
  const wantsNew = searchParams.get('new') === '1'
  useEffect(() => {
    if (wantsNew && Number.isFinite(projectId)) openNewIssue(projectId)
  }, [wantsNew, projectId, openNewIssue])

  const issuesQuery = useQuery({
    queryKey: ['issues', projectId, statusFilter, typeFilter, mineOnly],
    queryFn: () =>
      listIssues(
        { project: projectId },
        {
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          assignee: mineOnly ? 'me' : undefined,
        },
      ),
    enabled: Number.isFinite(projectId),
  })

  const filtered = Boolean(statusFilter || typeFilter || mineOnly)
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
        <select
          aria-label={t('issues.filterType')}
          className={`${formInputClass} mt-0! w-auto!`}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as IssueType | '')}
        >
          <option value="">{t('issues.allTypes')}</option>
          {TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`issueType.${value}`)}
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
        (filtered ? (
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
