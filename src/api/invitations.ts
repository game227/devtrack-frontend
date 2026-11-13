import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { Invitation } from '../types/invitation'

// Being added to a workspace is an invitation: nobody joins (or sees it) until they accept.
export async function listMyInvitations(): Promise<Invitation[]> {
  return getAllPages<Invitation>('/workspaces/invitations/')
}

export async function acceptInvitation(id: number): Promise<void> {
  await apiClient.post(`/workspaces/invitations/${id}/accept/`)
}

export async function declineInvitation(id: number): Promise<void> {
  await apiClient.post(`/workspaces/invitations/${id}/decline/`)
}
