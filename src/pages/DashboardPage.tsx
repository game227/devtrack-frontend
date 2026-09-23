import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import { listIssues } from '../api/issues'
import { activityLink, describeActivity } from '../features/activity/activityText'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useI18n } from '../i18n'
import { PriorityBadge, StatusBadge } from '../components/Badge'
import { StatCard } from '../components/StatCard'
import { Skeleton } from '../components/Skeleton'
import type { ProjectStatus } from '../types/project'

const PROJECT_STATUSES: ProjectStatus[] = ['planned', 'active', 'paused', 'completed', 'archived']

export function DashboardPage() {
  const { t, formatDate, formatDateTime } = useI18n()
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const workspaceId = currentWorkspace?.id

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', workspaceId],
    queryFn: () => getDashboard(workspaceId!),
    enabled: workspaceId !== undefined,
  })

  const myIssuesQuery = useQuery({
    queryKey: ['issues', 'workspace', workspaceId, 'mine'],
    queryFn: () => listIssues({ workspace: workspaceId! }, { assignee: 'me' }),
    enabled: workspaceId !== undefined,
  })

  if (isWorkspaceLoading) {
    return <p className="text-sm text-fg-muted">{t('common.loadingWorkspace')}</p>
  }
  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">{t('common.noWorkspace')}</p>
  }
  if (dashboardQuery.isLoading) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-semibold text-fg">{t('dashboard.title')}</h1>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="mb-6 h-11" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <p className="text-sm text-danger">{t('dashboard.loadFailed')}</p>
  }

  const data = dashboardQuery.data
  const myOpenIssues = (myIssuesQuery.data ?? [])
    .filter((issue) => issue.status !== 'done')
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-fg">{t('dashboard.title')}</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('dashboard.statProjects')} value={data.projects.total} />
        <StatCard label={t('dashboard.statActiveProjects')} value={data.projects.active} />
        <StatCard label={t('dashboard.statOpenIssues')} value={data.issues.open} />
        <StatCard label={t('dashboard.statDoneIssues')} value={data.issues.done} />
      </div>

      <div className="mb-6 flex flex-wrap gap-4 rounded-2xl border border-border bg-bg-elevated px-4 py-3">
        {PROJECT_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-sm text-fg-muted">{data.projects[status]}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-fg">{t('dashboard.myOpenIssues')}</h2>
          {myIssuesQuery.isLoading && <p className="text-sm text-fg-muted">{t('common.loading')}</p>}
          {myIssuesQuery.isError && <p className="text-sm text-danger">{t('dashboard.myIssuesFailed')}</p>}
          {myIssuesQuery.isSuccess && myOpenIssues.length === 0 && (
            <p className="text-sm text-fg-muted">{t('dashboard.noMyIssues')}</p>
          )}
          <div className="flex flex-col gap-2">
            {myOpenIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-bg-elevated px-4 py-3 transition-colors duration-150 hover:border-fg"
              >
                <div>
                  <div className="text-sm font-medium text-fg">{issue.title}</div>
                  <div className="text-xs text-fg-muted">
                    {issue.due_date
                      ? t('dashboard.issueMetaDue', {
                          type: t(`issueType.${issue.type}`),
                          status: t(`status.${issue.status}`),
                          date: formatDate(issue.due_date),
                        })
                      : t('dashboard.issueMeta', {
                          type: t(`issueType.${issue.type}`),
                          status: t(`status.${issue.status}`),
                        })}
                  </div>
                </div>
                <PriorityBadge priority={issue.priority} />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-fg">{t('dashboard.upcomingDeadlines')}</h2>
          {data.upcoming_deadlines.length === 0 && (
            <p className="text-sm text-fg-muted">{t('dashboard.noDeadlines')}</p>
          )}
          <div className="flex flex-col gap-2">
            {data.upcoming_deadlines.map((item) => (
              <Link
                key={item.id}
                to={`/issues/${item.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-bg-elevated px-4 py-3 transition-colors duration-150 hover:border-fg"
              >
                <div>
                  <div className="text-sm font-medium text-fg">{item.title}</div>
                  <div className="text-xs text-fg-muted">{item.project.name}</div>
                </div>
                <span className={`text-xs ${item.is_overdue ? 'text-danger' : 'text-fg-muted'}`}>
                  {t(item.is_overdue ? 'dashboard.overdue' : 'dashboard.due', { date: formatDate(item.due_date) })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-fg">{t('dashboard.projectProgress')}</h2>
        {data.project_progress.length === 0 && <p className="text-sm text-fg-muted">{t('dashboard.noProjects')}</p>}
        <div className="flex flex-col gap-2">
          {data.project_progress.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="rounded-2xl border border-border bg-bg-elevated px-4 py-3 transition-colors duration-150 hover:border-fg"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-fg">{project.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-fg-muted">{project.progress_percent}%</span>
                  <StatusBadge status={project.status} />
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-fg" style={{ width: `${project.progress_percent}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-fg">{t('dashboard.recentActivity')}</h2>
        {data.recent_activity.length === 0 && <p className="text-sm text-fg-muted">{t('dashboard.noActivity')}</p>}
        <div className="flex flex-col gap-1">
          {data.recent_activity.map((activity) => {
            const href = activityLink(activity)
            const content = (
              <>
                <span className="font-medium text-fg">{activity.actor.username}</span>{' '}
                <span className="text-fg-muted">{describeActivity(activity, t)}</span>
              </>
            )
            return (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-bg-elevated"
              >
                {href ? (
                  <Link to={href} className="min-w-0 truncate">
                    {content}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate">{content}</span>
                )}
                <span className="shrink-0 pl-3 text-xs text-fg-muted">{formatDateTime(activity.created_at)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
