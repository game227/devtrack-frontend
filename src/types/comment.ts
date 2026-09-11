import type { UserBrief } from './auth'

export interface Comment {
  id: number
  author: UserBrief
  body: string
  created_at: string
  updated_at: string
}
