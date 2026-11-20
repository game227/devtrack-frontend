import { apiClient } from './client'
import type { UserBrief } from '../types/auth'
import type { IssueStatus, IssueType } from '../types/issue'
import type { Priority as IssuePriority } from '../types/project'
import type { Activity } from '../types/activity'
import type { PaginatedResponse } from '../types/api'

export interface ShareLink {
  id: number
  token: string
  expires_at: string
  revoked: boolean
  live: boolean
  created_by: UserBrief | null
  created_at: string
}

export interface SharedIssue {
  number: number
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  type: IssueType
  project: string
  assignee: string | null
  due_date: string | null
  checklist: Array<{ text: string; done: boolean }>
  updated_at: string
  expires_at: string
}

export async function listShareLinks(issueId: number): Promise<ShareLink[]> {
  const { data } = await apiClient.get<ShareLink[]>(`/issues/${issueId}/share/`)
  return data
}

export async function createShareLink(issueId: number, days: 1 | 7 | 30): Promise<ShareLink> {
  const { data } = await apiClient.post<ShareLink>(`/issues/${issueId}/share/`, { days })
  return data
}

export async function revokeShareLink(id: number): Promise<void> {
  await apiClient.delete(`/issues/share-links/${id}/`)
}

export async function getSharedIssue(token: string): Promise<SharedIssue> {
  const { data } = await apiClient.get<SharedIssue>(`/issues/shared/${encodeURIComponent(token)}/`)
  return data
}

export interface TimeEntry {
  id: number
  user: UserBrief
  minutes: number
  note: string
  spent_on: string
  created_at: string
}

export async function listTime(issueId: number): Promise<TimeEntry[]> {
  const { data } = await apiClient.get<TimeEntry[]>(`/issues/${issueId}/time/`)
  return data
}

export async function logTime(issueId: number, payload: { minutes: number; note: string; spent_on: string }): Promise<TimeEntry> {
  const { data } = await apiClient.post<TimeEntry>(`/issues/${issueId}/time/`, payload)
  return data
}

export async function deleteTime(id: number): Promise<void> {
  await apiClient.delete(`/issues/time/${id}/`)
}

export async function issueHistory(issueId: number): Promise<Activity[]> {
  const { data } = await apiClient.get<PaginatedResponse<Activity>>('/activities/', { params: { issue: issueId } })
  return data.results
}

export type BulkChanges = Partial<{ status: IssueStatus; priority: IssuePriority; assignee_id: number | null; cycle: number | null; milestone: number | null }>

export interface BulkResult {
  updated: number[]
  skipped: Array<{ id: number; reason: 'not_found' | 'not_allowed' | 'invalid' }>
}

export async function bulkUpdate(ids: number[], changes: BulkChanges): Promise<BulkResult> {
  const { data } = await apiClient.post<BulkResult>('/issues/bulk/', { ids, changes })
  return data
}

export interface RecurringRule {
  id: number
  title: string
  description: string
  type: IssueType
  priority: IssuePriority
  assignee: UserBrief | null
  frequency: 'daily' | 'weekly' | 'monthly'
  next_run: string
  active: boolean
  created_at: string
}

export async function listRecurring(projectId: number): Promise<RecurringRule[]> {
  const { data } = await apiClient.get<RecurringRule[]>(`/issues/recurring/project/${projectId}/`)
  return data
}

export async function createRecurring(
  projectId: number,
  payload: { title: string; frequency: RecurringRule['frequency']; next_run: string; assignee_id: number | null; type: IssueType; priority: IssuePriority },
): Promise<RecurringRule> {
  const { data } = await apiClient.post<RecurringRule>(`/issues/recurring/project/${projectId}/`, payload)
  return data
}

export async function updateRecurring(id: number, payload: Partial<{ active: boolean }>): Promise<RecurringRule> {
  const { data } = await apiClient.patch<RecurringRule>(`/issues/recurring/${id}/`, payload)
  return data
}

export async function deleteRecurring(id: number): Promise<void> {
  await apiClient.delete(`/issues/recurring/${id}/`)
}
