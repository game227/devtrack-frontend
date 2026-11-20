import type { Project } from '../../types/project'
import type { Workspace } from '../../types/workspace'

// Mirrors CanManageProject on the API: the project's owner, or an owner/admin of its workspace.
export function canManageProject(project: Project, userId: number | undefined, workspace: Workspace | null | undefined) {
  if (userId !== undefined && project.owner.id === userId) return true
  return workspace?.id === project.workspace && (workspace.my_role === 'owner' || workspace.my_role === 'admin')
}
