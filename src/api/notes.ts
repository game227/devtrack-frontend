import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { CreateNotePayload, Note, UpdateNotePayload } from '../types/note'

export async function listProjectNotes(projectId: number): Promise<Note[]> {
  return getAllPages<Note>(`/projects/${projectId}/notes/`)
}

export async function createProjectNote(projectId: number, payload: CreateNotePayload): Promise<Note> {
  const { data } = await apiClient.post<Note>(`/projects/${projectId}/notes/`, payload)
  return data
}

export async function updateNote(id: number, payload: UpdateNotePayload): Promise<Note> {
  const { data } = await apiClient.patch<Note>(`/notes/${id}/`, payload)
  return data
}

export async function deleteNote(id: number): Promise<void> {
  await apiClient.delete(`/notes/${id}/`)
}
