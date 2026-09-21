import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ImportFromGithub } from './ImportFromGithub'

const getGithubConnectionStatus = vi.fn()
const listAvailableGithubRepos = vi.fn()
const importGithubRepo = vi.fn()
vi.mock('../api/integrations', () => ({
  getGithubConnectionStatus: (...a: unknown[]) => getGithubConnectionStatus(...a),
  listAvailableGithubRepos: (...a: unknown[]) => listAvailableGithubRepos(...a),
  importGithubRepo: (...a: unknown[]) => importGithubRepo(...a),
}))

function renderImport() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects" element={<ImportFromGithub workspaceId={5} />} />
      <Route path="/projects/:id" element={<p>project page</p>} />
    </Routes>,
    { route: '/projects', lang: 'en' },
  )
}

describe('ImportFromGithub', () => {
  beforeEach(() => {
    getGithubConnectionStatus.mockReset()
    listAvailableGithubRepos.mockReset()
    importGithubRepo.mockReset()
  })

  it('asks the user to connect GitHub first when there is no connection', async () => {
    getGithubConnectionStatus.mockResolvedValue({ connected: false })
    renderImport()
    expect(await screen.findByText(/Connect your GitHub account first/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Connect GitHub' })).toHaveAttribute('href', '/settings')
    expect(listAvailableGithubRepos).not.toHaveBeenCalled()
  })

  it('imports the chosen repository, with issues by default, and opens the new project', async () => {
    getGithubConnectionStatus.mockResolvedValue({ connected: true, github_username: 'me' })
    listAvailableGithubRepos.mockResolvedValue([
      { id: 11, full_name: 'me/app', private: false, html_url: 'https://github.com/me/app', admin: true },
      { id: 12, full_name: 'org/lib', private: true, html_url: 'https://github.com/org/lib', admin: false },
    ])
    importGithubRepo.mockResolvedValue({ project: { id: 99, name: 'app' }, issues_imported: 4, link: { webhook_installed: false, webhook_warning: null } })
    renderImport()
    const user = userEvent.setup()

    const submit = await screen.findByRole('button', { name: 'Import' })
    expect(submit).toBeDisabled() // nothing chosen yet
    await user.selectOptions(screen.getByRole('combobox', { name: 'Choose a repository…' }), 'me/app')
    await user.click(submit)

    await waitFor(() => expect(screen.getByText('project page')).toBeInTheDocument())
    expect(importGithubRepo).toHaveBeenCalledWith({ workspace: 5, github_repo_id: 11, full_name: 'me/app', import_issues: true })
  })

  it('lets the user skip importing issues', async () => {
    getGithubConnectionStatus.mockResolvedValue({ connected: true })
    listAvailableGithubRepos.mockResolvedValue([{ id: 11, full_name: 'me/app', private: false, html_url: '', admin: true }])
    importGithubRepo.mockResolvedValue({ project: { id: 1, name: 'app' }, issues_imported: 0, link: { webhook_installed: false, webhook_warning: null } })
    renderImport()
    const user = userEvent.setup()

    await user.selectOptions(await screen.findByRole('combobox'), 'me/app')
    await user.click(screen.getByRole('checkbox', { name: /Import the repository's issues/ }))
    await user.click(screen.getByRole('button', { name: 'Import' }))

    await waitFor(() => expect(importGithubRepo).toHaveBeenCalled())
    expect(importGithubRepo.mock.calls[0][0].import_issues).toBe(false)
  })
})
