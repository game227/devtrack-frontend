import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { MyDay } from './MyDay'
import type { Issue } from '../types/issue'

// Wednesday 18 November 2026, mid-morning.
const now = new Date(2026, 10, 18, 10, 0)

function issue(id: number, title: string, due_date: string | null, status: Issue['status'] = 'todo'): Issue {
  return {
    id, project: 7, number: id, title, description: '', type: 'task', status, priority: 'medium', assignee: null,
    reporter: { id: 1, username: 'jane', avatar: null }, labels: [], cycle: null, milestone: null, due_date,
    github_number: null, github_url: '', estimate: null, checklist: null, completed_at: null,
    created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z',
  }
}

const issues = [
  issue(1, 'Late one', '2026-11-16'),
  issue(2, 'Due today', '2026-11-18'),
  issue(3, 'Friday work', '2026-11-20'),
  issue(4, 'Finished', '2026-11-18', 'done'),
  issue(5, 'No date', null),
]

describe('MyDay', () => {
  it("shows what needs me today (overdue first), then any day of the week I pick", async () => {
    renderWithProviders(<MyDay issues={issues} now={now} projectName={() => 'Payments API'} />, { lang: 'en' })
    const week = within(screen.getByRole('group', { name: 'Due this week' }))
    expect(week.getByRole('button', { name: 'Overdue: 1' })).toBeInTheDocument()
    expect(week.getByRole('button', { name: 'Today: 1' })).toBeInTheDocument()
    expect(week.getByRole('button', { name: 'Tomorrow: 0' })).toBeInTheDocument()
    let list = screen.getByRole('list', { name: 'Needs you today' })
    expect(within(list).getAllByRole('link').map((link) => link.textContent)).toEqual([
      expect.stringContaining('Late one'),
      expect.stringContaining('Due today'),
    ])

    const friday = week.getByRole('button', { name: 'Fri 20: 1' })
    await userEvent.click(friday)
    expect(friday).toHaveAttribute('aria-pressed', 'true')
    list = screen.getByRole('list', { name: 'Fri 20' })
    expect(list).toHaveTextContent('Friday work')
    expect(list).not.toHaveTextContent('Due today')

    // Picking it again goes back to today.
    await userEvent.click(friday)
    expect(screen.getByRole('list', { name: 'Needs you today' })).toBeInTheDocument()
  })

  it('says so plainly when a day is free', async () => {
    renderWithProviders(<MyDay issues={issues} now={now} />, { lang: 'en' })
    await userEvent.click(screen.getByRole('button', { name: 'Tomorrow: 0' }))
    expect(screen.getByText('Nothing of yours is due that day.')).toBeInTheDocument()
  })
})
