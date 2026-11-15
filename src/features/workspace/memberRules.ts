import type { WorkspaceRole } from '../../types/workspace'

// Mirrors the backend's table (apps/workspaces/membership.py), so the page only offers what will work:
//
//   action                owner   admin            member
//   invite                yes     as member only   no
//   withdraw invitation   yes     yes              no
//   change a role         yes     no               no
//   remove someone        yes     members only     no
//   leave                 no      yes              yes
//   hand over             yes     no               no
export const canInvite = (me: WorkspaceRole) => me === 'owner' || me === 'admin'
export const canInviteAdmins = (me: WorkspaceRole) => me === 'owner'
export const canChangeRoles = (me: WorkspaceRole) => me === 'owner'
export const canLeave = (me: WorkspaceRole) => me !== 'owner'

export function canRemove(me: WorkspaceRole, them: WorkspaceRole, isSelf: boolean): boolean {
  if (isSelf || them === 'owner') return false
  if (me === 'owner') return true
  return me === 'admin' && them === 'member'
}
