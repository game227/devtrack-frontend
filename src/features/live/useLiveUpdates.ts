import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getChanges } from '../../api/changes'
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
export function useLiveUpdates(workspaceId: number | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (workspaceId === undefined) return undefined
    let cursor: string | null = null
    let timer: number | undefined
    let stopped = false
    let inFlight = false

    const schedule = () => {
      window.clearTimeout(timer)
      if (!stopped) timer = window.setTimeout(check, LIVE_INTERVAL_MS)
    }

    async function check() {
      if (stopped || inFlight) return
      if (document.visibilityState === 'hidden') return schedule()
      inFlight = true
      try {
        const { cursor: next, changed } = await getChanges(workspaceId!, cursor)
        cursor = next
        const keys = new Set(changed.flatMap((area) => AREA_QUERIES[area] ?? []))
        for (const key of keys) void queryClient.invalidateQueries({ queryKey: [key] })
      } catch {
        // offline, signed out, server restarting: try again on the next tick
      } finally {
        inFlight = false
        schedule()
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVisibility)
    void check()
    return () => {
      stopped = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [workspaceId, queryClient])
}
