import type { UserBrief } from './auth'

export type ActivityVerb = 'created_project' | 'created_issue' | 'moved_issue' | 'commented'
export type ActivityTargetType = 'project' | 'issue' | 'comment'

export interface Activity {
  id: number
  actor: UserBrief
  verb: ActivityVerb
  target_type: ActivityTargetType
  target_id: number
  target_display: string
  metadata: { from?: string; to?: string }
  created_at: string
}
