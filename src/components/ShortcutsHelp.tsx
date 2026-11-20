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

// Only on an issue's page.
const ISSUE_ROWS: Array<{ keys: string[]; labelKey: string }> = [
  { keys: ['S'], labelKey: 'shortcuts.issue.status' },
  { keys: ['A'], labelKey: 'shortcuts.issue.assignee' },
  { keys: ['P'], labelKey: 'shortcuts.issue.priority' },
  { keys: ['E'], labelKey: 'shortcuts.issue.edit' },
  { keys: ['M'], labelKey: 'shortcuts.issue.comment' },
  { keys: ['T'], labelKey: 'shortcuts.issue.time' },
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
        className="relative w-full max-w-md animate-scale-in glass rounded-xl p-5 shadow-float"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-fg">{t('shortcuts.title')}</h2>
          <button type="button" autoFocus onClick={onClose} className={button('secondary', 'sm')}>
            {t('common.close')}
          </button>
        </div>
        <dl className="flex flex-col divide-y divide-border">
          {[...ROWS, ...ISSUE_ROWS].map((row, index) => (
            <div key={row.labelKey} className="flex items-center justify-between gap-4 py-2 text-sm">
              <dt className="text-fg">
                {index === ROWS.length && <span className="mb-1 block text-xs font-semibold text-fg-muted">{t('shortcuts.issue.section')}</span>}
                {t(row.labelKey)}
              </dt>
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
