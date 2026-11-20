import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bulkUpdate } from '../api/issueTools'
import type { BulkChanges } from '../api/issueTools'
import { listProjectMembers } from '../api/projects'
import { useToast } from '../features/toast/toastContext'
import { useI18n } from '../i18n'
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from '../types/issue'
import { formInputClass } from './FormField'
import { button } from './ui'

const select = `${formInputClass} mt-0! h-9! w-auto! py-0! text-sm`

// Shown while issues are ticked: one change for all of them. Each issue is checked on the server like a
// single edit; the ones the user may not change are skipped and counted in the message.
export function BulkBar({
  ids,
  projectId,
  onAll,
  allSelected,
  onClear,
}: {
  ids: number[]
  projectId?: number
  onAll: () => void
  allSelected: boolean
  onClear: () => void
}) {
  const { t } = useI18n()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [field, setField] = useState<'status' | 'priority' | 'assignee_id'>('status')
  const [value, setValue] = useState('')
  const members = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers(projectId!),
    enabled: projectId !== undefined && field === 'assignee_id',
  })

  const apply = useMutation({
    mutationFn: (changes: BulkChanges) => bulkUpdate(ids, changes),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      const skipped = result.skipped.length
      toast({
        text: skipped
          ? t('bulk.doneSome', { updated: result.updated.length, skipped })
          : t('bulk.done', { count: result.updated.length }),
        tone: skipped ? 'info' : 'success',
      })
      setValue('')
      onClear()
    },
    onError: () => toast({ text: t('bulk.failed'), tone: 'error' }),
  })

  function submit() {
    if (field === 'assignee_id') apply.mutate({ assignee_id: value === 'none' ? null : Number(value) })
    else apply.mutate({ [field]: value } as BulkChanges)
  }

  return (
    <div
      role="region"
      aria-label={t('bulk.title')}
      className="glass-menu sticky bottom-4 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 text-sm shadow-float animate-scale-in"
    >
      <span className="font-semibold text-fg">{t('bulk.selected', { count: ids.length })}</span>
      <button type="button" onClick={allSelected ? onClear : onAll} className={button('ghost', 'sm')}>
        {allSelected ? t('bulk.none') : t('bulk.all')}
      </button>
      <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
      <select
        aria-label={t('bulk.field')}
        className={select}
        value={field}
        onChange={(e) => {
          setField(e.target.value as typeof field)
          setValue('')
        }}
      >
        <option value="status">{t('common.status')}</option>
        <option value="priority">{t('common.priority')}</option>
        {projectId !== undefined && <option value="assignee_id">{t('common.assignee')}</option>}
      </select>
      <select aria-label={t('bulk.value')} className={select} value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">{t('bulk.choose')}</option>
        {field === 'status' && ISSUE_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        {field === 'priority' && ISSUE_PRIORITIES.map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
        {field === 'assignee_id' && (
          <>
            <option value="none">{t('common.unassigned')}</option>
            {members.data?.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.username}
              </option>
            ))}
          </>
        )}
      </select>
      <button type="button" onClick={submit} disabled={!value || apply.isPending} className={button('primary', 'sm')}>
        {t('bulk.apply')}
      </button>
      <p className="w-full text-xs text-fg-muted">{t('bulk.hint')}</p>
    </div>
  )
}
