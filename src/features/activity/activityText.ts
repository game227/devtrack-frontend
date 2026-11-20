import type { TranslateParams } from '../../i18n/core'
import type { Activity } from '../../types/activity'

type T = (key: string, params?: TranslateParams) => string

function statusLabel(t: T, value: unknown): string {
  const key = `status.${String(value)}`
  const label = t(key)
  return label === key ? String(value) : label
}

function roleLabel(t: T, value: unknown): string {
  const key = `members.role.${String(value)}`
  const label = t(key)
  return label === key ? String(value) : label
}

export interface FieldChange {
  field: string
  from: string | null
  to: string | null
}

const FIELD_LABEL: Record<string, string> = {
  title: 'common.title',
  priority: 'common.priority',
  type: 'common.type',
  assignee: 'common.assignee',
  due_date: 'common.dueDate',
  estimate: 'issue.estimate',
  cycle: 'issue.cycle',
  milestone: 'issue.milestone',
}

// A changed value as people read it: translated choices, "—" for nothing.
export function changeValue(t: T, field: string, value: string | null, formatDate?: (iso: string) => string): string {
  if (value === null || value === '') return '—'
  if (field === 'priority') return t(`priority.${value}`)
  if (field === 'type') return t(`issueType.${value}`)
  if (field === 'due_date' && formatDate) return formatDate(value)
  return value
}

export function changeLine(t: T, change: FieldChange, formatDate?: (iso: string) => string): string {
  const label = FIELD_LABEL[change.field] ? t(FIELD_LABEL[change.field]) : change.field
  return `${label}: ${changeValue(t, change.field, change.from, formatDate)} → ${changeValue(t, change.field, change.to, formatDate)}`
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
    case 'changed_issue': {
      const changes = (activity.metadata.changes as FieldChange[] | undefined) ?? []
      return t('activity.changed_issue', { target, changes: changes.map((change) => changeLine(t, change)).join('; ') })
    }
    case 'commented':
      return t('activity.commented', { target })
    case 'pr_merged':
      return t('activity.pr_merged', {
        target,
        pr: String(activity.metadata.pr_number ?? ''),
        to: statusLabel(t, activity.metadata.to),
      })
    case 'member_joined':
      return t('activity.member_joined', { role: roleLabel(t, activity.metadata.role) })
    case 'member_left':
      return t('activity.member_left')
    case 'member_removed':
      return t('activity.member_removed', { user: String(activity.metadata.user ?? '') })
    case 'role_changed':
      return t('activity.role_changed', {
        user: String(activity.metadata.user ?? ''),
        role: roleLabel(t, activity.metadata.role).toLowerCase(),
      })
    case 'ownership_transferred':
      return t('activity.ownership_transferred', { user: String(activity.metadata.user ?? '') })
    default:
      return activity.verb
  }
}

export function activityLink(activity: Activity): string | null {
  if (activity.target_type === 'issue') return `/issues/${activity.target_id}`
  if (activity.target_type === 'project') return `/projects/${activity.target_id}`
  if (activity.target_type === 'workspace') return '/members'
  return null
}
