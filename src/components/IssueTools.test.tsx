import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { SharedIssuePage } from '../pages/SharedIssuePage'
import { handleShortcut, setPageShortcuts } from '../features/shortcuts/shortcuts'
import { BulkBar } from './BulkBar'
import { IssueHistory } from './IssueHistory'
import { IssueTime } from './IssueTime'
import { RecurringIssues } from './RecurringIssues'
import { ShareIssueButtons } from './ShareIssue'

const api = vi.hoisted(() => ({
  listShareLinks: vi.fn(),
  createShareLink: vi.fn(),
  revokeShareLink: vi.fn(),
  getSharedIssue: vi.fn(),
  listTime: vi.fn(),
  logTime: vi.fn(),
  deleteTime: vi.fn(),
  issueHistory: vi.fn(),
  bulkUpdate: vi.fn(),
  listRecurring: vi.fn(),
  createRecurring: vi.fn(),
  updateRecurring: vi.fn(),
  deleteRecurring: vi.fn(),
}))
vi.mock('../api/issueTools', () => api)
vi.mock('../api/projects', () => ({
  listProjectMembers: () => Promise.resolve([{ id: 1, user: { id: 7, username: 'aziza', avatar: null }, role: '', specialty: '', added_at: '' }]),
}))

const user = { id: 7, username: 'aziza', avatar: null }

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset()
})

describe('ShareIssueButtons', () => {
  it('creates a link for the chosen period, copies it and can revoke it', async () => {
    // Fixed here, not taken from a local .env (CI has none).
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api/v1')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const link = { id: 3, token: 'tok', expires_at: '2026-11-25T10:00:00Z', revoked: false, live: true, created_by: user, created_at: '' }
    api.listShareLinks.mockResolvedValueOnce([]).mockResolvedValue([link])
    api.createShareLink.mockResolvedValue(link)
    api.revokeShareLink.mockResolvedValue(undefined)
    renderWithProviders(<ShareIssueButtons issueId={5} canShare />, { lang: 'en' })
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    const dialog = await screen.findByRole('dialog', { name: 'Share a read-only link' })
    await userEvent.click(within(dialog).getByRole('button', { name: '30 days' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create and copy link' }))
    expect(api.createShareLink).toHaveBeenCalledWith(5, 30)
    // Through the API's preview page, so chat apps can show the issue.
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://api.example.test/s/tok?lang=en'))
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Revoke' }))
    expect(api.revokeShareLink.mock.calls[0][0]).toBe(3)
    vi.unstubAllEnvs()
  })

  it('links the page itself when no API address is configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const link = { id: 4, token: 'tok2', expires_at: '2026-11-25T10:00:00Z', revoked: false, live: true, created_by: user, created_at: '' }
    api.listShareLinks.mockResolvedValue([])
    api.createShareLink.mockResolvedValue(link)
    renderWithProviders(<ShareIssueButtons issueId={5} canShare />, { lang: 'en' })
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    const dialog = await screen.findByRole('dialog', { name: 'Share a read-only link' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create and copy link' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/share/tok2`))
    vi.unstubAllEnvs()
  })

  it('offers only printing to people who may not share', () => {
    renderWithProviders(<ShareIssueButtons issueId={5} canShare={false} />, { lang: 'en' })
    expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
  })
})

describe('SharedIssuePage', () => {
  function open(token = 'tok') {
    return renderWithProviders(
      <Routes>
        <Route path="/share/:token" element={<SharedIssuePage />} />
      </Routes>,
      { route: `/share/${token}`, lang: 'en' },
    )
  }

  it('shows the shared issue read-only', async () => {
    api.getSharedIssue.mockResolvedValue({
      number: 12,
      title: 'Fix login',
      description: '**Steps**',
      status: 'in_progress',
      priority: 'high',
      type: 'bug',
      project: 'Shop',
      assignee: 'aziza',
      due_date: null,
      checklist: [{ text: 'Repro', done: true }],
      updated_at: '2026-11-17T10:00:00Z',
      expires_at: '2026-11-25T10:00:00Z',
    })
    open()
    expect(await screen.findByRole('heading', { name: 'Fix login' })).toBeInTheDocument()
    expect(screen.getByText('Steps').tagName).toBe('STRONG')
    expect(screen.getByText(/1 of 1 done/)).toBeInTheDocument()
    expect(screen.getByText('Assignee: aziza')).toBeInTheDocument()
  })

  it('explains an expired link', async () => {
    api.getSharedIssue.mockRejectedValue(new Error('404'))
    open('old')
    expect(await screen.findByText('This link no longer works')).toBeInTheDocument()
  })
})

describe('BulkBar', () => {
  it('applies one change to the selected issues and reports skipped ones', async () => {
    api.bulkUpdate.mockResolvedValue({ updated: [1], skipped: [{ id: 2, reason: 'not_allowed' }] })
    const onClear = vi.fn()
    renderWithProviders(<BulkBar ids={[1, 2]} projectId={4} allSelected={false} onAll={vi.fn()} onClear={onClear} />, { lang: 'en' })
    const bar = screen.getByRole('region', { name: 'Change selected issues' })
    expect(bar).toHaveTextContent('2 selected')
    expect(within(bar).getByRole('button', { name: 'Apply' })).toBeDisabled()
    await userEvent.selectOptions(within(bar).getByLabelText('New value'), 'done')
    await userEvent.click(within(bar).getByRole('button', { name: 'Apply' }))
    expect(api.bulkUpdate).toHaveBeenCalledWith([1, 2], { status: 'done' })
    await waitFor(() => expect(onClear).toHaveBeenCalled())

    await userEvent.selectOptions(within(bar).getByLabelText('What to change'), 'assignee_id')
    await userEvent.selectOptions(within(bar).getByLabelText('New value'), await within(bar).findByRole('option', { name: 'aziza' }))
    await userEvent.click(within(bar).getByRole('button', { name: 'Apply' }))
    expect(api.bulkUpdate).toHaveBeenLastCalledWith([1, 2], { assignee_id: 7 })
  })
})

describe('IssueHistory', () => {
  it('lists what changed, from what to what', async () => {
    api.issueHistory.mockResolvedValue([
      {
        id: 2,
        actor: user,
        verb: 'changed_issue',
        target_type: 'issue',
        target_id: 5,
        target_display: 'Fix login',
        metadata: { changes: [{ field: 'priority', from: 'low', to: 'high' }, { field: 'assignee', from: null, to: 'aziza' }] },
        created_at: '2026-11-17T10:00:00Z',
      },
      { id: 1, actor: user, verb: 'moved_issue', target_type: 'issue', target_id: 5, target_display: 'Fix login', metadata: { from: 'todo', to: 'in_progress' }, created_at: '2026-11-16T10:00:00Z' },
    ])
    renderWithProviders(<IssueHistory issueId={5} />, { lang: 'en' })
    expect(await screen.findByText('Priority: Low → High')).toBeInTheDocument()
    expect(screen.getByText('Assignee: — → aziza')).toBeInTheDocument()
    expect(screen.getByText('moved it from Todo to In progress')).toBeInTheDocument()
  })
})

describe('IssueTime', () => {
  it('totals the time and logs more', async () => {
    api.listTime.mockResolvedValue([
      { id: 1, user, minutes: 90, note: 'debugging', spent_on: '2026-11-17', created_at: '' },
      { id: 2, user: { id: 9, username: 'timur', avatar: null }, minutes: 30, note: '', spent_on: '2026-11-16', created_at: '' },
    ])
    api.logTime.mockResolvedValue({})
    renderWithProviders(<IssueTime issueId={5} userId={7} />, { lang: 'en' })
    expect(await screen.findByText('2 h')).toBeInTheDocument()
    // Only your own time can be removed.
    expect(screen.getByRole('button', { name: 'Remove 1 h 30 min' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove 30 min' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log time' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the time spent.')
    await userEvent.type(screen.getByLabelText('Hours'), '1')
    await userEvent.type(screen.getByLabelText('Minutes'), '15')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(api.logTime).toHaveBeenCalledWith(5, expect.objectContaining({ minutes: 75 }))
  })
})

describe('RecurringIssues', () => {
  it('lets managers add, pause and remove rules', async () => {
    const rule = { id: 4, title: 'Weekly report', description: '', type: 'task', priority: 'none', assignee: user, frequency: 'weekly', next_run: '2026-11-23', active: true, created_at: '' }
    api.listRecurring.mockResolvedValue([rule])
    api.createRecurring.mockResolvedValue(rule)
    api.updateRecurring.mockResolvedValue({ ...rule, active: false })
    api.deleteRecurring.mockResolvedValue(undefined)
    renderWithProviders(<RecurringIssues projectId={3} canManage />, { lang: 'en' })
    expect(await screen.findByText('Weekly report')).toBeInTheDocument()
    expect(screen.getByText(/Every week · aziza · next on/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(api.updateRecurring).toHaveBeenCalledWith(4, { active: false })
    await userEvent.click(screen.getByRole('button', { name: 'Add a recurring issue' }))
    await userEvent.type(screen.getByLabelText('Title'), 'Daily standup notes')
    await userEvent.selectOptions(screen.getByLabelText('How often'), 'daily')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(api.createRecurring).toHaveBeenCalledWith(3, expect.objectContaining({ title: 'Daily standup notes', frequency: 'daily' }))
  })

  it('stays out of the way for others when there are no rules', async () => {
    api.listRecurring.mockResolvedValue([])
    renderWithProviders(<RecurringIssues projectId={3} canManage={false} />, { lang: 'en' })
    await waitFor(() => expect(api.listRecurring).toHaveBeenCalled())
    expect(screen.queryByText('Recurring issues')).not.toBeInTheDocument()
  })
})

describe('page shortcuts', () => {
  afterEach(() => setPageShortcuts(null))
  const actions = () => ({ openPalette: vi.fn(), toggleHelp: vi.fn(), newIssue: vi.fn(), go: vi.fn(), page: (key: string) => pageRun(key) })
  let pageRun: (key: string) => boolean = () => false

  it('passes free keys to the page, but global sequences win', () => {
    const page = vi.fn((key: string) => key === 'p')
    pageRun = page
    const state = { pendingGoAt: null as number | null }
    const target = document.body
    expect(handleShortcut({ key: 'p', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, target }, state, actions(), 0)).toBe(true)
    expect(page).toHaveBeenCalledWith('p')
    page.mockClear()
    const run = actions()
    handleShortcut({ key: 'g', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, target }, state, run, 0)
    act(() => {
      handleShortcut({ key: 'p', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, target }, state, run, 10)
    })
    expect(run.go).toHaveBeenCalledWith('projects')
    expect(page).not.toHaveBeenCalled()
  })
})
