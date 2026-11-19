import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteTime, listTime, logTime } from '../api/issueTools'
import { describeError } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { formatMinutes } from '../lib/duration'
import { todayIso } from '../lib/schedule'
import { formInputClass } from './FormField'
import { Icon } from './Icon'
import { button } from './ui'

// Time spent on an issue, for the properties panel: the total, who logged what, and a small form.
// Everyone in the workspace logs their own time; only your own entries can be removed.
export function IssueTime({ issueId, userId }: { issueId: number; userId?: number }) {
  const { t, lang, formatDate } = useI18n()
  const queryClient = useQueryClient()
  const key = ['issue-time', issueId]
  const query = useQuery({ queryKey: key, queryFn: () => listTime(issueId) })
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [day, setDay] = useState(todayIso())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const total = (query.data ?? []).reduce((sum, entry) => sum + entry.minutes, 0)
  const amount = (Number(hours) || 0) * 60 + (Number(minutes) || 0)

  const add = useMutation({
    mutationFn: () => logTime(issueId, { minutes: Math.round(amount), note: note.trim(), spent_on: day }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
      setHours('')
      setMinutes('')
      setNote('')
      setError(null)
      setOpen(false)
    },
    onError: (e) => setError(describeError(e, lang)),
  })
  const remove = useMutation({ mutationFn: deleteTime, onSettled: () => void queryClient.invalidateQueries({ queryKey: key }) })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (amount < 1) {
      setError(t('time.needAmount'))
      return
    }
    add.mutate()
  }

  const entries = query.data ?? []
  const shown = showAll ? entries : entries.slice(0, 3)

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-fg tabular">{total ? formatMinutes(t, total) : t('time.none')}</span>
        {!open && (
          <button id="issue-log-time" type="button" onClick={() => setOpen(true)} className={button('ghost', 'sm')}>
            <Icon name="plus" className="h-3.5 w-3.5" />
            {t('time.log')}
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="mt-2 space-y-2" aria-label={t('time.log')}>
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-fg-muted">
              {t('time.hours')}
              <input type="number" min={0} max={24} inputMode="numeric" value={hours} autoFocus onChange={(e) => setHours(e.target.value)} className={`${formInputClass} mt-1!`} />
            </label>
            <label className="flex-1 text-xs text-fg-muted">
              {t('time.minutes')}
              <input type="number" min={0} max={59} step={5} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${formInputClass} mt-1!`} />
            </label>
          </div>
          <label className="block text-xs text-fg-muted">
            {t('time.day')}
            <input type="date" max={todayIso()} value={day} onChange={(e) => setDay(e.target.value)} className={`${formInputClass} mt-1!`} />
          </label>
          <label className="block text-xs text-fg-muted">
            {t('time.note')}
            <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder={t('time.notePlaceholder')} className={`${formInputClass} mt-1!`} />
          </label>
          {error && (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={add.isPending} className={button('primary', 'sm')}>
              {t('common.save')}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={button('ghost', 'sm')}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
      {entries.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {shown.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-2 text-xs">
              <span className="min-w-0 text-fg-muted">
                <span className="font-semibold text-fg">{formatMinutes(t, entry.minutes)}</span> · {entry.user.username} · {formatDate(entry.spent_on)}
                {entry.note && <span className="block truncate">{entry.note}</span>}
              </span>
              {entry.user.id === userId && (
                <button
                  type="button"
                  onClick={() => remove.mutate(entry.id)}
                  aria-label={t('time.remove', { amount: formatMinutes(t, entry.minutes) })}
                  className="shrink-0 rounded p-0.5 text-fg-muted hover:text-danger"
                >
                  <Icon name="close" className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
          {entries.length > 3 && (
            <li>
              <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-medium text-fg-muted underline-offset-2 hover:underline">
                {showAll ? t('time.fewer') : t('time.all', { count: entries.length })}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
