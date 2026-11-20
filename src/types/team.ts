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

export interface TeamMember {
  id: number
  user: UserBrief
  joined_at: string
}
