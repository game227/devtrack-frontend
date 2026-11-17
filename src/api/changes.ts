import { apiClient } from './client'

export type ChangeArea = 'issues' | 'projects' | 'members' | 'notifications' | 'invitations'

export interface Changes {
  cursor: string
  changed: ChangeArea[]
}

// "What changed in this workspace (and for me) since my last look?" — only area names, never data.
export async function getChanges(workspaceId: number, since: string | null): Promise<Changes> {
  const params: Record<string, string | number> = { workspace: workspaceId }
  if (since) params.since = since
  const { data } = await apiClient.get<Changes>('/changes/', { params })
  return data
}

// Server-sent events need an ASGI server, so the stream is opt-in per build (see DEPLOY_PLAN section 7).
export const LIVE_STREAM = import.meta.env.VITE_LIVE_STREAM === 'true'

export async function getStreamUrl(workspaceId: number): Promise<string> {
  const { data } = await apiClient.post<{ ticket: string }>('/changes/ticket/', { workspace: workspaceId })
  return `${apiClient.defaults.baseURL}/changes/stream/?ticket=${encodeURIComponent(data.ticket)}`
}

export interface Viewer {
  id: number
  username: string
  avatar: string | null
}

export async function sendPresence(issueId: number): Promise<Viewer[]> {
  const { data } = await apiClient.post<{ viewers: Viewer[] }>('/changes/presence/', { issue: issueId })
  return data.viewers
}
