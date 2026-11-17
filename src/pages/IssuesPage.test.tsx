import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { renderWithProviders } from '../test/utils'
import { IssuesPage } from './IssuesPage'
import type { Workspace } from '../types/workspace'

const listIssues = vi.fn()
const exportIssues = vi.fn()
const listSavedViews = vi.fn()
const createSavedView = vi.fn()
const deleteSavedView = vi.fn()

vi.mock('../api/issues', () => ({
  listIssues: (...args: unknown[]) => listIssues(...args),
  exportIssues: (...args: unknown[]) => exportIssues(...args),
}))
vi.mock('../api/labels', () => ({ listLabels: () => Promise.resolve([{ id: 4, name: 'ui', color: '#111111', workspace: 3, project: null }]) }))
vi.mock('../api/savedViews', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/savedViews')>()),
  listSavedViews: (...args: unknown[]) => listSavedViews(...args),
  createSavedView: (...args: unknown[]) => createSavedView(...args),
  deleteSavedView: (...args: unknown[]) => deleteSavedView(...args),
}))

const workspace = { id: 3, name: 'Nova Labs' } as Workspace

function Probe() {
  return <output data-testid="search">{useLocation().search}</output>
}

function renderPage(route = '/issues') {
  return renderWithProviders(
    <WorkspaceContext.Provider value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}>
      <IssuesPage />
      <Probe />
    </WorkspaceContext.Provider>,
    { route, lang: 'en' },
  )
}

beforeEach(() => {
  listIssues.mockReset().mockResolvedValue([])
  exportIssues.mockReset().mockResolvedValue('nova-labs-issues-2026-11-16.csv')
  listSavedViews.mockReset().mockResolvedValue([])
  createSavedView.mockReset()
  deleteSavedView.mockReset().mockResolvedValue(undefined)
})

describe('IssuesPage filters', () => {
  it('reads the filters from the URL and ignores values the list would not understand', async () => {
    renderPage('/issues?status=todo&assignee=me&priority=nope&label=abc')
    await waitFor(() => expect(listIssues).toHaveBeenCalledWith({ workspace: 3 }, { status: 'todo', assignee: 'me' }))
    expect(screen.getByLabelText('Filter by status')).toHaveValue('todo')
    expect(screen.getByLabelText('Assigned to me')).toBeChecked()
  })

  it('keeps chosen filters in the URL and can clear them', async () => {
    renderPage()
    await userEvent.selectOptions(screen.getByLabelText('Filter by type'), 'bug')
    expect(screen.getByTestId('search')).toHaveTextContent('?type=bug')
    await waitFor(() => expect(listIssues).toHaveBeenLastCalledWith({ workspace: 3 }, { type: 'bug' }))
    await userEvent.selectOptions(await screen.findByLabelText('Filter by label'), 'ui')
    expect(screen.getByTestId('search')).toHaveTextContent('?type=bug&label=4')

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/)
  })

  it('saves the current filters as a named view', async () => {
    createSavedView.mockResolvedValue({ id: 9, name: 'My bugs', filters: { type: 'bug' }, workspace: 3, project: null, created_at: '' })
    renderPage('/issues?type=bug')
    await userEvent.click(await screen.findByRole('button', { name: 'Save view' }))
    await userEvent.type(screen.getByLabelText('View name'), 'My bugs{Enter}')
    expect(createSavedView).toHaveBeenCalledWith({ workspace: 3 }, 'My bugs', { type: 'bug' })
    await waitFor(() => expect(screen.queryByLabelText('View name')).not.toBeInTheDocument())
  })

  it('explains why a view could not be saved', async () => {
    createSavedView.mockRejectedValue(
      new AxiosError('Bad Request', '400', undefined, undefined, { status: 400, data: { name: ['You already have a view with this name.'] } } as AxiosResponse),
    )
    renderPage('/issues?type=bug')
    await userEvent.click(await screen.findByRole('button', { name: 'Save view' }))
    await userEvent.type(screen.getByLabelText('View name'), 'Bugs{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('You already have a view with this name.')
  })

  it('applies and deletes saved views', async () => {
    listSavedViews.mockResolvedValue([{ id: 1, name: 'Urgent', filters: { priority: 'urgent' }, workspace: 3, project: null, created_at: '' }])
    renderPage()
    const views = screen.getByRole('group', { name: 'Saved views' })
    const chip = await within(views).findByRole('button', { name: 'Urgent' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(chip)
    expect(screen.getByTestId('search')).toHaveTextContent('?priority=urgent')
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    // The current filters are already a saved view, so there is nothing new to save.
    expect(screen.queryByRole('button', { name: 'Save view' })).not.toBeInTheDocument()

    await userEvent.click(within(views).getByRole('button', { name: 'Delete view Urgent' }))
    expect(deleteSavedView).toHaveBeenCalledWith(1)
  })

  it('exports exactly what is on screen', async () => {
    renderPage('/issues?status=in_review')
    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(exportIssues).toHaveBeenCalledWith({ workspace: 3 }, { status: 'in_review' }, 'en')
  })
})
