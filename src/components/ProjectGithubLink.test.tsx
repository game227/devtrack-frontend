import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ProjectGithubLink } from './ProjectGithubLink'

const getProjectGithubLink = vi.fn()
const syncProjectGithub = vi.fn()
vi.mock('../api/integrations', () => ({
  getProjectGithubLink: (...a: unknown[]) => getProjectGithubLink(...a),
  syncProjectGithub: (...a: unknown[]) => syncProjectGithub(...a),
  listAvailableGithubRepos: vi.fn().mockResolvedValue([]),
  linkProjectGithubRepo: vi.fn(),
  unlinkProjectGithubRepo: vi.fn(),
}))

const linked = (webhook_installed: boolean, extra: Record<string, unknown> = {}) => ({
  linked: true,
  id: 1,
  project: 3,
  github_repo_id: 9,
  full_name: 'me/app',
  webhook_installed,
  default_branch: '',
  last_event_at: null,
  last_synced_at: null,
  ...extra,
  connected_by: { id: 1, username: 'me', avatar: null },
  created_at: '2026-09-01T00:00:00Z',
})

describe('ProjectGithubLink', () => {
  beforeEach(() => {
    getProjectGithubLink.mockReset()
    syncProjectGithub.mockReset()
  })

  it('explains that live updates are off and offers a manual sync', async () => {
    getProjectGithubLink.mockResolvedValue(linked(false))
    syncProjectGithub.mockResolvedValue({ pull_requests: 2, commits: 5, issues: 3 })
    renderWithProviders(<ProjectGithubLink projectId={3} />, { lang: 'en' })
    const user = userEvent.setup()

    expect(await screen.findByText(/Live updates are off/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sync now' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Synced: 2 pull requests, 5 commits, 3 issues.')
    expect(syncProjectGithub).toHaveBeenCalledWith(3)
  })

  it('shows that live updates are on when the webhook is installed', async () => {
    getProjectGithubLink.mockResolvedValue(linked(true))
    renderWithProviders(<ProjectGithubLink projectId={3} />, { lang: 'uz' })
    expect(await screen.findByText(/Webhook o'rnatilgan, lekin GitHub hali hech narsa yubormagan/)).toBeInTheDocument()
  })

  it('shows when GitHub last spoke, so a live webhook is told apart from a silent one', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString()
    getProjectGithubLink.mockResolvedValue(linked(true, { last_event_at: twoHoursAgo, default_branch: 'main' }))
    renderWithProviders(<ProjectGithubLink projectId={3} />, { lang: 'en' })
    expect(await screen.findByText('Live updates are on · last event 2 h ago')).toBeInTheDocument()
    expect(screen.getByText(/Default branch: main/)).toBeInTheDocument()
  })

  it('shows the last manual sync, or that there has not been one, when there is no webhook', async () => {
    getProjectGithubLink.mockResolvedValue(linked(false))
    const { unmount } = renderWithProviders(<ProjectGithubLink projectId={3} />, { lang: 'en' })
    expect(await screen.findByText('Not synced yet.')).toBeInTheDocument()
    unmount()

    getProjectGithubLink.mockResolvedValue(linked(false, { last_synced_at: new Date(Date.now() - 5 * 60_000).toISOString() }))
    renderWithProviders(<ProjectGithubLink projectId={3} />, { lang: 'en' })
    expect(await screen.findByText('Last sync: 5 min ago')).toBeInTheDocument()
  })

  it('spells out how GitHub activity moves issues', async () => {
    getProjectGithubLink.mockResolvedValue(linked(true))
    renderWithProviders(<ProjectGithubLink projectId={3} />, { lang: 'en' })
    expect(await screen.findByText(/Status only ever moves forward/)).toBeInTheDocument()
  })
})
