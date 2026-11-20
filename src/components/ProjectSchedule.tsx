import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProject } from '../api/projects'
import { extractFieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { addDays, computeSchedule, todayIso } from '../lib/schedule'
import type { Project } from '../types/project'
import { FormField, formInputClass } from './FormField'
import { Icon } from './Icon'
import { button, panel, sectionTitle } from './ui'
import { Spinner } from './Spinner'

const PRESETS: Array<{ key: string; days: number }> = [
  { key: 'schedule.preset.2w', days: 13 },
  { key: 'schedule.preset.1m', days: 29 },
  { key: 'schedule.preset.3m', days: 89 },
]

// The project's start and target dates, what they mean today, and (for the people who manage the
// project) a small form to set them.
export function ProjectSchedule({ project, canManage }: { project: Project; canManage: boolean }) {
  const { t, lang, formatDate } = useI18n()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [start, setStart] = useState('')
  const [target, setTarget] = useState('')
  const [error, setError] = useState<string | null>(null)

  const closed = project.status === 'completed' || project.status === 'archived'
  const schedule = computeSchedule(project.start_date, project.target_date, closed)

  const save = useMutation({
    mutationFn: (dates: { start_date: string | null; target_date: string | null }) => updateProject(project.id, dates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['project', project.id], updated)
      void queryClient.invalidateQueries({ queryKey: ['project-health', project.id] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditing(false)
    },
    onError: (e) => setError(Object.values(extractFieldErrors(e, lang)).flat().join(' ')),
  })

  function open() {
    setStart(project.start_date ?? (project.target_date ? '' : todayIso()))
    setTarget(project.target_date ?? '')
    setError(null)
    setEditing(true)
  }

  const tooEarly = Boolean(start && target && target < start)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (tooEarly) return
    save.mutate({ start_date: start || null, target_date: target || null })
  }

  const status = (() => {
    switch (schedule.state) {
      case 'running':
        return { tone: 'text-fg', text: t('schedule.running', { day: schedule.dayNumber, total: schedule.totalDays, left: schedule.days }) }
      case 'dueToday':
        return { tone: 'text-warning', text: t('schedule.dueToday') }
      case 'overdue':
        return { tone: 'text-danger', text: t('schedule.overdue', { days: schedule.days }) }
      case 'upcoming':
        return { tone: 'text-fg', text: t('schedule.upcoming', { days: schedule.days }) }
      case 'startOnly':
        return { tone: 'text-fg-muted', text: t('schedule.startOnly') }
      case 'targetOnly':
        return { tone: 'text-fg', text: t('schedule.targetOnly', { days: schedule.days }) }
      case 'closed':
        return { tone: 'text-fg-muted', text: t('schedule.closed') }
      default:
        return null
    }
  })()

  const both = Boolean(project.start_date && project.target_date)

  return (
    <section aria-labelledby="project-schedule" className={`${panel} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="project-schedule" className={sectionTitle}>
            {t('schedule.title')}
          </h2>
          {status && <p className={`mt-1 text-sm font-medium ${status.tone}`}>{status.text}</p>}
        </div>
        {canManage && !editing && schedule.state !== 'none' && (
          <button type="button" onClick={open} className={button('ghost', 'sm')}>
            {t('schedule.edit')}
          </button>
        )}
      </div>

      {!editing && schedule.state === 'none' && (
        <div className="mt-3 rounded-xl border border-dashed border-border-strong p-4">
          <p className="text-sm font-medium text-fg">{t('schedule.emptyTitle')}</p>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{t('schedule.emptyText')}</p>
          {canManage ? (
            <button type="button" onClick={open} className={`mt-3 ${button('primary', 'sm')}`}>
              <Icon name="cycles" className="h-4 w-4" />
              {t('schedule.set')}
            </button>
          ) : (
            <p className="mt-3 text-xs text-fg-muted">{t('schedule.onlyManagers')}</p>
          )}
        </div>
      )}

      {!editing && schedule.state !== 'none' && (
        <div className="mt-4">
          <dl className="flex items-start justify-between gap-4 text-sm">
            <div>
              <dt className="text-xs text-fg-muted">{t('common.startDate')}</dt>
              <dd className="mt-0.5 font-semibold text-fg">{project.start_date ? formatDate(project.start_date) : t('schedule.noDate')}</dd>
            </div>
            <div className="text-right">
              <dt className="text-xs text-fg-muted">{t('common.targetDate')}</dt>
              <dd className={`mt-0.5 font-semibold ${schedule.state === 'overdue' ? 'text-danger' : 'text-fg'}`}>
                {project.target_date ? formatDate(project.target_date) : t('schedule.noDate')}
              </dd>
            </div>
          </dl>
          {both && (
            <div
              className="relative mt-3 h-4"
              role="img"
              aria-label={status?.text ?? ''}
            >
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-border" />
              <span
                className={`absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full ${schedule.state === 'overdue' ? 'bg-danger' : 'bg-fg'}`}
                style={{ width: `${schedule.percent}%` }}
              />
              <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-fg ring-2 ring-surface" />
              <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-fg bg-surface" />
              {(schedule.state === 'running' || schedule.state === 'dueToday') && (
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange ring-[3px] ring-surface"
                  style={{ left: `${schedule.percent}%` }}
                  title={t('schedule.today')}
                />
              )}
            </div>
          )}
          {!both && canManage && (
            <p className="mt-3 text-xs text-fg-muted">{t(project.start_date ? 'schedule.addTarget' : 'schedule.addStart')}</p>
          )}
        </div>
      )}

      {editing && (
        <form onSubmit={submit} className="mt-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={t('common.startDate')}>
              <input type="date" className={formInputClass} value={start} max={target || undefined} onChange={(e) => setStart(e.target.value)} />
            </FormField>
            <FormField label={t('common.targetDate')}>
              <input
                type="date"
                className={formInputClass}
                value={target}
                min={start || undefined}
                aria-invalid={tooEarly}
                aria-describedby="schedule-hint"
                onChange={(e) => setTarget(e.target.value)}
              />
            </FormField>
          </div>
          {start && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
              <span>{t('schedule.presets')}</span>
              {PRESETS.map((preset) => (
                <button key={preset.key} type="button" onClick={() => setTarget(addDays(start, preset.days))} className="rounded-full border border-border px-2.5 py-1 font-medium text-fg hover:border-border-strong">
                  {t(preset.key)}
                </button>
              ))}
            </div>
          )}
          <p id="schedule-hint" className={`mt-2 text-xs ${tooEarly ? 'text-danger' : 'text-fg-muted'}`} role={tooEarly ? 'alert' : undefined}>
            {tooEarly ? t('schedule.tooEarly') : t('schedule.hint')}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button aria-busy={save.isPending} type="submit" disabled={tooEarly || save.isPending} className={button('primary', 'sm')}>
              {save.isPending && <Spinner />}
{t('common.save')}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={button('ghost', 'sm')}>
              {t('common.cancel')}
            </button>
            {(project.start_date || project.target_date) && (
              <button
                type="button"
                onClick={() => save.mutate({ start_date: null, target_date: null })}
                className={`${button('ghost', 'sm')} ml-auto text-fg-muted`}
              >
                {t('schedule.clear')}
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
