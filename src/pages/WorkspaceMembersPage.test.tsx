import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { makeAuth, renderWithProviders } from '../test/utils'
import { WorkspaceMembersPage } from './WorkspaceMembersPage'
import type { User } from '../types/auth'
import type { Workspace, WorkspaceRole } from '../types/workspace'

const api = {
  listWorkspaceMembers: vi.fn(),
  listWorkspaceInvitations: vi.fn(),
  inviteMember: vi.fn(),
  withdrawInvitation: vi.fn(),
  changeMemberRole: vi.fn(),
  removeMember: vi.fn(),
  leaveWorkspace: vi.fn(),
  transferOwnership: vi.fn(),
}
vi.mock('../api/workspaces', () => ({
  listWorkspaceMembers: (...a: unknown[]) => api.listWorkspaceMembers(...a),
  listWorkspaceInvitations: (...a: unknown[]) => api.listWorkspaceInvitations(...a),
  inviteMember: (...a: unknown[]) => api.inviteMember(...a),
  withdrawInvitation: (...a: unknown[]) => api.withdrawInvitation(...a),
  changeMemberRole: (...a: unknown[]) => api.changeMemberRole(...a),
  removeMember: (...a: unknown[]) => api.removeMember(...a),
  leaveWorkspace: (...a: unknown[]) => api.leaveWorkspace(...a),
  transferOwnership: (...a: unknown[]) => api.transferOwnership(...a),
}))

const person = (id: number, username: string) => ({ id, username, avatar: null })
const MEMBERS = [
  { id: 1, user: person(1, 'olivia'), role: 'owner', joined_at: '2026-10-01T10:00:00Z' },
  { id: 2, user: person(2, 'adam'), role: 'admin', joined_at: '2026-10-02T10:00:00Z' },
  { id: 3, user: person(3, 'mia'), role: 'member', joined_at: '2026-10-03T10:00:00Z' },
]

function me(id: number, username: string): User {
  return { id, username, email: `${username}@example.com`, email_verified: true, totp_enabled: false, first_name: '', last_name: '', avatar: null, bio: '', title: '', date_joined: '2026-01-01T00:00:00Z' }
}

function renderAs(role: WorkspaceRole, user: User, isPersonal = false) {
  const workspace = { id: 9, name: 'Nova', my_role: role, is_personal: isPersonal } as Workspace
  return renderWithProviders(
    <WorkspaceContext.Provider value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}>
      <Routes>
        <Route path="/members" element={<WorkspaceMembersPage />} />
        <Route path="/dashboard" element={<p>dashboard</p>} />
      </Routes>
    </WorkspaceContext.Provider>,
    { route: '/members', lang: 'en', auth: makeAuth({ user }) },
  )
}

describe('WorkspaceMembersPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.listWorkspaceMembers.mockResolvedValue(MEMBERS)
    api.listWorkspaceInvitations.mockResolvedValue([
      { id: 50, workspace: { id: 9, name: 'Nova' }, user: person(8, 'guest'), invited_by: person(1, 'olivia'), role: 'member', created_at: new Date().toISOString() },
    ])
  })

  it('gives the owner role controls, removal, hand-over and admin invitations', async () => {
    api.changeMemberRole.mockResolvedValue({})
    renderAs('owner', me(1, 'olivia'))
    expect(await screen.findByText('mia')).toBeInTheDocument()
    expect(screen.queryByLabelText('Role of olivia')).not.toBeInTheDocument() // the owner's own role is fixed
    await userEvent.selectOptions(screen.getByLabelText('Role of mia'), 'admin')
    expect(api.changeMemberRole).toHaveBeenCalledWith(9, 3, 'admin')
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(2) // adam and mia
    expect(screen.getAllByRole('button', { name: 'Make owner' })).toHaveLength(2)
    const inviteRole = screen.getByRole('combobox', { name: 'Role' })
    expect(within(inviteRole).getByRole('option', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByText('guest')).toBeInTheDocument()
    expect(screen.getByText(/14 days left/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Leave workspace' })).not.toBeInTheDocument()
  })

  it('lets an admin invite members and remove members only', async () => {
    api.inviteMember.mockResolvedValue({ user: person(8, 'newbie') })
    renderAs('admin', me(2, 'adam'))
    expect(await screen.findByText('mia')).toBeInTheDocument()
    expect(screen.queryByLabelText('Role of mia')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Make owner' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('combobox', { name: 'Role' })).queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Username'), 'newbie')
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
    expect(api.inviteMember).toHaveBeenCalledWith(9, 'newbie', 'member')
    expect(await screen.findByRole('status')).toHaveTextContent('newbie has been invited.')
  })

  it('shows a plain member the list, and the way out', async () => {
    api.leaveWorkspace.mockResolvedValue(undefined)
    renderAs('member', me(3, 'mia'))
    expect(await screen.findByText('olivia')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Invite someone' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    expect(api.listWorkspaceInvitations).not.toHaveBeenCalled()
    const leave = screen.getByRole('button', { name: 'Leave workspace' })
    await userEvent.click(leave) // arms the confirmation
    await userEvent.click(screen.getByRole('button', { name: /sure|confirm|leave/i }))
    await waitFor(() => expect(api.leaveWorkspace).toHaveBeenCalledWith(9))
    expect(await screen.findByText('dashboard')).toBeInTheDocument()
  })

  it('offers no hand-over in a personal workspace', async () => {
    renderAs('owner', me(1, 'olivia'), true)
    expect(await screen.findByText('mia')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Make owner' })).not.toBeInTheDocument()
    expect(screen.getByText(/personal workspace/)).toBeInTheDocument()
  })
})
