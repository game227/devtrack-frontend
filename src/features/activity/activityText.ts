import type { TranslateParams } from '../../i18n/core'
import type { Activity } from '../../types/activity'

type T = (key: string, params?: TranslateParams) => string

function statusLabel(t: T, value: unknown): string {
  const key = `status.${String(value)}`
  const label = t(key)
  return label === key ? String(value) : label
}

// One sentence per activity, without the actor ("<actor> " is rendered separately).
export function describeActivity(activity: Activity, t: T): string {
  const target = activity.target_display ?? ''
  switch (activity.verb) {
    case 'created_project':
      return t('activity.created_project', { target })
    case 'created_issue':
      return t('activity.created_issue', { target })
    case 'moved_issue':
      return t('activity.moved_issue', {
        target,
        from: statusLabel(t, activity.metadata.from),
        to: statusLabel(t, activity.metadata.to),
      })
    case 'commented':
      return t('activity.commented', { target })
    case 'pr_merged':
      return t('activity.pr_merged', {
        target,
        pr: String(activity.metadata.pr_number ?? ''),
        to: statusLabel(t, activity.metadata.to),
      })
    default:
      return activity.verb
  }
}

export function activityLink(activity: Activity): string | null {
  if (activity.target_type === 'issue') return `/issues/${activity.target_id}`
  if (activity.target_type === 'project') return `/projects/${activity.target_id}`
  return null
}
