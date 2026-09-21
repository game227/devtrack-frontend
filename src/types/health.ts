export type ProjectHealthStatus = 'healthy' | 'needs_attention' | 'at_risk'

export interface ProjectHealthFactors {
  task_progress: number
  development_activity: number
  deadline: number
  bug_rate: number
}

export type ProjectRiskCode = 'stale_in_progress' | 'overdue' | 'urgent_bugs'

// Structured twin of the human-readable `risks` strings so the UI can localize them.
export interface ProjectRiskDetail {
  code: ProjectRiskCode
  count: number
  days?: number
}

export interface ProjectHealth {
  score: number
  status: ProjectHealthStatus
  factors: ProjectHealthFactors
  risks: string[]
  risk_details?: ProjectRiskDetail[]
}
