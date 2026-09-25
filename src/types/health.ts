export type ProjectHealthStatus = 'healthy' | 'needs_attention' | 'at_risk'

export type ProjectHealthFactorKey = 'task_progress' | 'development_activity' | 'deadline' | 'bug_rate' | 'flow'

// A factor is null when there is nothing to judge (no due dates, project not active, ...): it is
// then left out of the score instead of counting as good or bad.
export type ProjectHealthFactors = Record<ProjectHealthFactorKey, number | null>

export type ProjectRiskCode =
  | 'stale_in_progress'
  | 'stale_review'
  | 'stale_pull_requests'
  | 'overdue'
  | 'urgent_bugs'
  | 'no_recent_activity'

// Structured twin of the human-readable `risks` strings so the UI can localize them.
export interface ProjectRiskDetail {
  code: ProjectRiskCode
  count: number
  days?: number
}

export type ProjectHealthCapCode = 'critical_bug' | 'mass_overdue' | 'abandoned'

// The numbers behind a factor, for the "how is this calculated" panel. Which keys exist depends on the factor.
export interface ProjectHealthFactorDetail {
  mode?: 'cycle' | 'dates' | 'flow'
  done?: number
  total?: number
  expected_percent?: number
  closed?: number
  opened?: number
  days?: number
  dated?: number
  overdue?: number
  open_bugs?: number
  urgent?: number
  days_since?: number
  source?: 'github' | 'devtrack'
  applies?: boolean
  stale?: number
  in_flight?: number
}

export interface ProjectHealthBreakdownRow {
  key: ProjectHealthFactorKey
  score: number | null
  // Share of the overall score this factor carries after the inapplicable ones are left out.
  weight: number
  points: number
  detail: ProjectHealthFactorDetail
}

export interface ProjectHealth {
  score: number
  status: ProjectHealthStatus
  factors: ProjectHealthFactors
  risks: string[]
  risk_details?: ProjectRiskDetail[]
  // Newer backends only.
  formula_version?: number
  confidence?: 'low' | 'normal'
  breakdown?: ProjectHealthBreakdownRow[]
  capped_by?: ProjectHealthCapCode[]
}
