import { apiClient } from './client'
import type { ChecklistItem, IssueAttachment, IssueRelation, RelationKind } from '../types/issue'

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

export async function listAttachments(issueId: number): Promise<IssueAttachment[]> {
  const { data } = await apiClient.get<IssueAttachment[]>(`/issues/${issueId}/attachments/`)
  return data
}

export async function uploadAttachment(issueId: number, file: File, onProgress?: (fraction: number) => void): Promise<IssueAttachment> {
  const body = new FormData()
  body.append('file', file)
  const { data } = await apiClient.post<IssueAttachment>(`/issues/${issueId}/attachments/`, body, {
    onUploadProgress: (event) => onProgress?.(event.total ? event.loaded / event.total : 0),
  })
  return data
}

export async function deleteAttachment(id: number): Promise<void> {
  await apiClient.delete(`/issues/attachments/${id}/`)
}

// The file's bytes, through the authenticated client (attachments have no public URL).
export async function fetchAttachment(id: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/issues/attachments/${id}/download/`, { responseType: 'blob' })
  return data
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
