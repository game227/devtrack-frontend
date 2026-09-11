export interface Milestone {
  id: number
  project: number
  name: string
  description: string
  target_date: string
  issue_count: number
  completed_count: number
  completion_percent: number
  created_at: string
}

export interface CreateMilestonePayload {
  project: number
  name: string
  description?: string
  target_date: string
}

export type UpdateMilestonePayload = Partial<Omit<CreateMilestonePayload, 'project'>>
