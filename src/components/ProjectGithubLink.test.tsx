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

const linked = (webhook_installed: boolean) => ({
  linked: true,
  id: 1,
  project: 3,
  github_repo_id: 9,
  full_name: 'me/app',
  webhook_installed,
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
    syncProjectGithub.mockResolvedValue({ pull_requests: 2, commits: 5 })
    renderWithProviders(<ProjectGithubLink projectId={3} />, { lang: 'en' })
    const user = userEvent.setup()

    expect(await screen.findByText(/Live updates are off/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sync now' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Synced: 2 pull requests, 5 commits.')
    expect(syncProjectGithub).toHaveBeenCalledWith(3)
  })

  it('shows that live updates are on when the webhook is installed', async () => {
    getProjectGithubLink.mockResolvedValue(linked(true))
    renderWithProviders(<ProjectGithubLink projectId={3} />, { lang: 'uz' })
    expect(await screen.findByText('Jonli yangilanish yoqilgan.')).toBeInTheDocument()
  })
})
