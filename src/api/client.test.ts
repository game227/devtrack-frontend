import { beforeEach, describe, expect, it, vi } from 'vitest'

// Both axios instances in client.ts come from axios.create(); give them a controllable `post`.
const refreshPost = vi.fn()
vi.mock('axios', () => {
  const instance = () => ({
    post: refreshPost,
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  })
  return { default: { create: instance }, isAxiosError: () => false }
})

const { refreshAccessToken } = await import('./client')
const tokenStore = await import('../features/auth/tokenStore')

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('refreshAccessToken racing a password change', () => {
  const expired = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    refreshPost.mockReset()
    expired.mockReset()
    tokenStore.registerAuthExpiredHandler(expired)
    tokenStore.setAccessToken('old-access')
    tokenStore.setStoredRefreshToken('old-refresh')
  })

  it('does not sign the user out when a refresh with the replaced token fails', async () => {
    const pending = deferred<never>()
    refreshPost.mockReturnValue(pending.promise)
    const result = refreshAccessToken()

    // Meanwhile the password change revoked every old session and stored a fresh pair.
    tokenStore.setAccessToken('new-access')
    tokenStore.setStoredRefreshToken('new-refresh')
    pending.reject(new Error('401: token blacklisted'))

    expect(await result).toBe('new-access')
    expect(tokenStore.getStoredRefreshToken()).toBe('new-refresh')
    expect(expired).not.toHaveBeenCalled()
  })

  it("does not overwrite the fresh pair with the old session's rotated one", async () => {
    const pending = deferred<{ data: { access: string; refresh: string } }>()
    refreshPost.mockReturnValue(pending.promise)
    const result = refreshAccessToken()

    tokenStore.setAccessToken('new-access')
    tokenStore.setStoredRefreshToken('new-refresh')
    pending.resolve({ data: { access: 'rotated-access', refresh: 'rotated-refresh' } })

    expect(await result).toBe('new-access')
    expect(tokenStore.getAccessToken()).toBe('new-access')
    expect(tokenStore.getStoredRefreshToken()).toBe('new-refresh')
  })

  it('still ends the session when the current token is refused', async () => {
    refreshPost.mockRejectedValue(new Error('401'))
    expect(await refreshAccessToken()).toBeNull()
    expect(tokenStore.getStoredRefreshToken()).toBeNull()
    expect(expired).toHaveBeenCalledOnce()
  })

  it('stores the rotated pair in the normal case', async () => {
    refreshPost.mockResolvedValue({ data: { access: 'a2', refresh: 'r2' } })
    expect(await refreshAccessToken()).toBe('a2')
    expect(tokenStore.getStoredRefreshToken()).toBe('r2')
  })

  it('ends a session whose stored token was cleared elsewhere (signed out in another tab)', async () => {
    tokenStore.setStoredRefreshToken(null)
    expect(await refreshAccessToken()).toBeNull()
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(expired).toHaveBeenCalledOnce()
    expect(refreshPost).not.toHaveBeenCalled()
  })

  it('stays quiet when there was no session at all', async () => {
    tokenStore.setStoredRefreshToken(null)
    tokenStore.setAccessToken(null)
    expect(await refreshAccessToken()).toBeNull()
    expect(expired).not.toHaveBeenCalled()
  })
})
