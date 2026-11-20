import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceContext } from '../workspace/workspaceContext'
import { renderWithProviders } from '../../test/utils'
import { NewIssueDialog } from './NewIssueDialog'
import type { Workspace } from '../../types/workspace'

const listProjects = vi.fn()
vi.mock('../../api/projects', () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
  listProjectMembers: () => Promise.resolve([{ id: 1, user: { id: 9, username: 'timur', avatar: null }, role: '', specialty: '', added_at: '' }]),
}))
const createIssue = vi.fn()
vi.mock('../../api/issues', () => ({ createIssue: (...args: unknown[]) => createIssue(...args) }))

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

  it('starts the issue at the station it was opened for', async () => {
    listProjects.mockResolvedValue([{ id: 4, name: 'Payments API', status: 'active' }])
    createIssue.mockResolvedValue({ id: 9, project: 4, number: 2 })
    renderWithProviders(
      <WorkspaceContext.Provider value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}>
        <NewIssueDialog initialProjectId={4} initialStatus="in_review" onClose={vi.fn()} onCreated={vi.fn()} />
      </WorkspaceContext.Provider>,
      { lang: 'en' },
    )
    expect(await screen.findByRole('button', { name: 'In review' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Todo' }))
    await userEvent.type(screen.getByLabelText('Title'), 'Ship it')
    await userEvent.click(screen.getByRole('button', { name: 'Create issue' }))
    await waitFor(() => expect(createIssue).toHaveBeenCalled())
    expect(createIssue.mock.calls[0][0]).toEqual(expect.objectContaining({ project: 4, status: 'todo', title: 'Ship it' }))
  })

  it('fills the description from a template without overwriting typed text, and sends assignee and due date', async () => {
    listProjects.mockResolvedValue([{ id: 4, name: 'Payments API', status: 'active' }])
    createIssue.mockResolvedValue({ id: 1, project: 4, number: 1 })
    renderDialog()
    await waitFor(() => expect(screen.getByLabelText('Project')).toHaveValue('4'))
    await userEvent.click(screen.getByRole('button', { name: 'Bug report' }))
    expect(screen.getByLabelText('Type')).toHaveValue('bug')
    expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toContain('## Steps to reproduce')
    // Switching template replaces an untouched template...
    await userEvent.click(screen.getByRole('button', { name: 'New feature' }))
    expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toContain('## Problem')
    // ...but never text someone typed.
    await userEvent.clear(screen.getByLabelText('Description'))
    await userEvent.type(screen.getByLabelText('Description'), 'My own words')
    await userEvent.click(screen.getByRole('button', { name: 'Task' }))
    expect(screen.getByLabelText('Description')).toHaveValue('My own words')

    await userEvent.type(screen.getByLabelText('Title'), 'Crash on save')
    await userEvent.selectOptions(screen.getByLabelText('Assignee'), await screen.findByRole('option', { name: 'timur' }))
    await userEvent.type(screen.getByLabelText('Due date (optional)'), '2026-12-01')
    await userEvent.click(screen.getByRole('button', { name: 'Create issue' }))
    expect(createIssue.mock.calls[0][0]).toMatchObject({ title: 'Crash on save', type: 'task', assignee_id: 9, due_date: '2026-12-01' })
  })
})
