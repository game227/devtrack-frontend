import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { PaginatedResponse } from '../types/api'
import { saveBlob } from './issueParts'
import type { ListFilters, ListScope } from './savedViews'
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

// The list's issues (same scope and filters) as a CSV file, saved through a temporary link: the API
// needs the bearer token, so a plain <a href> to the endpoint would not be authorised.
export async function exportIssues(scope: ListScope, filters: ListFilters, lang: string): Promise<string> {
  const response = await apiClient.get<Blob>('/issues/export/', {
    params: { ...scope, ...filters, lang },
    responseType: 'blob',
  })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'devtrack-issues.csv'
  saveBlob(response.data, filename)
  return filename
}
