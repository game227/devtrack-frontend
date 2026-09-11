export type ProjectHealthStatus = 'healthy' | 'needs_attention' | 'at_risk'

export interface ProjectHealthFactors {
  task_progress: number
  development_activity: number
  deadline: number
  bug_rate: number
}

export interface ProjectHealth {
  score: number
  status: ProjectHealthStatus
  factors: ProjectHealthFactors
  risks: string[]
}
