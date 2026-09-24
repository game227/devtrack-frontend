import { dueState } from './dueDate'
import type { Issue } from '../types/issue'

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }

// Overdue work first, then what is due soon, then everything else; within a group the earliest
// due date wins, then the higher priority. Undated issues sort after dated ones.
export function sortByUrgency(issues: Issue[], now: Date = new Date()): Issue[] {
  const rank = (issue: Issue) => {
    const state = dueState(issue.due_date, issue.status, now)
    return state === 'overdue' ? 0 : state === 'soon' ? 1 : 2
  }
  return [...issues].sort((a, b) => {
    const byState = rank(a) - rank(b)
    if (byState !== 0) return byState
    if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1
    return (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4)
  })
}
