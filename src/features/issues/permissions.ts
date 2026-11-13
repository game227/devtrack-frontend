import type { Issue } from '../../types/issue'

// What the signed-in user may change on an issue. Mirrors the backend rule (CanEditIssue):
//  - 'full'     the issue's creator: every field
//  - 'progress' the person it is assigned to: status and priority only (how the work is going)
//  - 'none'     everyone else: read-only
// The backend enforces it; this only keeps the UI from offering an edit that would bounce off a 403.
export type IssueEditRights = 'full' | 'progress' | 'none'

export function issueEditRights(
  issue: Pick<Issue, 'reporter' | 'assignee'>,
  userId: number | undefined,
): IssueEditRights {
  if (userId === undefined) return 'none'
  if (issue.reporter.id === userId) return 'full'
  if (issue.assignee?.id === userId) return 'progress'
  return 'none'
}
