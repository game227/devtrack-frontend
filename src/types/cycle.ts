export interface Cycle {
  id: number
  project: number
  name: string
  start_date: string
  end_date: string
  issue_count: number
  completed_count: number
  completion_percent: number
  is_active: boolean
  created_at: string
}

export interface CreateCyclePayload {
  project: number
  name: string
  start_date: string
  end_date: string
}
