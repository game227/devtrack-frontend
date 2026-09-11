import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import { listIssues } from '../api/issues'
import { useWorkspace } from '../features/workspace/WorkspaceContext'
import { PriorityBadge, StatusBadge } from '../components/Badge'
import { StatCard } from '../components/StatCard'
import type { Activity } from '../types/activity'
import type { ProjectStatus } from '../types/project'

const PROJECT_STATUSES: ProjectStatus[] = ['planned', 'active', 'paused', 'completed', 'archived']

function activityText(activity: Activity): string {
  switch (activity.verb) {
    case 'created_project':
      return `created project ${activity.target_display}`
    case 'created_issue':
      return `created issue ${activity.target_display}`
    case 'moved_issue':
      return `moved ${activity.target_display} from ${activity.metadata.from} to ${activity.metadata.to}`
    case 'commented':
      return `commented: "${activity.target_display}"`
    default:
      return activity.verb
  }
}

function activityLink(activity: Activity): string | null {
  if (activity.target_type === 'issue') return `/issues/${activity.target_id}`
  if (activity.target_type === 'project') return `/projects/${activity.target_id}`
  return null
}

export function DashboardPage() {
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
    return <p className="text-sm text-fg-muted">Loading workspace…</p>
  }
  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">No workspace found.</p>
  }
  if (dashboardQuery.isLoading) {
    return <p className="text-sm text-fg-muted">Loading dashboard…</p>
  }
  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <p className="text-sm text-red-400">Couldn't load the dashboard. Is the backend running?</p>
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
      <h1 className="mb-4 text-xl font-semibold text-fg">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Projects" value={data.projects.total} />
        <StatCard label="Active projects" value={data.projects.active} />
        <StatCard label="Open issues" value={data.issues.open} />
        <StatCard label="Done issues" value={data.issues.done} />
      </div>

      <div className="mb-6 flex flex-wrap gap-4 rounded border border-border bg-bg-elevated px-4 py-3">
        {PROJECT_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-sm text-fg-muted">{data.projects[status]}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-fg">My open issues</h2>
          {myIssuesQuery.isLoading && <p className="text-sm text-fg-muted">Loading…</p>}
          {myIssuesQuery.isError && <p className="text-sm text-red-400">Couldn't load your issues.</p>}
          {myIssuesQuery.isSuccess && myOpenIssues.length === 0 && (
            <p className="text-sm text-fg-muted">No open issues assigned to you.</p>
          )}
          <div className="flex flex-col gap-2">
            {myOpenIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="flex items-center justify-between rounded border border-border bg-bg-elevated px-4 py-3 hover:border-accent"
              >
                <div>
                  <div className="text-sm font-medium text-fg">{issue.title}</div>
                  <div className="text-xs text-fg-muted">
                    {issue.type} · {issue.status.replace('_', ' ')}
                    {issue.due_date && ` · due ${issue.due_date}`}
                  </div>
                </div>
                <PriorityBadge priority={issue.priority} />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-fg">Upcoming deadlines</h2>
          {data.upcoming_deadlines.length === 0 && (
            <p className="text-sm text-fg-muted">Nothing due in the next 30 days.</p>
          )}
          <div className="flex flex-col gap-2">
            {data.upcoming_deadlines.map((item) => (
              <Link
                key={item.id}
                to={`/issues/${item.id}`}
                className="flex items-center justify-between rounded border border-border bg-bg-elevated px-4 py-3 hover:border-accent"
              >
                <div>
                  <div className="text-sm font-medium text-fg">{item.title}</div>
                  <div className="text-xs text-fg-muted">{item.project.name}</div>
                </div>
                <span className={`text-xs ${item.is_overdue ? 'text-red-400' : 'text-fg-muted'}`}>
                  {item.is_overdue ? 'overdue · ' : 'due '}
                  {item.due_date}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-fg">Project progress</h2>
        {data.project_progress.length === 0 && <p className="text-sm text-fg-muted">No projects yet.</p>}
        <div className="flex flex-col gap-2">
          {data.project_progress.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="rounded border border-border bg-bg-elevated px-4 py-3 hover:border-accent"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-fg">{project.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-fg-muted">{project.progress_percent}%</span>
                  <StatusBadge status={project.status} />
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-accent" style={{ width: `${project.progress_percent}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-fg">Recent activity</h2>
        {data.recent_activity.length === 0 && <p className="text-sm text-fg-muted">No activity yet.</p>}
        <div className="flex flex-col gap-1">
          {data.recent_activity.map((activity) => {
            const href = activityLink(activity)
            const content = (
              <>
                <span className="font-medium text-fg">{activity.actor.username}</span>{' '}
                <span className="text-fg-muted">{activityText(activity)}</span>
              </>
            )
            return (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-bg-elevated"
              >
                {href ? (
                  <Link to={href} className="min-w-0 truncate">
                    {content}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate">{content}</span>
                )}
                <span className="shrink-0 pl-3 text-xs text-fg-muted">{activity.created_at}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
