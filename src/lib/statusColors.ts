import type { IssueStatus } from '../types/issue'

// One place for the colour each station of the line carries (the track, board column heads, analytics
// bars). Station colours mark state and always sit next to a text label or a position on the line.
export const STATUS_COLOR: Record<IssueStatus, string> = {
  backlog: 'var(--color-st-backlog)',
  todo: 'var(--color-st-todo)',
  in_progress: 'var(--color-st-progress)',
  in_review: 'var(--color-st-review)',
  done: 'var(--color-st-done)',
}
