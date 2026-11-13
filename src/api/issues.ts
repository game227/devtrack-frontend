import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { PaginatedResponse } from '../types/api'
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

export interface BoardIssues {
  issues: Issue[]
  // Finished issues in the project, including those not loaded.
  doneTotal: number
}

// The board needs every open issue but only the latest finished ones: a long-running project can have
// thousands of those. Open work is fetched in full; Done is one page, most recently completed first,
// unless the user asked to see all of it.
export async function loadBoard(project: number, allDone: boolean): Promise<BoardIssues> {
  const doneParams = { project, status: 'done', ordering: '-completed_at' }
  const [open, done] = await Promise.all([
    getAllPages<Issue>('/issues/', { project, exclude_status: 'done' }),
    allDone
      ? getAllPages<Issue>('/issues/', doneParams).then((results) => ({ results, count: results.length }))
      : apiClient
          .get<PaginatedResponse<Issue>>('/issues/', { params: { ...doneParams, page: 1 } })
          .then(({ data }) => data),
  ])
  return { issues: [...open, ...done.results], doneTotal: done.count }
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
