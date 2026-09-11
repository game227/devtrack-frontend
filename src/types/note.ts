import type { UserBrief } from './auth'

export interface Note {
  id: number
  project: number
  title: string
  body: string
  author: UserBrief
  created_at: string
  updated_at: string
}

export interface CreateNotePayload {
  title: string
  body: string
}

export type UpdateNotePayload = Partial<CreateNotePayload>
