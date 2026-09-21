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
  created_at: string
  updated_at: string
}

export interface CreateProjectPayload {
  workspace: number
  name: string
  description?: string
  status?: ProjectStatus
  priority?: Priority
  start_date?: string
  target_date?: string
  team?: number | null
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
