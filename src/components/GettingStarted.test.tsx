import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { NewIssueContext } from '../features/issues/newIssueContext'
import { GettingStarted } from './GettingStarted'
import type { Workspace } from '../types/workspace'

const listProjects = vi.fn()
const listWorkspaceMembers = vi.fn()
vi.mock('../api/projects', () => ({ listProjects: (...args: unknown[]) => listProjects(...args) }))
vi.mock('../api/workspaces', () => ({ listWorkspaceMembers: (...args: unknown[]) => listWorkspaceMembers(...args) }))

const workspace = { id: 3, name: 'Nova Labs', is_personal: false } as Workspace

describe('GettingStarted', () => {
  it('ticks off what is really done, offers only the next step, and can be hidden', async () => {
    listProjects.mockResolvedValue([{ id: 7, name: 'Payments', repository_url: '' }])
    listWorkspaceMembers.mockResolvedValue([{ id: 1 }])
    const openNewIssue = vi.fn()
    const onHide = vi.fn()
    renderWithProviders(
      <NewIssueContext.Provider value={openNewIssue}>
        <GettingStarted workspace={workspace} projectsTotal={1} issuesTotal={0} onHide={onHide} />
      </NewIssueContext.Provider>,
      { lang: 'en' },
    )
    expect(await screen.findByRole('heading', { name: '4 steps to get going' })).toBeInTheDocument()
    expect(screen.getByText('1 of 4 done')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create a project (done)' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Create a project' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Invite people' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add an issue' }))
    expect(openNewIssue).toHaveBeenCalledWith(7)

    await userEvent.click(screen.getByRole('button', { name: 'Hide' }))
    expect(onHide).toHaveBeenCalled()
    expect(localStorage.getItem('devtrack_onboarding_hidden:3')).toBe('1')
  })

  it('leaves out the team step in a personal workspace and disappears once all is done', async () => {
    listProjects.mockResolvedValue([{ id: 7, name: 'Payments', repository_url: 'https://github.com/a/b' }])
    const { container } = renderWithProviders(
      <GettingStarted workspace={{ ...workspace, is_personal: true }} projectsTotal={1} issuesTotal={4} onHide={() => {}} />,
      { lang: 'en' },
    )
    await vi.waitFor(() => expect(listProjects).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
