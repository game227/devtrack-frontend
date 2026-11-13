import type { UserBrief } from './auth'
import type { WorkspaceRole } from './workspace'

export interface Invitation {
  id: number
  workspace: { id: number; name: string }
  user: UserBrief
  invited_by: UserBrief
  role: WorkspaceRole
  created_at: string
}
