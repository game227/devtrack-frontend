import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { FavoriteButton } from './FavoriteButton'
import type { Project } from '../../types/project'

const setProjectFavorite = vi.fn()
vi.mock('../../api/projects', () => ({
  getProject: vi.fn().mockResolvedValue({ id: 7, name: 'Payments API', is_favorite: false }),
  setProjectFavorite: (...args: unknown[]) => setProjectFavorite(...args),
}))

function Harness() {
  const { data } = useQuery({ queryKey: ['project', 7], queryFn: async () => (await import('../../api/projects')).getProject(7) })
  return data ? <FavoriteButton project={data as Project} /> : null
}

describe('FavoriteButton', () => {
  it('stars at once and keeps it when the server agrees', async () => {
    setProjectFavorite.mockResolvedValueOnce(true)
    renderWithProviders(<Harness />, { lang: 'en' })
    const star = await screen.findByRole('button', { name: 'Favorite project' })
    expect(star).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(star)
    expect(star).toHaveAttribute('aria-pressed', 'true')
    expect(setProjectFavorite).toHaveBeenCalledWith(7, true)
  })

  it('takes the star back when the server refuses', async () => {
    setProjectFavorite.mockRejectedValueOnce(new Error('nope'))
    renderWithProviders(<Harness />, { lang: 'en' })
    const star = await screen.findByRole('button', { name: 'Favorite project' })
    await userEvent.click(star)
    await waitFor(() => expect(star).toHaveAttribute('aria-pressed', 'false'))
  })
})
