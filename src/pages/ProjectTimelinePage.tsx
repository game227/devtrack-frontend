import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listProjectTimeline } from '../api/activities'
import type { Activity } from '../types/activity'

function activityText(activity: Activity): string {
  switch (activity.verb) {
    case 'created_project':
      return 'created the project'
    case 'created_issue':
      return `created "${activity.target_display}"`
    case 'moved_issue': {
      const from = String(activity.metadata.from ?? '').replace('_', ' ')
      const to = String(activity.metadata.to ?? '').replace('_', ' ')
      return `moved "${activity.target_display}" from ${from} to ${to}`
    }
    case 'commented':
      return `commented: "${activity.target_display}"`
    case 'pr_merged':
      return `merged a pull request that closed "${activity.target_display}"`
    default:
      return activity.verb
  }
}

function activityLink(activity: Activity): string | null {
  if (activity.target_type === 'issue') return `/issues/${activity.target_id}`
  if (activity.target_type === 'project') return `/projects/${activity.target_id}`
  return null
}

export function ProjectTimelinePage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  const timelineQuery = useQuery({
    queryKey: ['project-timeline', projectId],
    queryFn: () => listProjectTimeline(projectId),
    enabled: Number.isFinite(projectId),
  })

  if (timelineQuery.isLoading) {
    return <p className="text-sm text-fg-muted">Loading timeline…</p>
  }
  if (timelineQuery.isError) {
    return <p className="text-sm text-red-400">Couldn't load the timeline.</p>
  }

  const activities = timelineQuery.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-fg">Timeline</h1>

      {activities.length === 0 && <p className="text-sm text-fg-muted">No activity yet.</p>}

      <ul className="flex flex-col gap-2">
        {activities.map((activity) => {
          const href = activityLink(activity)
          const content = (
            <>
              <span className="font-medium text-fg">{activity.actor.username}</span>{' '}
              <span className="text-fg-muted">{activityText(activity)}</span>
            </>
          )
          return (
            <li
              key={activity.id}
              className="flex items-center justify-between gap-3 rounded border border-border bg-bg-elevated px-3 py-2 text-sm"
            >
              {href ? (
                <Link to={href} className="hover:text-accent">
                  {content}
                </Link>
              ) : (
                <span>{content}</span>
              )}
              <span className="shrink-0 text-xs text-fg-muted">
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
