import { Link, useParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { listProjectTimelinePage } from '../api/activities'
import { Avatar } from '../components/Avatar'
import { activityLink, describeActivity } from '../features/activity/activityText'
import { useI18n } from '../i18n'
import type { Activity } from '../types/activity'

export function ProjectTimelinePage() {
  const { t, formatDate, formatTime } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  const timelineQuery = useInfiniteQuery({
    queryKey: ['project-timeline', projectId],
    queryFn: ({ pageParam }) => listProjectTimelinePage(projectId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => (lastPage.hasNext ? lastPageParam + 1 : undefined),
    enabled: Number.isFinite(projectId),
  })

  if (timelineQuery.isLoading) {
    return <p className="text-sm text-fg-muted">{t('timeline.loading')}</p>
  }
  if (timelineQuery.isError) {
    return <p className="text-sm text-danger">{t('timeline.loadFailed')}</p>
  }

  const activities = timelineQuery.data?.pages.flatMap((page) => page.results) ?? []

  // The API returns newest first; keep that order and start a new heading whenever the day changes.
  const days: { day: string; items: Activity[] }[] = []
  for (const activity of activities) {
    const day = formatDate(activity.created_at)
    const last = days[days.length - 1]
    if (last && last.day === day) last.items.push(activity)
    else days.push({ day, items: [activity] })
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-fg">{t('timeline.title')}</h1>

      {activities.length === 0 && <p className="text-sm text-fg-muted">{t('timeline.empty')}</p>}

      {days.map(({ day, items }) => (
        <section key={day}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">{day}</h2>
          <ul className="flex flex-col gap-2">
            {items.map((activity) => {
              const href = activityLink(activity)
              const content = (
                <>
                  <span className="font-medium text-fg">{activity.actor.username}</span>{' '}
                  <span className="text-fg-muted">{describeActivity(activity, t)}</span>
                </>
              )
              return (
                <li
                  key={activity.id}
                  className="flex items-center justify-between gap-3 rounded border border-border bg-bg-elevated px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={activity.actor.username} src={activity.actor.avatar} size={20} />
                    {href ? (
                      <Link to={href} className="truncate hover:text-accent">
                        {content}
                      </Link>
                    ) : (
                      <span className="truncate">{content}</span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-fg-muted">{formatTime(activity.created_at)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {timelineQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => void timelineQuery.fetchNextPage()}
          disabled={timelineQuery.isFetchingNextPage}
          className="self-start rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-fg disabled:opacity-50"
        >
          {timelineQuery.isFetchingNextPage ? t('common.loading') : t('timeline.loadMore')}
        </button>
      )}
    </div>
  )
}
