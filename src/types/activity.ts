import type { UserBrief } from './auth'

export type ActivityVerb = 'created_project' | 'created_issue' | 'moved_issue' | 'commented' | 'pr_merged'
export type ActivityTargetType = 'project' | 'issue' | 'comment'

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
