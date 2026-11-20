import { useContext, useEffect } from 'react'
import { WorkspaceContext } from './workspaceContext'

// A page that belongs to one workspace (a project, an issue) switches the app to that workspace, so the
// header, the lists and the permissions always describe what is on screen. Someone who opens a link to
// a project in another of their workspaces would otherwise see the wrong workspace's name and menus.
export function useFollowWorkspace(workspaceId: number | undefined) {
  const context = useContext(WorkspaceContext)
  const currentId = context?.currentWorkspace?.id
  const workspaces = context?.workspaces
  const selectWorkspace = context?.selectWorkspace
  useEffect(() => {
    if (workspaceId === undefined || currentId === workspaceId || !workspaces || !selectWorkspace) return
    if (workspaces.some((workspace) => workspace.id === workspaceId)) selectWorkspace(workspaceId)
  }, [workspaceId, currentId, workspaces, selectWorkspace])
}
