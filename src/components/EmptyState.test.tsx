import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders a title, description and a button action', async () => {
    const onClick = vi.fn()
    renderWithProviders(
      <EmptyState icon="projects" title="Nothing here" description="Add the first one." action={{ label: 'Add', onClick }} />,
    )
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument()
    expect(screen.getByText('Add the first one.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders the action as a link when it has a destination', () => {
    renderWithProviders(<EmptyState icon="issues" title="No issues" action={{ label: 'Go', to: '/projects' }} />)
    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '/projects')
  })

  it('omits the action when none is given', () => {
    renderWithProviders(<EmptyState icon="notes" title="Quiet" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
