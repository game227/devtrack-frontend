import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { renderWithProviders } from '../test/utils'
import { PendingInvitations } from './PendingInvitations'
import type { Workspace } from '../types/workspace'

const listMyInvitations = vi.fn()
const acceptInvitation = vi.fn()
const declineInvitation = vi.fn()
vi.mock('../api/invitations', () => ({
  listMyInvitations: () => listMyInvitations(),
  acceptInvitation: (id: number) => acceptInvitation(id),
  declineInvitation: (id: number) => declineInvitation(id),
}))

const selectWorkspace = vi.fn()
const invitation = {
  id: 5,
  workspace: { id: 9, name: 'Nova Labs' },
  user: { id: 2, username: 'dev', avatar: null },
  invited_by: { id: 1, username: 'jane.dev', avatar: null },
  role: 'member' as const,
  created_at: '2026-11-13T10:00:00Z',
}

function renderIt() {
  return renderWithProviders(
    <WorkspaceContext.Provider
      value={{ currentWorkspace: { id: 1, name: 'Mine' } as Workspace, workspaces: [], isLoading: false, selectWorkspace }}
    >
      <PendingInvitations />
    </WorkspaceContext.Provider>,
    { lang: 'en' },
  )
}

describe('PendingInvitations', () => {
  beforeEach(() => {
    listMyInvitations.mockReset()
    acceptInvitation.mockReset().mockResolvedValue(undefined)
    declineInvitation.mockReset().mockResolvedValue(undefined)
    selectWorkspace.mockReset()
  })

  it('renders nothing when there is nothing to answer', async () => {
    listMyInvitations.mockResolvedValue([])
    const { container } = renderIt()
    await waitFor(() => expect(listMyInvitations).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('accepts an invitation and switches to the workspace just joined', async () => {
    listMyInvitations.mockResolvedValueOnce([invitation]).mockResolvedValue([])
    renderIt()
    expect(await screen.findByText('jane.dev invited you to "Nova Labs" as a member')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(acceptInvitation).toHaveBeenCalledWith(5)
    await waitFor(() => expect(selectWorkspace).toHaveBeenCalledWith(9))
  })

  it('declines without joining', async () => {
    listMyInvitations.mockResolvedValueOnce([invitation]).mockResolvedValue([])
    renderIt()
    await userEvent.click(await screen.findByRole('button', { name: 'Decline' }))
    expect(declineInvitation).toHaveBeenCalledWith(5)
    expect(selectWorkspace).not.toHaveBeenCalled()
  })

  it('reloads the list when an invitation turns out to be no longer valid', async () => {
    listMyInvitations.mockResolvedValueOnce([invitation]).mockResolvedValue([])
    acceptInvitation.mockRejectedValueOnce(new Error('404: This invitation is no longer valid.'))
    renderIt()
    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('may have expired or been withdrawn')
    await waitFor(() => expect(listMyInvitations).toHaveBeenCalledTimes(2))
    expect(selectWorkspace).not.toHaveBeenCalled()
  })
})
