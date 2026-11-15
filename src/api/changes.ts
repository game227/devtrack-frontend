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
