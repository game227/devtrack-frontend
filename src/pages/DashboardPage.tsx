import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import { listIssues } from '../api/issues'
import { activityLink, describeActivity } from '../features/activity/activityText'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useI18n } from '../i18n'
import { StatusBadge } from '../components/Badge'
import { DueChip } from '../components/DueChip'
import { EmptyState } from '../components/EmptyState'
import { IssueList, IssueRow } from '../components/IssueRow'
import { PendingInvitations } from '../components/PendingInvitations'
import { Skeleton, SkeletonList } from '../components/Skeleton'
import { TrackProgress } from '../components/Track'
import { pageHeader, pageLead, pageTitle, sectionTitle, textLink } from '../components/ui'
import { useAuth } from '../features/auth/authContext'
import { dueState } from '../lib/dueDate'
import { sortByUrgency } from '../lib/issueOrder'
import { STATUS_COLOR } from '../lib/statusColors'
import { ISSUE_STATUSES } from '../types/issue'
import type { Issue, IssueStatus } from '../types/issue'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Your issues as the line itself: how many sit at each station, and a station is also a filter for
// the list underneath. Done counts what you finished in the last seven days.
function MyLine({
  counts,
  selected,
  onSelect,
}: {
  counts: Record<IssueStatus, number>
  selected: IssueStatus | null
  onSelect: (station: IssueStatus | null) => void
}) {
  const { t } = useI18n()
  return (
    <div className="scroll-quiet -mx-1 overflow-x-auto px-1 pb-1">
      <ol className="relative grid min-w-[340px] grid-cols-5">
        <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-[47px] h-[3px] rounded-full bg-border" />
        {ISSUE_STATUSES.map((station) => {
          const pressed = selected === station
          const label = station === 'done' ? t('dashboard.doneThisWeek') : t(`status.${station}`)
          return (
            <li key={station} className="relative flex justify-center">
              <button
                type="button"
                aria-pressed={pressed}
                aria-label={`${label}, ${counts[station]}`}
                onClick={() => onSelect(pressed ? null : station)}
                className={`group flex w-full flex-col items-center rounded-lg px-1 pb-2 pt-1 transition-colors duration-150 ${
                  pressed ? 'bg-brand-soft' : 'hover:bg-well'
                }`}
              >
                <span className={`h-9 text-[28px] font-extrabold leading-9 tabular ${counts[station] ? 'text-fg' : 'text-subtle'}`}>
                  {counts[station]}
                </span>
                <span aria-hidden="true" className="flex h-6 items-center">
                  <span
                    className={`block rounded-full ring-4 transition-transform duration-150 ${pressed ? 'h-4 w-4 ring-brand-soft' : 'h-3 w-3 ring-bg group-hover:ring-well'}`}
                    style={{ backgroundColor: STATUS_COLOR[station] }}
                  />
                </span>
                <span className={`mt-1 text-center text-xs leading-tight ${pressed ? 'font-bold text-fg' : 'text-fg-muted'}`}>{label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function DashboardPage() {
  const { t, formatDateTime } = useI18n()
  const { user } = useAuth()
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const workspaceId = currentWorkspace?.id
  const [station, setStation] = useState<IssueStatus | null>(null)
  // "The last seven days" is measured from when the page opened, so it does not shift between renders.
  const [openedAt] = useState(() => Date.now())

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

  const header = (
    <div className={pageHeader}>
      <div>
        <h1 className={pageTitle}>{t('dashboard.title')}</h1>
        {user && <p className={pageLead}>{t('dashboard.greeting', { name: user.username })}</p>}
      </div>
    </div>
  )

  if (isWorkspaceLoading || (workspaceId !== undefined && dashboardQuery.isLoading)) {
    return (
      <div role="status" aria-busy="true">
        {header}
        <Skeleton className="mb-6 h-24" />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <SkeletonList count={5} />
          <SkeletonList count={4} className="h-16" />
        </div>
      </div>
    )
  }
  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">{t('common.noWorkspace')}</p>
  }
  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div>
        {header}
        <p className="text-sm text-danger">{t('dashboard.loadFailed')}</p>
      </div>
    )
  }

  const data = dashboardQuery.data
  const mine = myIssuesQuery.data ?? []
  const open = mine.filter((issue) => issue.status !== 'done')
  const recentlyDone = mine
    .filter((issue) => issue.status === 'done' && issue.completed_at && openedAt - new Date(issue.completed_at).getTime() < WEEK_MS)
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
  const counts = Object.fromEntries(
    ISSUE_STATUSES.map((status) => [status, status === 'done' ? recentlyDone.length : open.filter((i) => i.status === status).length]),
  ) as Record<IssueStatus, number>
  const overdueCount = open.filter((i) => dueState(i.due_date, i.status) === 'overdue').length
  const dueSoonCount = open.filter((i) => dueState(i.due_date, i.status) === 'soon').length

  let shown: Issue[]
  if (station === 'done') shown = recentlyDone
  else shown = sortByUrgency(station === null ? open : open.filter((i) => i.status === station))

  return (
    <div>
      {header}
      <PendingInvitations />

      {data.projects.total === 0 && (
        <EmptyState
          className="mb-8"
          icon="projects"
          title={t('empty.projects.title')}
          description={t('empty.projects.desc')}
          action={{ label: t('empty.projects.action'), to: '/projects?new=1' }}
        />
      )}

      <div className="grid gap-x-10 gap-y-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="my-issues">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="my-issues" className={sectionTitle}>
                {t('dashboard.myOpenIssues')}
              </h2>
              <Link to="/issues" className={`text-sm ${textLink}`}>
                {t('dashboard.allIssues')}
              </Link>
            </div>
            <MyLine counts={counts} selected={station} onSelect={setStation} />
            <div className="mb-3 mt-4 flex flex-wrap items-center gap-2 text-sm">
              {overdueCount > 0 && (
                <span className="inline-flex h-6 items-center rounded-full border border-danger/40 bg-danger/10 px-2.5 text-xs font-bold text-danger">
                  {t('dashboard.overdueCount', { count: overdueCount })}
                </span>
              )}
              {dueSoonCount > 0 && (
                <span className="inline-flex h-6 items-center rounded-full border border-warning/40 bg-warning/10 px-2.5 text-xs font-bold text-warning">
                  {t('dashboard.dueSoonCount', { count: dueSoonCount })}
                </span>
              )}
              {station !== null && (
                <button type="button" onClick={() => setStation(null)} className={`ml-auto text-sm ${textLink}`}>
                  {t('dashboard.showAllOpen')}
                </button>
              )}
            </div>
            {myIssuesQuery.isLoading && <SkeletonList count={3} />}
            {myIssuesQuery.isError && <p className="text-sm text-danger">{t('dashboard.myIssuesFailed')}</p>}
            {myIssuesQuery.isSuccess && shown.length === 0 && station === null && (
              <EmptyState icon="check" title={t('dashboard.allClearTitle')} description={t('dashboard.noMyIssues')} />
            )}
            {myIssuesQuery.isSuccess && shown.length === 0 && station !== null && (
              <p className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-sm text-fg-muted">{t('dashboard.stationEmpty')}</p>
            )}
            {shown.length > 0 && (
              <IssueList label={t('dashboard.myOpenIssues')}>
                {shown.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </IssueList>
            )}
          </section>

          <section aria-labelledby="recent-activity">
            <h2 id="recent-activity" className={`mb-4 ${sectionTitle}`}>
              {t('dashboard.recentActivity')}
            </h2>
            {data.recent_activity.length === 0 && <p className="text-sm text-fg-muted">{t('dashboard.noActivity')}</p>}
            {data.recent_activity.length > 0 && (
              <ol className="relative ml-1 border-l-2 border-border">
                {data.recent_activity.map((activity) => {
                  const href = activityLink(activity)
                  const content = (
                    <>
                      <span className="font-bold text-fg">{activity.actor.username}</span>{' '}
                      <span className="text-fg-muted">{describeActivity(activity, t)}</span>
                    </>
                  )
                  return (
                    <li key={activity.id} className="relative pb-4 pl-5 last:pb-0">
                      <span aria-hidden="true" className="absolute -left-[6px] top-[7px] h-2.5 w-2.5 rounded-full bg-border-strong ring-4 ring-bg" />
                      <p className="text-sm">
                        {href ? (
                          <Link to={href} className="hover:underline">
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-muted">{formatDateTime(activity.created_at)}</p>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-10">
          <section aria-labelledby="deadlines">
            <h2 id="deadlines" className={`mb-3 ${sectionTitle}`}>
              {t('dashboard.upcomingDeadlines')}
            </h2>
            {data.upcoming_deadlines.length === 0 && <p className="text-sm text-fg-muted">{t('dashboard.noDeadlines')}</p>}
            {data.upcoming_deadlines.length > 0 && (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {data.upcoming_deadlines.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <Link to={`/issues/${item.id}`} className="block px-4 py-3 transition-colors duration-150 hover:bg-well">
                      <span className="block truncate text-sm font-semibold text-fg">{item.title}</span>
                      <span className="mt-1 flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-xs text-fg-muted">{item.project.name}</span>
                        <DueChip dueDate={item.due_date} status="todo" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="project-progress">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="project-progress" className={sectionTitle}>
                {t('dashboard.projectProgress')}
              </h2>
              <Link to="/projects" className={`text-sm ${textLink}`}>
                {t('nav.projects')}
              </Link>
            </div>
            {data.project_progress.length === 0 && <p className="text-sm text-fg-muted">{t('dashboard.noProjects')}</p>}
            <ul className="space-y-4">
              {data.project_progress.map((project) => (
                <li key={project.id}>
                  <Link to={`/projects/${project.id}`} className="group block">
                    <span className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-fg group-hover:underline">{project.name}</span>
                      <span className="shrink-0 text-xs font-bold text-fg-muted tabular">{project.progress_percent}%</span>
                    </span>
                    <TrackProgress percent={project.progress_percent} label={project.name} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="workspace-figures">
            <h2 id="workspace-figures" className={`mb-3 ${sectionTitle}`}>
              {t('dashboard.workspaceOverview')}
            </h2>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
              {(
                [
                  ['statProjects', data.projects.total],
                  ['statActiveProjects', data.projects.active],
                  ['statOpenIssues', data.issues.open],
                  ['statDoneIssues', data.issues.done],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className="bg-surface px-4 py-3">
                  <dt className="text-xs text-fg-muted">{t(`dashboard.${key}`)}</dt>
                  <dd className="mt-0.5 text-xl font-extrabold text-fg tabular">{value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {(['planned', 'active', 'paused', 'completed', 'archived'] as const)
                .filter((status) => data.projects[status] > 0)
                .map((status) => (
                  <li key={status} className="flex items-center gap-1.5">
                    <StatusBadge status={status} />
                    <span className="text-xs font-bold text-fg-muted tabular">{data.projects[status]}</span>
                  </li>
                ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
