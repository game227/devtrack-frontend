import { describe, expect, it } from 'vitest'
import { canChangeRoles, canInvite, canInviteAdmins, canLeave, canRemove } from './memberRules'

describe('workspace member rules (mirroring the backend table)', () => {
  it('lets the owner do everything except leave', () => {
    expect([canInvite('owner'), canInviteAdmins('owner'), canChangeRoles('owner'), canLeave('owner')]).toEqual([true, true, true, false])
    expect(canRemove('owner', 'admin', false)).toBe(true)
    expect(canRemove('owner', 'member', false)).toBe(true)
  })

  it('lets admins invite and remove members only', () => {
    expect([canInvite('admin'), canInviteAdmins('admin'), canChangeRoles('admin'), canLeave('admin')]).toEqual([true, false, false, true])
    expect(canRemove('admin', 'member', false)).toBe(true)
    expect(canRemove('admin', 'admin', false)).toBe(false)
    expect(canRemove('admin', 'owner', false)).toBe(false)
  })

  it('leaves members read-only apart from leaving', () => {
    expect([canInvite('member'), canChangeRoles('member'), canLeave('member')]).toEqual([false, false, true])
    expect(canRemove('member', 'member', false)).toBe(false)
  })

  it('never removes yourself (that is leaving) or the owner', () => {
    expect(canRemove('owner', 'owner', true)).toBe(false)
    expect(canRemove('owner', 'member', true)).toBe(false)
  })
})
