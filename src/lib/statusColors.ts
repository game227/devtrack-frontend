import type { IssueStatus } from '../types/issue'

// One place for the colour each issue status carries (board column dots, analytics bars).
// Status colours are reserved for state and always sit next to a text label.
export const STATUS_COLOR: Record<IssueStatus, string> = {
  backlog: 'var(--color-subtle)',
  todo: 'var(--color-fg-muted)',
  in_progress: 'var(--color-warning)',
  in_review: 'var(--color-info)',
  done: 'var(--color-success)',
}
