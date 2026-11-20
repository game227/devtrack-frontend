import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRecurring, deleteRecurring, listRecurring, updateRecurring } from '../api/issueTools'
import type { RecurringRule } from '../api/issueTools'
import { listProjectMembers } from '../api/projects'
import { extractFieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { todayIso } from '../lib/schedule'
import { FormField, formInputClass } from './FormField'
import { Icon } from './Icon'
import { button } from './ui'

const FREQUENCIES: RecurringRule['frequency'][] = ['daily', 'weekly', 'monthly']

// Issues that open themselves on a schedule ("Weekly report" every Monday). Everyone sees the rules;
// the project's managers add, pause and remove them. The server opens due issues each morning.
export function RecurringIssues({ projectId, canManage }: { projectId: number; canManage: boolean }) {
  const { t, lang, formatDate } = useI18n()
  const queryClient = useQueryClient()
  const key = ['recurring', projectId]
  const rules = useQuery({ queryKey: key, queryFn: () => listRecurring(projectId) })
  const members = useQuery({ queryKey: ['project-members', projectId], queryFn: () => listProjectMembers(projectId), enabled: canManage })
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState<RecurringRule['frequency']>('weekly')
  const [firstDay, setFirstDay] = useState(todayIso())
  const [assignee, setAssignee] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const refresh = () => void queryClient.invalidateQueries({ queryKey: key })
  const create = useMutation({
    mutationFn: () =>
      createRecurring(projectId, {
        title: title.trim(),
        frequency,
        next_run: firstDay,
        assignee_id: assignee ? Number(assignee) : null,
        type: 'task',
        priority: 'none',
      }),
    onSuccess: () => {
      refresh()
      setAdding(false)
      setTitle('')
      setAssignee('')
      setErrors({})
    },
    onError: (e) => setErrors(extractFieldErrors(e, lang)),
  })
  const toggle = useMutation({ mutationFn: (rule: RecurringRule) => updateRecurring(rule.id, { active: !rule.active }), onSettled: refresh })
  const remove = useMutation({ mutationFn: (rule: RecurringRule) => deleteRecurring(rule.id), onSettled: refresh })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setErrors({ title: [t('error.blank')] })
      return
    }
    create.mutate()
  }

  const list = rules.data ?? []
  if (!rules.isSuccess || (list.length === 0 && !canManage)) return null

  return (
    <section aria-labelledby="recurring-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="recurring-title" className="text-base font-semibold tracking-[-0.01em] text-fg">
          {t('recurring.title')}
        </h2>
        {canManage && !adding && (
          <button type="button" onClick={() => setAdding(true)} className={button('ghost', 'sm')}>
            <Icon name="plus" className="h-3.5 w-3.5" />
            {t('recurring.add')}
          </button>
        )}
      </div>
      {list.length === 0 && !adding && <p className="text-sm text-fg-muted">{t('recurring.empty')}</p>}
      {list.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel">
          {list.map((rule) => (
            <li key={rule.id} className="px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className={`min-w-0 font-semibold ${rule.active ? 'text-fg' : 'text-fg-muted line-through decoration-fg/30'}`}>{rule.title}</span>
                {canManage && (
                  <span className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => toggle.mutate(rule)} className={button('ghost', 'sm')}>
                      {t(rule.active ? 'recurring.pause' : 'recurring.resume')}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(rule)}
                      aria-label={t('recurring.remove', { title: rule.title })}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-fg-muted">
                {t(`recurring.every.${rule.frequency}`)}
                {rule.assignee ? ` · ${rule.assignee.username}` : ''}
                {' · '}
                {rule.active ? t('recurring.next', { date: formatDate(rule.next_run) }) : t('recurring.paused')}
              </p>
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <form onSubmit={submit} className="mt-2 space-y-3 rounded-xl border border-edge bg-surface p-4 shadow-panel" aria-label={t('recurring.add')}>
          <FormField label={t('common.title')} errors={errors.title}>
            <input className={formInputClass} value={title} maxLength={255} autoFocus onChange={(e) => setTitle(e.target.value)} placeholder={t('recurring.placeholder')} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('recurring.frequency')} errors={errors.frequency}>
              <select className={formInputClass} value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringRule['frequency'])}>
                {FREQUENCIES.map((value) => (
                  <option key={value} value={value}>
                    {t(`recurring.every.${value}`)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t('recurring.first')} errors={errors.next_run}>
              <input type="date" className={formInputClass} min={todayIso()} value={firstDay} onChange={(e) => setFirstDay(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('common.assignee')} errors={errors.assignee_id}>
            <select className={formInputClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">{t('common.unassigned')}</option>
              {members.data?.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.username}
                </option>
              ))}
            </select>
          </FormField>
          <p className="text-xs text-fg-muted">{t('recurring.hint')}</p>
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending} className={button('primary', 'sm')}>
              {t('common.save')}
            </button>
            <button type="button" onClick={() => setAdding(false)} className={button('ghost', 'sm')}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
