import { apiClient } from './client'
import type { ChecklistItem, IssueRelation, RelationKind } from '../types/issue'

export async function listChecklist(issueId: number): Promise<ChecklistItem[]> {
  const { data } = await apiClient.get<ChecklistItem[]>(`/issues/${issueId}/checklist/`)
  return data
}

export async function addChecklistItem(issueId: number, text: string): Promise<ChecklistItem> {
  const { data } = await apiClient.post<ChecklistItem>(`/issues/${issueId}/checklist/`, { text })
  return data
}

export async function updateChecklistItem(id: number, patch: Partial<Pick<ChecklistItem, 'text' | 'done'>>): Promise<ChecklistItem> {
  const { data } = await apiClient.patch<ChecklistItem>(`/issues/checklist/${id}/`, patch)
  return data
}

export async function deleteChecklistItem(id: number): Promise<void> {
  await apiClient.delete(`/issues/checklist/${id}/`)
}

export async function listRelations(issueId: number): Promise<IssueRelation[]> {
  const { data } = await apiClient.get<IssueRelation[]>(`/issues/${issueId}/relations/`)
  return data
}

export async function addRelation(issueId: number, kind: RelationKind, targetId: number): Promise<IssueRelation> {
  const { data } = await apiClient.post<IssueRelation>(`/issues/${issueId}/relations/`, { kind, target_id: targetId })
  return data
}

export async function deleteRelation(id: number): Promise<void> {
  await apiClient.delete(`/issues/relations/${id}/`)
}
