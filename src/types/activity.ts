import type { UserBrief } from './auth'

export type ActivityVerb =
  | 'created_project'
  | 'created_issue'
  | 'moved_issue'
  // Other fields changed: metadata.changes = [{ field, from, to }]
  | 'changed_issue'
  | 'commented'
  | 'pr_merged'
  // Membership changes (the target is the workspace; metadata.user names who it is about)
  | 'member_joined'
  | 'member_left'
  | 'member_removed'
  | 'role_changed'
  | 'ownership_transferred'
export type ActivityTargetType = 'project' | 'issue' | 'comment' | 'workspace'

export interface Activity {
  id: number
  actor: UserBrief
  verb: ActivityVerb
  target_type: ActivityTargetType
  target_id: number
  target_display: string | null
  metadata: Record<string, unknown>
  created_at: string
}
