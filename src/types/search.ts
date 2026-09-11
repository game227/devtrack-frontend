import type { UserBrief } from './auth'
import type { ProjectStatus } from './project'
import type { IssueStatus, IssueType } from './issue'

export interface SearchProjectResult {
  id: number
  name: string
  status: ProjectStatus
}

export interface SearchIssueResult {
  id: number
  title: string
  type: IssueType
  status: IssueStatus
}

export interface SearchLabelResult {
  id: number
  name: string
  color: string
}

export interface SearchCycleResult {
  id: number
  name: string
  project: number
}

export interface SearchResults {
  projects: SearchProjectResult[]
  issues: SearchIssueResult[]
  users: UserBrief[]
  labels: SearchLabelResult[]
  cycles: SearchCycleResult[]
}
