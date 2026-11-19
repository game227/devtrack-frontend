import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { Icon } from './Icon'

// "✓ Saved" for a couple of seconds after each save: `signal` goes up by one per successful save. The
// live region is always there, so screen readers hear it too.
export function SavedNote({ signal, className = '' }: { signal: number; className?: string }) {
  const t = useT()
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (signal === 0) return undefined
    const show = window.setTimeout(() => setShown(signal), 0)
    const hide = window.setTimeout(() => setShown(0), 2200)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [signal])
  return (
    <span role="status" className={className}>
      {shown > 0 && (
        <span key={shown} className="inline-flex animate-fade-in items-center gap-1 text-xs font-semibold text-success">
          <Icon name="check" size={13} className="animate-pop" />
          {t('common.saved')}
        </span>
      )}
    </span>
  )
}
