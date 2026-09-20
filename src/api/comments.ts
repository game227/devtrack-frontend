import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { Comment } from '../types/comment'

export async function listIssueComments(issueId: number): Promise<Comment[]> {
  return getAllPages<Comment>(`/issues/${issueId}/comments/`)
}

export async function createIssueComment(issueId: number, body: string): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(`/issues/${issueId}/comments/`, { body })
  return data
}

export async function listProjectComments(projectId: number): Promise<Comment[]> {
  return getAllPages<Comment>(`/projects/${projectId}/comments/`)
}

export async function createProjectComment(projectId: number, body: string): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(`/projects/${projectId}/comments/`, { body })
  return data
}

export async function updateComment(id: number, body: string): Promise<Comment> {
  const { data } = await apiClient.patch<Comment>(`/comments/${id}/`, { body })
  return data
}

export async function deleteComment(id: number): Promise<void> {
  await apiClient.delete(`/comments/${id}/`)
}
