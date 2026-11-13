import { describe, expect, it } from 'vitest'
import { issueEditRights } from './permissions'

const user = (id: number) => ({ id, username: `u${id}`, avatar: null })

describe('issueEditRights', () => {
  const issue = { reporter: user(1), assignee: user(2) }

  it('lets the creator change everything', () => {
    expect(issueEditRights(issue, 1)).toBe('full')
  })

  it('lets the assignee report progress only', () => {
    expect(issueEditRights(issue, 2)).toBe('progress')
  })

  it('keeps everyone else read-only', () => {
    expect(issueEditRights(issue, 3)).toBe('none')
    expect(issueEditRights(issue, undefined)).toBe('none')
  })

  it('treats a creator who is also the assignee as the creator', () => {
    expect(issueEditRights({ reporter: user(1), assignee: user(1) }, 1)).toBe('full')
  })

  it('handles an unassigned issue', () => {
    expect(issueEditRights({ reporter: user(1), assignee: null }, 2)).toBe('none')
  })
})
