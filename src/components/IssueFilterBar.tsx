import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { exportIssues } from '../api/issues'
import { listLabels } from '../api/labels'
import { createSavedView, deleteSavedView, listSavedViews } from '../api/savedViews'
import type { FilterKey, ListFilters, ListScope } from '../api/savedViews'
import { describeError } from '../features/auth/errors'
import { sameFilters } from '../features/issues/useIssueFilters'
import { useToast } from '../features/toast/toastContext'
import { useI18n } from '../i18n'
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from '../types/issue'
import { formInputClass } from './FormField'
import { Icon } from './Icon'
import { button } from './ui'

const select = `${formInputClass} mt-0! h-9! w-auto! py-0! text-sm`

// Filters, saved views and the CSV export of an issue list (one workspace's, or one project's).
export function IssueFilterBar({
  scope,
  workspaceId,
  filters,
  onFilter,
  onApply,
  count,
}: {
  scope: ListScope
  workspaceId: number
  filters: ListFilters
  onFilter: (key: FilterKey, value: string) => void
  onApply: (filters: ListFilters) => void
  count?: number
}) {
  const { t, lang } = useI18n()
  const toast = useToast()
  const queryClient = useQueryClient()
  const projectId = 'project' in scope ? scope.project : null
  const viewsKey = ['savedViews', projectId === null ? `w${workspaceId}` : `p${projectId}`]

  const labelsQuery = useQuery({
    queryKey: ['labels', workspaceId],
    queryFn: () => listLabels({ workspace: workspaceId }),
  })
  const labels = (labelsQuery.data ?? []).filter((label) => projectId === null || label.project === null || label.project === projectId)

  const viewsQuery = useQuery({ queryKey: viewsKey, queryFn: () => listSavedViews(scope) })
  const views = viewsQuery.data ?? []

  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  const saveView = useMutation({
    mutationFn: (viewName: string) => createSavedView(scope, viewName, filters),
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: viewsKey })
      setNaming(false)
      setName('')
      toast({ text: t('issues.viewSaved', { name: view.name }) })
    },
    onError: (error) => setNameError(describeError(error, lang) || t('issues.viewFailed')),
  })

  const removeView = useMutation({
    mutationFn: (view: { id: number; name: string }) => deleteSavedView(view.id),
    onSuccess: (_, view) => {
      void queryClient.invalidateQueries({ queryKey: viewsKey })
      toast({ text: t('issues.viewDeleted', { name: view.name }), tone: 'info' })
    },
  })

  const exportList = useMutation({
    mutationFn: () => exportIssues(scope, filters, lang),
    onSuccess: (file) => toast({ text: t('issues.exported', { file }) }),
    onError: (error) =>
      toast({ text: t(isAxiosError(error) && error.response?.status === 429 ? 'issues.exportLimited' : 'issues.exportFailed'), tone: 'error' }),
  })

  const isFiltered = Object.keys(filters).length > 0
  const activeView = views.find((view) => sameFilters(view.filters, filters))

  function handleSave(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setNameError(null)
    saveView.mutate(trimmed)
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label={t('issues.filterStatus')} className={select} value={filters.status ?? ''} onChange={(e) => onFilter('status', e.target.value)}>
          <option value="">{t('issues.allStatuses')}</option>
          {ISSUE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`status.${value}`)}
            </option>
          ))}
        </select>
        <select aria-label={t('issues.filterType')} className={select} value={filters.type ?? ''} onChange={(e) => onFilter('type', e.target.value)}>
          <option value="">{t('issues.allTypes')}</option>
          {ISSUE_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`issueType.${value}`)}
            </option>
          ))}
        </select>
        <select aria-label={t('issues.filterPriority')} className={select} value={filters.priority ?? ''} onChange={(e) => onFilter('priority', e.target.value)}>
          <option value="">{t('issues.allPriorities')}</option>
          {ISSUE_PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {t(`priority.${value}`)}
            </option>
          ))}
        </select>
        {(labels.length > 0 || filters.label) && (
          <select aria-label={t('issues.filterLabel')} className={select} value={filters.label ?? ''} onChange={(e) => onFilter('label', e.target.value)}>
            <option value="">{t('issues.allLabels')}</option>
            {labels.map((label) => (
              <option key={label.id} value={String(label.id)}>
                {label.name}
              </option>
            ))}
          </select>
        )}
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-fg-muted hover:text-fg">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-fg)]"
            checked={filters.assignee === 'me'}
            onChange={(e) => onFilter('assignee', e.target.checked ? 'me' : '')}
          />
          {t('issues.assignedToMe')}
        </label>
        {isFiltered && (
          <button type="button" onClick={() => onApply({})} className={button('ghost', 'sm')}>
            <Icon name="close" className="h-3.5 w-3.5" />
            {t('issues.clearFilters')}
          </button>
        )}
        <div className="ml-auto flex items-center gap-3">
          {count !== undefined && <span className="text-sm text-fg-muted tabular">{t('issues.count', { count })}</span>}
          <button
            type="button"
            onClick={() => exportList.mutate()}
            disabled={exportList.isPending}
            aria-busy={exportList.isPending}
            className={button('secondary', 'sm')}
          >
            <Icon name="download" className="h-4 w-4" />
            {exportList.isPending ? t('issues.exporting') : t('issues.export')}
          </button>
        </div>
      </div>

      <div role="group" aria-label={t('issues.views')} className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
          <Icon name="bookmark" className="h-3.5 w-3.5" />
          {t('issues.views')}
        </span>
        {views.map((view) => {
          const active = view.id === activeView?.id
          return (
            <span
              key={view.id}
              className={`inline-flex h-8 items-center rounded-full border text-sm transition-colors ${
                active ? 'border-fg bg-fg text-bg' : 'border-border bg-surface/70 text-fg hover:border-border-strong'
              }`}
            >
              <button type="button" aria-pressed={active} onClick={() => onApply(view.filters)} className="h-full rounded-l-full pl-3 pr-1.5 font-medium">
                {view.name}
              </button>
              <button
                type="button"
                aria-label={t('issues.deleteView', { name: view.name })}
                onClick={() => removeView.mutate(view)}
                className={`mr-1 flex h-6 w-6 items-center justify-center rounded-full ${active ? 'hover:bg-white/15' : 'text-fg-muted hover:bg-fg/[0.08] hover:text-fg'}`}
              >
                <Icon name="close" className="h-3 w-3" />
              </button>
            </span>
          )
        })}
        {views.length === 0 && !isFiltered && <span className="text-sm text-fg-muted">{t('issues.viewsHint')}</span>}
        {isFiltered && !activeView && !naming && (
          <button type="button" onClick={() => setNaming(true)} className={`${button('ghost', 'sm')} rounded-full border border-dashed border-border-strong`}>
            <Icon name="plus" className="h-3.5 w-3.5" />
            {t('issues.saveView')}
          </button>
        )}
        {naming && (
          <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
            <input
              aria-label={t('issues.viewName')}
              placeholder={t('issues.viewName')}
              className={`${formInputClass} mt-0! h-8! w-48! py-0! text-sm`}
              value={name}
              maxLength={60}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setNaming(false)
              }}
            />
            <button type="submit" disabled={!name.trim() || saveView.isPending} className={button('primary', 'sm')}>
              {t('common.save')}
            </button>
            <button type="button" onClick={() => setNaming(false)} className={button('ghost', 'sm')}>
              {t('common.cancel')}
            </button>
            {nameError && (
              <span role="alert" className="text-sm text-danger">
                {nameError}
              </span>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
