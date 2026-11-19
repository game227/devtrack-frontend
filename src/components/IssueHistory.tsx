import { useQuery } from '@tanstack/react-query'
import { issueHistory } from '../api/issueTools'
import { changeLine } from '../features/activity/activityText'
import type { FieldChange } from '../features/activity/activityText'
import { useI18n } from '../i18n'
import type { Activity } from '../types/activity'
import { Avatar } from './Avatar'

function statusName(t: (key: string) => string, value: unknown) {
  return t(`status.${String(value)}`)
}

// Everything that happened to one issue, newest first: who created it, moved it, changed what (from →
// to) and commented.
export function IssueHistory({ issueId }: { issueId: number }) {
  const { t, formatDate, formatDateTime } = useI18n()
  const query = useQuery({ queryKey: ['issue-history', issueId], queryFn: () => issueHistory(issueId) })

  if (query.isLoading) return <p className="text-sm text-fg-muted">{t('common.loading')}</p>
  if (query.isError) return <p className="text-sm text-danger">{t('history.failed')}</p>
  const rows = query.data ?? []
  if (rows.length === 0) return <p className="text-sm text-fg-muted">{t('history.empty')}</p>

  function lines(activity: Activity): string[] {
    switch (activity.verb) {
      case 'created_issue':
        return [t('history.created')]
      case 'moved_issue':
        return [t('history.moved', { from: statusName(t, activity.metadata.from), to: statusName(t, activity.metadata.to) })]
      case 'changed_issue':
        return ((activity.metadata.changes as FieldChange[] | undefined) ?? []).map((change) => changeLine(t, change, formatDate))
      case 'commented':
        return [t('history.commented', { text: activity.target_display ?? '' })]
      case 'pr_merged':
        return [t('history.merged', { pr: String(activity.metadata.pr_number ?? ''), to: statusName(t, activity.metadata.to) })]
      default:
        return [activity.verb]
    }
  }

  return (
    <ol className="relative ml-1 border-l-2 border-border">
      {rows.map((activity) => (
        <li key={activity.id} className="relative pb-4 pl-5 last:pb-0">
          <span aria-hidden="true" className="absolute -left-[6px] top-[7px] h-2.5 w-2.5 rounded-full bg-border-strong ring-4 ring-bg" />
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
              <Avatar name={activity.actor.username} src={activity.actor.avatar} size={18} />
              {activity.actor.username}
            </span>
            <time dateTime={activity.created_at} className="text-xs text-fg-muted">
              {formatDateTime(activity.created_at)}
            </time>
          </div>
          <ul className="mt-0.5 text-sm text-fg-muted">
            {lines(activity).map((line, index) => (
              <li key={index} className="break-words">
                {line}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
