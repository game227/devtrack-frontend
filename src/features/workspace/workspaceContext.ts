import { createContext, useContext } from 'react'
import type { Workspace } from '../../types/workspace'

export interface WorkspaceContextValue {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  isLoading: boolean
  selectWorkspace: (id: number) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return ctx
}
