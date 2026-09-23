import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createIssue, listIssues } from '../api/issues'
import { FormField, formInputClass } from '../components/FormField'
import { IssueRow } from '../components/IssueRow'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus, IssueType } from '../types/issue'
import type { Priority } from '../types/project'

const TYPES: IssueType[] = ['task', 'bug', 'feature', 'improvement', 'chore']
const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

export function ProjectIssuesPage() {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<IssueType | ''>('')
  const [mineOnly, setMineOnly] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('none')
  const [errors, setErrors] = useState<FieldErrors>({})

  const issuesQuery = useQuery({
    queryKey: ['issues', projectId, statusFilter, typeFilter, mineOnly],
    queryFn: () =>
      listIssues(
        { project: projectId },
        {
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          assignee: mineOnly ? 'me' : undefined,
        },
      ),
    enabled: Number.isFinite(projectId),
  })

  const createMutation = useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
      setIsFormOpen(false)
      setTitle('')
      setType('task')
      setPriority('none')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate({ project: projectId, title, type, priority })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">{t('issues.title')}</h1>
        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${projectId}/board`}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-fg"
          >
            {t('nav.board')}
          </Link>
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98]"
          >
            {isFormOpen ? t('common.cancel') : t('issues.new')}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <select
          aria-label={t('issues.filterStatus')}
          className={`${formInputClass} mt-0! w-auto!`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IssueStatus | '')}
        >
          <option value="">{t('issues.allStatuses')}</option>
          {ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <select
          aria-label={t('issues.filterType')}
          className={`${formInputClass} mt-0! w-auto!`}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as IssueType | '')}
        >
          <option value="">{t('issues.allTypes')}</option>
          {TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`issueType.${value}`)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-fg-muted">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          {t('issues.assignedToMe')}
        </label>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-md rounded-2xl border border-border bg-bg-elevated p-4">
          {errors.non_field_errors && (
            <p role="alert" className="mb-3 text-sm text-danger">
              {errors.non_field_errors.join(' ')}
            </p>
          )}
          <div className="mb-3">
            <FormField label={t('common.title')} errors={errors.title}>
              <input className={formInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </FormField>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <FormField label={t('common.type')} errors={errors.type}>
              <select className={formInputClass} value={type} onChange={(e) => setType(e.target.value as IssueType)}>
                {TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(`issueType.${value}`)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t('common.priority')} errors={errors.priority}>
              <select
                className={formInputClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {t(`priority.${value}`)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {createMutation.isPending ? t('common.creating') : t('issues.create')}
          </button>
        </form>
      )}

      {issuesQuery.isLoading && <p className="text-sm text-fg-muted">{t('issues.loading')}</p>}
      {issuesQuery.isError && <p className="text-sm text-danger">{t('issues.loadFailed')}</p>}
      {issuesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">{t('issues.empty')}</p>}

      <div className="flex flex-col gap-2">
        {issuesQuery.data?.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
      </div>
    </div>
  )
}
