import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LIVE_STREAM, getChanges, getStreamUrl } from '../../api/changes'
import type { ChangeArea } from '../../api/changes'

export const LIVE_INTERVAL_MS = 10_000

// Which cached queries each kind of change makes stale (by key prefix).
export const AREA_QUERIES: Record<ChangeArea, string[]> = {
  issues: ['issues', 'issue', 'issue-comments', 'issue-github-links', 'dashboard', 'project-timeline', 'project-health', 'user-analytics', 'search'],
  projects: ['projects', 'project', 'project-comments', 'project-members', 'notes', 'labels', 'cycles', 'milestones', 'teams', 'team-members', 'project-github-link', 'project-health', 'dashboard'],
  members: ['workspace-members', 'workspace-invitations', 'workspaces', 'project-members', 'dashboard'],
  notifications: ['notifications'],
  invitations: ['invitations'],
}

// Keeps what is on screen current with what others change: every LIVE_INTERVAL_MS while the tab is
// visible (and at once when it becomes visible again) it asks the server what changed since the last
// look, and marks only those queries stale. A hidden tab asks nothing. Errors are ignored; the next
// tick tries again.
//
// With a stream (VITE_LIVE_STREAM) changes arrive within seconds over server-sent events instead, and
// polling pauses while the stream is open. Any stream error falls back to polling; a stream that ran
// for a while (the server ends each one after a few minutes) is reopened at once, a failing one after
// STREAM_RETRY_MS.
export const STREAM_RETRY_MS = 60_000
export function useLiveUpdates(workspaceId: number | undefined, stream: boolean = LIVE_STREAM) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (workspaceId === undefined) return undefined
    let cursor: string | null = null
    let timer: number | undefined
    let stopped = false
    let inFlight = false
    let source: EventSource | null = null
    let streaming = false
    let openedAt = 0
    let reopenTimer: number | undefined

    const refresh = (changed: string[]) => {
      const keys = new Set(changed.flatMap((area) => AREA_QUERIES[area as ChangeArea] ?? []))
      for (const key of keys) void queryClient.invalidateQueries({ queryKey: [key] })
    }

    const closeStream = () => {
      source?.close()
      source = null
      streaming = false
    }

    async function openStream() {
      if (!stream || stopped || source || typeof EventSource === 'undefined' || document.visibilityState === 'hidden') return
      try {
        const url = await getStreamUrl(workspaceId!)
        if (stopped || source) return
        const es = new EventSource(url)
        source = es
        es.onopen = () => {
          streaming = true
          openedAt = Date.now()
        }
        es.addEventListener('changes', (event) => {
          try {
            refresh((JSON.parse((event as MessageEvent<string>).data) as { changed: string[] }).changed)
          } catch {
            // a malformed event changes nothing
          }
        })
        es.onerror = () => {
          const ranFor = streaming ? Date.now() - openedAt : 0
          closeStream()
          void check()
          window.clearTimeout(reopenTimer)
          reopenTimer = window.setTimeout(() => void openStream(), ranFor > 30_000 ? 1_000 : STREAM_RETRY_MS)
        }
      } catch {
        window.clearTimeout(reopenTimer)
        reopenTimer = window.setTimeout(() => void openStream(), STREAM_RETRY_MS)
      }
    }

    const schedule = () => {
      window.clearTimeout(timer)
      if (!stopped) timer = window.setTimeout(check, LIVE_INTERVAL_MS)
    }

    async function check() {
      if (stopped || inFlight) return
      if (document.visibilityState === 'hidden' || streaming) return schedule()
      inFlight = true
      try {
        const { cursor: next, changed } = await getChanges(workspaceId!, cursor)
        cursor = next
        refresh(changed)
      } catch {
        // offline, signed out, server restarting: try again on the next tick
      } finally {
        inFlight = false
        schedule()
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void check()
        void openStream()
      } else {
        // A hidden tab holds no connection open.
        closeStream()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    void check()
    void openStream()
    return () => {
      stopped = true
      closeStream()
      window.clearTimeout(timer)
      window.clearTimeout(reopenTimer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [workspaceId, queryClient, stream])
}
