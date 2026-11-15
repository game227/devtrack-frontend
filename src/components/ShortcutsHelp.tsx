import { useEffect } from 'react'
import { useT } from '../i18n'
import { button, kbd } from './ui'

const ROWS: Array<{ keys: string[]; labelKey: string }> = [
  { keys: ['Ctrl', 'K'], labelKey: 'shortcuts.palette' },
  { keys: ['C'], labelKey: 'shortcuts.newIssue' },
  { keys: ['G', 'D'], labelKey: 'shortcuts.goDashboard' },
  { keys: ['G', 'P'], labelKey: 'shortcuts.goProjects' },
  { keys: ['G', 'I'], labelKey: 'shortcuts.goIssues' },
  { keys: ['G', 'T'], labelKey: 'shortcuts.goTeams' },
  { keys: ['G', 'B'], labelKey: 'shortcuts.goBoard' },
  { keys: ['?'], labelKey: 'shortcuts.help' },
]

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const t = useT()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" aria-label={t('cmdk.close')} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-scrim" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('shortcuts.title')}
        className="relative w-full max-w-md animate-scale-in rounded-xl border border-border bg-surface p-5 shadow-float"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <h2 className="text-base font-bold text-fg">{t('shortcuts.title')}</h2>
          <button type="button" autoFocus onClick={onClose} className={button('secondary', 'sm')}>
            {t('common.close')}
          </button>
        </div>
        <dl className="flex flex-col divide-y divide-border">
          {ROWS.map((row) => (
            <div key={row.labelKey} className="flex items-center justify-between gap-4 py-2 text-sm">
              <dt className="text-fg">{t(row.labelKey)}</dt>
              <dd className="flex gap-1">
                {row.keys.map((key) => (
                  <kbd key={key} className={kbd}>
                    {key}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
