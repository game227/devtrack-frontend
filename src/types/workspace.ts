export interface Workspace {
  id: number
  name: string
  slug: string
  description: string
  owner: number
  is_personal: boolean
  created_at: string
}

export interface CreateWorkspacePayload {
  name: string
  description?: string
}
