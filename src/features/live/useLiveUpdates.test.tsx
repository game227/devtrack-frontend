import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { LIVE_INTERVAL_MS, STREAM_RETRY_MS, useLiveUpdates } from './useLiveUpdates'

const getChanges = vi.fn()
const getStreamUrl = vi.fn()
vi.mock('../../api/changes', () => ({
  LIVE_STREAM: false,
  getChanges: (...a: unknown[]) => getChanges(...a),
  getStreamUrl: (...a: unknown[]) => getStreamUrl(...a),
}))

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useLiveUpdates', () => {
  let client: QueryClient
  let invalidate: MockInstance<QueryClient['invalidateQueries']>
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>

  beforeEach(() => {
    vi.useFakeTimers()
    setVisibility('visible')
    client = new QueryClient()
    invalidate = vi.spyOn(client, 'invalidateQueries')
    getChanges.mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it('asks for a cursor first, then refreshes only what changed', async () => {
    getChanges.mockResolvedValueOnce({ cursor: 'c1', changed: [] }).mockResolvedValueOnce({ cursor: 'c2', changed: ['notifications'] })
    renderHook(() => useLiveUpdates(7), { wrapper })
    await act(async () => {})
    expect(getChanges).toHaveBeenLastCalledWith(7, null)
    expect(invalidate).not.toHaveBeenCalled()

    await act(async () => vi.advanceTimersByTime(LIVE_INTERVAL_MS))
    expect(getChanges).toHaveBeenLastCalledWith(7, 'c1')
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notifications'] })
  })

  it('maps an area to every query it makes stale, once each', async () => {
    getChanges.mockResolvedValue({ cursor: 'c', changed: ['issues', 'projects'] })
    renderHook(() => useLiveUpdates(7), { wrapper })
    await act(async () => {})
    const keys = invalidate.mock.calls.map((call) => String(call[0]?.queryKey?.[0]))
    expect(keys).toEqual(expect.arrayContaining(['issues', 'issue-comments', 'projects', 'teams', 'dashboard']))
    expect(new Set(keys).size).toBe(keys.length) // 'dashboard' belongs to both areas but is refreshed once
  })

  it('does not ask while the tab is hidden, and asks at once when it comes back', async () => {
    getChanges.mockResolvedValue({ cursor: 'c', changed: [] })
    renderHook(() => useLiveUpdates(7), { wrapper })
    await act(async () => {})
    setVisibility('hidden')
    await act(async () => vi.advanceTimersByTime(LIVE_INTERVAL_MS * 5))
    expect(getChanges).toHaveBeenCalledTimes(1)
    await act(async () => setVisibility('visible'))
    expect(getChanges).toHaveBeenCalledTimes(2)
  })

  it('keeps going after a failed check, and stops when unmounted', async () => {
    getChanges.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ cursor: 'c', changed: [] })
    const { unmount } = renderHook(() => useLiveUpdates(7), { wrapper })
    await act(async () => {})
    await act(async () => vi.advanceTimersByTime(LIVE_INTERVAL_MS))
    expect(getChanges).toHaveBeenCalledTimes(2)
    unmount()
    await act(async () => vi.advanceTimersByTime(LIVE_INTERVAL_MS * 3))
    expect(getChanges).toHaveBeenCalledTimes(2)
  })

  it('does nothing without a workspace', async () => {
    renderHook(() => useLiveUpdates(undefined), { wrapper })
    await act(async () => vi.advanceTimersByTime(LIVE_INTERVAL_MS))
    expect(getChanges).not.toHaveBeenCalled()
  })

  describe('with a stream', () => {
    class FakeSource {
      static last: FakeSource | null = null
      listeners: Record<string, (event: MessageEvent<string>) => void> = {}
      onopen: (() => void) | null = null
      onerror: (() => void) | null = null
      closed = false
      url: string
      constructor(url: string) {
        this.url = url
        FakeSource.last = this
      }
      addEventListener(name: string, fn: (event: MessageEvent<string>) => void) {
        this.listeners[name] = fn
      }
      close() {
        this.closed = true
      }
    }

    beforeEach(() => {
      vi.stubGlobal('EventSource', FakeSource)
      getStreamUrl.mockReset().mockResolvedValue('http://api/changes/stream/?ticket=t')
      getChanges.mockResolvedValue({ cursor: 'c', changed: [] })
    })
    afterEach(() => vi.unstubAllGlobals())

    it('refreshes from stream events and pauses polling while it is open', async () => {
      renderHook(() => useLiveUpdates(7, true), { wrapper })
      await act(async () => {})
      const source = FakeSource.last!
      expect(getStreamUrl).toHaveBeenCalledWith(7)
      act(() => source.onopen?.())
      act(() => source.listeners.changes(new MessageEvent('changes', { data: JSON.stringify({ changed: ['invitations'] }) })))
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['invitations'] })
      const calls = getChanges.mock.calls.length
      await act(async () => vi.advanceTimersByTime(LIVE_INTERVAL_MS * 3))
      expect(getChanges).toHaveBeenCalledTimes(calls)
    })

    it('falls back to polling when the stream fails, and tries the stream again later', async () => {
      renderHook(() => useLiveUpdates(7, true), { wrapper })
      await act(async () => {})
      const first = FakeSource.last!
      const calls = getChanges.mock.calls.length
      await act(async () => first.onerror?.())
      expect(first.closed).toBe(true)
      expect(getChanges.mock.calls.length).toBe(calls + 1)
      await act(async () => vi.advanceTimersByTime(STREAM_RETRY_MS))
      expect(getStreamUrl).toHaveBeenCalledTimes(2)
      expect(FakeSource.last).not.toBe(first)
    })
  })
})
