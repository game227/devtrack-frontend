import { useEffect } from 'react'
import { useT } from '../i18n'

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
      <button type="button" aria-label={t('cmdk.close')} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('shortcuts.title')}
        className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-bg-elevated p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">{t('shortcuts.title')}</h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-fg-muted transition-colors duration-150 hover:text-fg"
          >
            {t('common.close')}
          </button>
        </div>
        <dl className="flex flex-col gap-2">
          {ROWS.map((row) => (
            <div key={row.labelKey} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-fg-muted">{t(row.labelKey)}</dt>
              <dd className="flex gap-1">
                {row.keys.map((key) => (
                  <kbd key={key} className="rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-fg">
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
