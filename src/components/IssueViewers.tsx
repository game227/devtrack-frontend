import { useEffect, useState } from 'react'
import { sendPresence } from '../api/changes'
import type { Viewer } from '../api/changes'
import { useT } from '../i18n'
import { Avatar } from './Avatar'

const BEAT_MS = 20_000

// "Also here": who else has this issue open right now. A heartbeat every 20 s while the tab is visible
// says we are here too; it stops when the page closes or the tab hides.
export function IssueViewers({ issueId }: { issueId: number }) {
  const t = useT()
  const [viewers, setViewers] = useState<Viewer[]>([])

  useEffect(() => {
    let stopped = false
    let timer: number | undefined
    async function beat() {
      window.clearTimeout(timer)
      if (stopped) return
      if (document.visibilityState === 'visible') {
        try {
          const next = await sendPresence(issueId)
          if (!stopped) setViewers(next)
        } catch {
          // presence is a nicety; try again next beat
        }
      }
      if (!stopped) timer = window.setTimeout(beat, BEAT_MS)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void beat()
    }
    document.addEventListener('visibilitychange', onVisibility)
    void beat()
    return () => {
      stopped = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [issueId])

  if (viewers.length === 0) return null
  const names = viewers.map((viewer) => viewer.username).join(', ')
  return (
    <div className="flex items-center gap-2 text-sm text-fg-muted" role="status">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
      </span>
      <span className="flex -space-x-1.5" aria-hidden="true">
        {viewers.slice(0, 4).map((viewer) => (
          <span key={viewer.id} className="rounded-full ring-2 ring-bg" title={viewer.username}>
            <Avatar name={viewer.username} src={viewer.avatar} size={22} />
          </span>
        ))}
      </span>
      <span>{t('presence.viewing', { names })}</span>
    </div>
  )
}
