import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addChecklistItem, deleteChecklistItem, listChecklist, updateChecklistItem } from '../api/issueParts'
import { describeError } from '../features/auth/errors'
import { useI18n } from '../i18n'
import type { ChecklistItem } from '../types/issue'
import { formInputClass } from './FormField'
import { Icon } from './Icon'
import { TrackProgress } from './Track'
import { button } from './ui'

// The issue's steps. Ticking is instant (optimistic); anyone in the workspace sees the list, the
// creator and the assignee change it.
export function IssueChecklist({ issueId, canChange, autoFocus = false }: { issueId: number; canChange: boolean; autoFocus?: boolean }) {
  const { t, lang } = useI18n()
  const queryClient = useQueryClient()
  const key = ['issue-checklist', issueId]
  const query = useQuery({ queryKey: key, queryFn: () => listChecklist(issueId) })
  const items = query.data ?? []
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const refreshCounts = () => {
    void queryClient.invalidateQueries({ queryKey: key })
    void queryClient.invalidateQueries({ queryKey: ['issues'] })
    void queryClient.invalidateQueries({ queryKey: ['board'] })
  }

  const add = useMutation({
    mutationFn: (value: string) => addChecklistItem(issueId, value),
    onSuccess: () => {
      setText('')
      setError(null)
      refreshCounts()
    },
    onError: (e) => setError(describeError(e, lang)),
  })

  const toggle = useMutation({
    mutationFn: (item: ChecklistItem) => updateChecklistItem(item.id, { done: !item.done }),
    // The tick shows at once: the cache is updated before anything is awaited, so the checkbox never
    // flips back for a moment while the request starts. A refetch already running is dropped without
    // reverting (its answer would predate this change).
    onMutate: (item) => {
      void queryClient.cancelQueries({ queryKey: key }, { revert: false })
      const previous = queryClient.getQueryData<ChecklistItem[]>(key)
      queryClient.setQueryData<ChecklistItem[]>(key, (old) => old?.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))
      return { previous }
    },
    onError: (e, _item, context) => {
      queryClient.setQueryData(key, context?.previous)
      setError(describeError(e, lang))
    },
    onSettled: refreshCounts,
  })

  const remove = useMutation({ mutationFn: (item: ChecklistItem) => deleteChecklistItem(item.id), onSettled: refreshCounts })

  if (!query.isSuccess || (items.length === 0 && !canChange)) return null

  const done = items.filter((item) => item.done).length

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const value = text.trim()
    if (value) add.mutate(value)
  }

  return (
    <section aria-labelledby="issue-checklist">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="issue-checklist" className="text-base font-semibold tracking-[-0.01em] text-fg">
          {t('checklist.title')}
        </h2>
        {items.length > 0 && <span className="font-mono text-xs text-fg-muted tabular">{t('checklist.progress', { done, total: items.length })}</span>}
      </div>
      {items.length > 0 && <TrackProgress percent={(done / items.length) * 100} label={t('checklist.title')} className="mb-3" />}
      {items.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center gap-3 px-4 py-2.5">
              <input
                type="checkbox"
                checked={item.done}
                disabled={!canChange}
                onChange={() => toggle.mutate(item)}
                aria-label={item.text}
                className="h-4 w-4 shrink-0 accent-[var(--color-fg)]"
              />
              <span className={`min-w-0 flex-1 break-words text-[15px] ${item.done ? 'text-fg-muted line-through decoration-fg/30' : 'text-fg'}`}>{item.text}</span>
              {canChange && (
                <button
                  type="button"
                  onClick={() => remove.mutate(item)}
                  aria-label={t('checklist.remove', { text: item.text })}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-muted opacity-60 transition-opacity hover:bg-fg/[0.07] hover:text-fg hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canChange && (
        <form onSubmit={handleAdd} className="mt-2 flex gap-2">
          <input
            aria-label={t('checklist.add')}
            placeholder={t('checklist.placeholder')}
            autoFocus={autoFocus}
            className={`${formInputClass} mt-0! flex-1`}
            value={text}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" disabled={!text.trim() || add.isPending} className={button('secondary')}>
            <Icon name="plus" />
            {t('checklist.add')}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  )
}
