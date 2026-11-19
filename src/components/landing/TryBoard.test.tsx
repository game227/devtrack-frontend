import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { TryBoard } from './TryBoard'

function column(name: string) {
  // Each column's cards sit under its heading.
  const heading = screen.getByRole('heading', { name: new RegExp(`^${name}`) })
  return within(heading.parentElement as HTMLElement)
}

describe('TryBoard', () => {
  it('sends a pressed card one station on', async () => {
    renderWithProviders(<TryBoard />, { lang: 'en' })
    await userEvent.click(screen.getByRole('button', { name: /^#1 Sign-in page, Todo/ }))
    expect(column('In progress').getByRole('button', { name: /^#1 Sign-in page, In progress/ })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('#1 Sign-in page: In progress')
  })

  it('lets a commit message move a card: "fixes" finishes it, a bare mention starts it', async () => {
    renderWithProviders(<TryBoard />, { lang: 'en' })
    const box = screen.getByRole('textbox', { name: 'Commit message' })
    await userEvent.type(box, 'fixes #2{Enter}')
    expect(column('Done').getByRole('button', { name: /^#2 Password reset email, Done/ })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Commits' })).toHaveTextContent('fixes #2 #2 → Done')
    await userEvent.type(box, 'wip on #1{Enter}')
    expect(column('In progress').getByRole('button', { name: /^#1 Sign-in page, In progress/ })).toBeInTheDocument()
    await userEvent.type(box, 'tidy up{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('No #number in the message')
    await userEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(column('Todo').getByRole('button', { name: /^#2 Password reset email, Todo/ })).toBeInTheDocument()
  })
})
