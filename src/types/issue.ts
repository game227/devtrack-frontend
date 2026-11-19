import type { UserBrief } from './auth'
import type { Priority } from './project'

export type IssueType = 'task' | 'bug' | 'feature' | 'improvement' | 'chore'
export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'

export const ISSUE_STATUSES: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done']
export const ISSUE_TYPES: IssueType[] = ['task', 'bug', 'feature', 'improvement', 'chore']
export const ISSUE_PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

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
  // The issue's number within its project (#1, #2, ...): what people see and what "#12" in a commit
  // or pull request refers to. Not the same as `id`, which is global and only used in URLs.
  number: number
  title: string
  description: string
  type: IssueType
  status: IssueStatus
  priority: Priority
  // Story points; null when not estimated.
  estimate: number | null
  assignee: UserBrief | null
  reporter: UserBrief
  labels: IssueLabel[]
  cycle: number | null
  milestone: number | null
  due_date: string | null
  // Set on issues imported from GitHub (for those, `number` is GitHub's number too).
  github_number: number | null
  github_url: string
  // Checklist progress; null while the issue has no checklist.
  checklist: { done: number; total: number } | null
  // When the issue last reached Done (null while it is open).
  completed_at: string | null
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
  estimate?: number | null
  assignee_id?: number | null
  label_ids?: number[]
  due_date?: string | null
  cycle?: number | null
  milestone?: number | null
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

export interface ChecklistItem {
  id: number
  text: string
  done: boolean
  position: number
  created_at: string
}

export type RelationKind = 'blocks' | 'duplicates' | 'relates'

export interface IssueRelation {
  id: number
  kind: RelationKind
  // "out": this issue made the link (it blocks / duplicates the other); "in": the other issue did.
  direction: 'out' | 'in'
  other: { id: number; number: number; title: string; status: IssueStatus; project: number }
  created_at: string
}

export interface IssueAttachment {
  id: number
  name: string
  content_type: string
  size: number
  is_image: boolean
  uploaded_by: UserBrief | null
  created_at: string
}
