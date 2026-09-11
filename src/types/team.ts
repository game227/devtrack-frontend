import type { UserBrief } from './auth'

export interface Team {
  id: number
  workspace: number
  name: string
  description: string
  member_count: number
  created_at: string
}

export interface CreateTeamPayload {
  workspace: number
  name: string
  description?: string
}

export type UpdateTeamPayload = Partial<Omit<CreateTeamPayload, 'workspace'>>

export interface TeamMember {
  id: number
  user: UserBrief
  joined_at: string
}
