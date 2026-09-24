import { describe, expect, it } from 'vitest'
import { sortByUrgency } from './issueOrder'
import type { Issue } from '../types/issue'

const today = new Date(2026, 8, 24, 12, 0, 0)

function issue(id: number, overrides: Partial<Issue>): Issue {
  return {
    id,
    project: 1,
    title: `Issue ${id}`,
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'none',
    assignee: null,
    reporter: { id: 1, username: 'jane.dev', avatar: null },
    labels: [],
    cycle: null,
    milestone: null,
    due_date: null,
    github_number: null,
    github_url: '',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  }
}

describe('sortByUrgency', () => {
  it('puts overdue first, then due soon, then later, then undated', () => {
    const sorted = sortByUrgency(
      [
        issue(1, { due_date: null, priority: 'urgent' }),
        issue(2, { due_date: '2026-12-01' }),
        issue(3, { due_date: '2026-09-25' }),
        issue(4, { due_date: '2026-09-10' }),
      ],
      today,
    )
    expect(sorted.map((i) => i.id)).toEqual([4, 3, 2, 1])
  })

  it('breaks ties by earliest date, then priority', () => {
    const sorted = sortByUrgency(
      [
        issue(1, { due_date: '2026-09-01', priority: 'low' }),
        issue(2, { due_date: '2026-09-01', priority: 'urgent' }),
        issue(3, { due_date: '2026-08-30' }),
        issue(4, { priority: 'high' }),
        issue(5, { priority: 'low' }),
      ],
      today,
    )
    expect(sorted.map((i) => i.id)).toEqual([3, 2, 1, 4, 5])
  })

  it('does not mutate its input', () => {
    const input = [issue(1, { due_date: '2026-12-01' }), issue(2, { due_date: '2026-09-01' })]
    sortByUrgency(input, today)
    expect(input.map((i) => i.id)).toEqual([1, 2])
  })
})
