import type { UserBrief } from './auth'

export type ProjectStatus = 'planned' | 'active' | 'paused' | 'completed' | 'archived'
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface Project {
  id: number
  workspace: number
  name: string
  description: string
  icon: string
  status: ProjectStatus
  priority: Priority
  start_date: string | null
  target_date: string | null
  owner: UserBrief
  team: number | null
  repository_url: string | null
  tech_stack: unknown
  // Most issues a board column should hold at once, e.g. { in_progress: 5 }.
  wip_limits?: Partial<Record<string, number>>
  // Issues in the project and how many are done (older APIs may not send them).
  issue_count?: number
  done_count?: number
  // Whether the signed-in user keeps this project in their sidebar.
  is_favorite?: boolean
  // Issues finished per week over the last eight weeks, oldest first (project lists only).
  weekly_done?: number[] | null
  created_at: string
  updated_at: string
}

export interface CreateProjectPayload {
  workspace: number
  name: string
  description?: string
  status?: ProjectStatus
  priority?: Priority
  start_date?: string | null
  target_date?: string | null
  team?: number | null
  wip_limits?: Partial<Record<string, number>>
}

export type UpdateProjectPayload = Partial<Omit<CreateProjectPayload, 'workspace'>>

// What a person does on a project (separate from `role`, their permission level).
export type ProjectSpecialty = 'frontend' | 'backend' | 'debugger' | 'designer'
export const SPECIALTIES: ProjectSpecialty[] = ['frontend', 'backend', 'debugger', 'designer']

export interface ProjectMember {
  id: number
  user: UserBrief
  role: string
  specialty: ProjectSpecialty | ''
  added_at: string
}

export interface AddProjectMemberPayload {
  username: string
  role?: string
  specialty?: ProjectSpecialty | ''
}
