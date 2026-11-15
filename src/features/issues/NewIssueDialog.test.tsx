import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceContext } from '../workspace/workspaceContext'
import { renderWithProviders } from '../../test/utils'
import { NewIssueDialog } from './NewIssueDialog'
import type { Workspace } from '../../types/workspace'

const listProjects = vi.fn()
vi.mock('../../api/projects', () => ({ listProjects: (...args: unknown[]) => listProjects(...args) }))
vi.mock('../../api/issues', () => ({ createIssue: vi.fn() }))

const workspace = { id: 3, name: 'Nova Labs' } as Workspace

function renderDialog(onClose = vi.fn()) {
  renderWithProviders(
    <WorkspaceContext.Provider value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}>
      <NewIssueDialog initialProjectId={null} onClose={onClose} onCreated={vi.fn()} />
    </WorkspaceContext.Provider>,
    { lang: 'en' },
  )
  return onClose
}

describe('NewIssueDialog', () => {
  it('sends a workspace without projects to create one first', async () => {
    listProjects.mockResolvedValue([])
    renderDialog()
    expect(await screen.findByText(/Issues belong to a project/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a project' })).toHaveAttribute('href', '/projects?new=1')
  })

  it('preselects the first project, needs a title, and closes on Escape', async () => {
    listProjects.mockResolvedValue([{ id: 4, name: 'Payments API', status: 'active' }])
    const onClose = renderDialog()
    await waitFor(() => expect(screen.getByLabelText('Project')).toHaveValue('4'))
    expect(screen.getByLabelText('Title')).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Create issue' })).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Title'), 'Retry failed webhooks')
    expect(screen.getByRole('button', { name: 'Create issue' })).toBeEnabled()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
