import type { UserBrief } from './auth'
import type { Priority } from './project'

export type IssueType = 'task' | 'bug' | 'feature' | 'improvement' | 'chore'
export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'

export const ISSUE_STATUSES: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

// The backend nests only id/name/color on an Issue (LabelBriefSerializer) —
// not the full Label shape from types/label.ts (which includes workspace/project).
export interface IssueLabel {
  id: number
  name: string
  color: string
}

export interface Issue {
  id: number
  project: number
  title: string
  description: string
  type: IssueType
  status: IssueStatus
  priority: Priority
  assignee: UserBrief | null
  reporter: UserBrief
  labels: IssueLabel[]
  cycle: number | null
  milestone: number | null
  due_date: string | null
  // Set on issues imported from GitHub.
  github_number: number | null
  github_url: string
  created_at: string
  updated_at: string
}

export interface CreateIssuePayload {
  project: number
  title: string
  description?: string
  type?: IssueType
  status?: IssueStatus
  priority?: Priority
  assignee_id?: number | null
  label_ids?: number[]
  due_date?: string | null
}

export type UpdateIssuePayload = Partial<Omit<CreateIssuePayload, 'project'>>

export interface IssueFilters {
  status?: IssueStatus
  priority?: Priority
  type?: IssueType
  assignee?: number | 'me'
  label?: number
  cycle?: number
  milestone?: number
}
