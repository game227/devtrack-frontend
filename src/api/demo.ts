import { apiClient } from './client'

export interface DemoSession {
  access: string
  refresh: string
  workspace: number
  expires_at: string
}

export const DEMO_ENABLED = import.meta.env.VITE_DEMO_ENABLED === 'true'

export async function startDemo(): Promise<DemoSession> {
  const { data } = await apiClient.post<DemoSession>('/demo/')
  return data
}

// Demo visitors are named demo-<8 hex digits> by the API.
export function isDemoUser(username: string | undefined) {
  return Boolean(username && /^demo-[0-9a-f]{8}$/.test(username))
}
