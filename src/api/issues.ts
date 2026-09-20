import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { CreateIssuePayload, Issue, IssueFilters, UpdateIssuePayload } from '../types/issue'

interface ListIssuesScope {
  project?: number
  workspace?: number
}

export async function listIssues(
  scope: ListIssuesScope,
  filters: IssueFilters = {},
): Promise<Issue[]> {
  return getAllPages<Issue>('/issues/', { ...scope, ...filters })
}

export async function createIssue(payload: CreateIssuePayload): Promise<Issue> {
  const { data } = await apiClient.post<Issue>('/issues/', payload)
  return data
}

export async function getIssue(id: number): Promise<Issue> {
  const { data } = await apiClient.get<Issue>(`/issues/${id}/`)
  return data
}

export async function updateIssue(id: number, payload: UpdateIssuePayload): Promise<Issue> {
  const { data } = await apiClient.patch<Issue>(`/issues/${id}/`, payload)
  return data
}

export async function deleteIssue(id: number): Promise<void> {
  await apiClient.delete(`/issues/${id}/`)
}
