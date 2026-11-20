import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { IssueRelations } from './IssueRelations'

const listRelations = vi.fn()
const addRelation = vi.fn()
const deleteRelation = vi.fn()
const search = vi.fn()
vi.mock('../api/issueParts', () => ({
  listRelations: (...a: unknown[]) => listRelations(...a),
  addRelation: (...a: unknown[]) => addRelation(...a),
  deleteRelation: (...a: unknown[]) => deleteRelation(...a),
}))
vi.mock('../api/search', () => ({ search: (...a: unknown[]) => search(...a) }))

beforeEach(() => {
  listRelations.mockReset().mockResolvedValue([
    { id: 1, kind: 'blocks', direction: 'in', other: { id: 8, number: 3, title: 'Set up CI', status: 'in_progress', project: 1 }, created_at: '' },
    { id: 2, kind: 'relates', direction: 'out', other: { id: 9, number: 4, title: 'Docs', status: 'done', project: 1 }, created_at: '' },
  ])
  addRelation.mockReset().mockResolvedValue({})
  deleteRelation.mockReset().mockResolvedValue(undefined)
  search.mockReset().mockResolvedValue({
    projects: [], users: [], labels: [], cycles: [],
    issues: [
      { id: 5, number: 1, title: 'This issue', type: 'task', status: 'todo' },
      { id: 8, number: 3, title: 'Set up CI', type: 'task', status: 'in_progress' },
      { id: 11, number: 7, title: 'Login page', type: 'bug', status: 'todo' },
    ],
  })
})

describe('IssueRelations', () => {
  it('reads each link from this issue’s side', async () => {
    renderWithProviders(<IssueRelations issueId={5} workspaceId={3} canChange={false} />, { lang: 'en' })
    expect(await screen.findByText('Blocked by')).toBeInTheDocument()
    expect(screen.getByText('Related to')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /#3 Set up CI/ })).toHaveAttribute('href', '/issues/8')
    expect(screen.queryByRole('button', { name: 'Link an issue' })).not.toBeInTheDocument()
  })

  it('finds an issue to link, leaving out this one and those already linked', async () => {
    renderWithProviders(<IssueRelations issueId={5} workspaceId={3} canChange />, { lang: 'en' })
    await userEvent.click(await screen.findByRole('button', { name: 'Link an issue' }))
    await userEvent.selectOptions(screen.getByLabelText('Kind of link'), 'blocks')
    await userEvent.type(screen.getByLabelText('Find an issue by title or number'), 'log')
    const results = await screen.findByRole('list', { name: 'Matching issues' })
    expect(results).toHaveTextContent('Login page')
    expect(results).not.toHaveTextContent('This issue')
    expect(results).not.toHaveTextContent('Set up CI')
    await userEvent.click(screen.getByRole('button', { name: /Login page/ }))
    expect(addRelation).toHaveBeenCalledWith(5, 'blocks', 11)
    await waitFor(() => expect(screen.queryByLabelText('Kind of link')).not.toBeInTheDocument())
    expect(search).toHaveBeenCalledWith(3, 'log')
  })

  it('removes a link', async () => {
    renderWithProviders(<IssueRelations issueId={5} workspaceId={3} canChange />, { lang: 'en' })
    await userEvent.click(await screen.findByRole('button', { name: 'Remove link to #4' }))
    expect(deleteRelation).toHaveBeenCalledWith(2)
  })
})
