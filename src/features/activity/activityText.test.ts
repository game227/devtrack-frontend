import { describe, expect, it } from 'vitest'
import { translate } from '../../i18n/core'
import { describeActivity } from './activityText'
import type { Activity } from '../../types/activity'

const t = (key: string, params?: Record<string, string | number>) => translate('en', key, params)

function activity(verb: Activity['verb'], metadata: Record<string, unknown>): Activity {
  return { id: 1, actor: { id: 1, username: 'olivia', avatar: null }, verb, target_type: 'workspace', target_id: 9, target_display: 'Nova', metadata, created_at: '2026-11-13T10:00:00Z' }
}

describe('describeActivity — membership changes', () => {
  it('describes each change in words', () => {
    expect(describeActivity(activity('member_joined', { user: 'mia', role: 'member' }), t)).toBe('joined as Member')
    expect(describeActivity(activity('member_left', { user: 'mia' }), t)).toBe('left the workspace')
    expect(describeActivity(activity('member_removed', { user: 'mia', unassigned: 2 }), t)).toBe('removed mia from the workspace')
    expect(describeActivity(activity('role_changed', { user: 'mia', role: 'admin' }), t)).toBe('made mia admin')
    expect(describeActivity(activity('ownership_transferred', { user: 'mia' }), t)).toBe('made mia the owner')
  })
})
