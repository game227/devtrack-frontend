import { useT } from '../../i18n'
import type { Activity } from '../../types/activity'
import { describeActivity } from './activityText'

// An activity line with the thing it is about picked out: the issue or project name stands out from the
// sentence around it, so a long feed can be scanned by name. (The whole row is already the link.)
export function ActivitySentence({ activity }: { activity: Activity }) {
  const t = useT()
  const text = describeActivity(activity, t)
  const target = activity.target_display ?? ''
  const at = target && activity.target_type !== 'comment' ? text.indexOf(target) : -1
  if (at < 0) return <span className="text-fg-muted">{text}</span>
  return (
    <span className="text-fg-muted">
      {text.slice(0, at)}
      <span className="font-medium text-fg">{target}</span>
      {text.slice(at + target.length)}
    </span>
  )
}
