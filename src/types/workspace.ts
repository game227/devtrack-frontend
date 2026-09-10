import type { UserBrief } from './auth'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface Workspace {
  id: number
  name: string
  slug: string
  description: string
  owner: UserBrief
  is_personal: boolean
  my_role: WorkspaceRole
  created_at: string
}

export interface CreateWorkspacePayload {
  name: string
  description?: string
}

export interface WorkspaceMember {
  id: number
  user: UserBrief
  role: WorkspaceRole
  joined_at: string
}
