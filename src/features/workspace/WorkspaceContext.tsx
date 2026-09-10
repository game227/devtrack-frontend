import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as workspacesApi from '../../api/workspaces'
import type { Workspace } from '../../types/workspace'
import { useAuth } from '../auth/AuthContext'

interface WorkspaceContextValue {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setWorkspaces([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    workspacesApi
      .listWorkspaces()
      .then((data) => {
        if (!cancelled) setWorkspaces(data)
      })
      .catch(() => {
        // Backend unreachable or not caught up yet — fail quiet, don't block the app.
        if (!cancelled) setWorkspaces([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.is_personal) ?? workspaces[0] ?? null,
    [workspaces],
  )

  const value = useMemo<WorkspaceContextValue>(
    () => ({ currentWorkspace, workspaces, isLoading }),
    [currentWorkspace, workspaces, isLoading],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return ctx
}
