import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listWorkspaces } from '../../api/workspaces'
import { useAuth } from '../auth/authContext'
import { WorkspaceContext } from './workspaceContext'
import type { WorkspaceContextValue } from './workspaceContext'

const STORAGE_KEY = 'devtrack_workspace'

function readStoredWorkspaceId(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [selectedId, setSelectedId] = useState<number | null>(readStoredWorkspaceId)

  // Backend unreachable or not caught up yet — fail quiet (empty list), don't block the app.
  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: listWorkspaces,
    enabled: isAuthenticated,
  })

  const workspaces = useMemo(
    () => (isAuthenticated ? (workspacesQuery.data ?? []) : []),
    [isAuthenticated, workspacesQuery.data],
  )

  const currentWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === selectedId) ??
      workspaces.find((workspace) => workspace.is_personal) ??
      workspaces[0] ??
      null,
    [workspaces, selectedId],
  )

  const selectWorkspace = useCallback((id: number) => {
    setSelectedId(id)
    try {
      localStorage.setItem(STORAGE_KEY, String(id))
    } catch {
      // storage unavailable — the choice just won't survive a reload
    }
  }, [])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      currentWorkspace,
      workspaces,
      isLoading: isAuthenticated && workspacesQuery.isLoading,
      selectWorkspace,
    }),
    [currentWorkspace, workspaces, isAuthenticated, workspacesQuery.isLoading, selectWorkspace],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
