export type NotificationVerb =
  | 'issue_assigned'
  | 'commented'
  | 'mentioned'
  | 'workspace_invited'
  | 'project_member_added'

export type NotificationTargetType = 'issue' | 'comment' | 'workspace' | 'project'

export interface AppNotification {
  id: number
  verb: NotificationVerb
  target_type: NotificationTargetType
  target_id: number
  target_display: string
  // Who did it (the comment's author) and the issue it is about, when there is one.
  actor?: string | null
  issue?: { id: number; number: number; title: string } | null
  is_read: boolean
  created_at: string
}
