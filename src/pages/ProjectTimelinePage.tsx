import { Link, useParams } from 'react-router-dom'
import { PageSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { useInfiniteQuery } from '@tanstack/react-query'
import { listProjectTimelinePage } from '../api/activities'
import { Avatar } from '../components/Avatar'
import { activityLink, describeActivity } from '../features/activity/activityText'
import { useI18n } from '../i18n'
import type { Activity } from '../types/activity'
import { button, pageTitle } from '../components/ui'
import { STATUS_COLOR } from '../lib/statusColors'
import type { IssueStatus } from '../types/issue'

// The event's dot: a move takes the colour of the station it went to, a merge the merged colour.
function dotColor(activity: Activity): string {
  const to = activity.metadata.to
  if (activity.verb === 'moved_issue' && typeof to === 'string' && to in STATUS_COLOR) return STATUS_COLOR[to as IssueStatus]
  if (activity.verb === 'pr_merged') return 'var(--color-merged)'
  return 'var(--color-border-strong)'
}

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
    return <PageSkeleton rows={5} />
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
    <div>
      <h1 className={`mb-6 ${pageTitle}`}>{t('timeline.title')}</h1>

      {activities.length === 0 && (
        <EmptyState icon="timeline" title={t('empty.timeline.title')} description={t('empty.timeline.desc')} />
      )}

      {/* One vertical line: each day is a station, each event a stop on the way (time on the left). */}
      {days.length > 0 && (
        <div className="relative max-w-4xl">
          <span aria-hidden="true" className="absolute bottom-2 left-[86px] top-3 w-[3px] rounded-full bg-border" />
          {days.map(({ day, items }) => (
            <section key={day} className="relative pb-6 last:pb-0">
              <h2 className="flex items-center gap-3 py-1.5">
                <span className="w-16 shrink-0" />
                <span aria-hidden="true" className="flex w-[22px] shrink-0 justify-center">
                  <span className="block h-4 w-4 rounded-full bg-brand ring-4 ring-bg" />
                </span>
                <span className="text-[15px] font-bold text-fg">{day}</span>
              </h2>
              <ul>
                {items.map((activity) => {
                  const href = activityLink(activity)
                  const content = (
                    <>
                      <span className="font-bold text-fg">{activity.actor.username}</span>{' '}
                      <span className="text-fg-muted">{describeActivity(activity, t)}</span>
                    </>
                  )
                  return (
                    <li key={activity.id} className="flex items-start gap-3 py-2 text-sm">
                      <span className="w-16 shrink-0 pt-0.5 text-right text-xs text-fg-muted tabular">{formatTime(activity.created_at)}</span>
                      <span aria-hidden="true" className="flex w-[22px] shrink-0 justify-center pt-1">
                        <span className="block h-2.5 w-2.5 rounded-full ring-4 ring-bg" style={{ backgroundColor: dotColor(activity) }} />
                      </span>
                      <span className="flex min-w-0 flex-1 items-start gap-2">
                        <Avatar name={activity.actor.username} src={activity.actor.avatar} size={20} />
                        {href ? (
                          <Link to={href} className="min-w-0 hover:underline">
                            {content}
                          </Link>
                        ) : (
                          <span className="min-w-0">{content}</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {timelineQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => void timelineQuery.fetchNextPage()}
          disabled={timelineQuery.isFetchingNextPage}
          className={`mt-6 ${button('secondary')}`}
        >
          {timelineQuery.isFetchingNextPage ? t('common.loading') : t('timeline.loadMore')}
        </button>
      )}
    </div>
  )
}
