import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createIssue, listIssues } from '../api/issues'
import { PriorityBadge } from '../components/Badge'
import { FormField, formInputClass } from '../components/FormField'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus, IssueType } from '../types/issue'
import type { Priority } from '../types/project'

const TYPES: IssueType[] = ['task', 'bug', 'feature', 'improvement', 'chore']
const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

export function ProjectIssuesPage() {
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
    onError: (error) => setErrors(extractFieldErrors(error)),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate({ project: projectId, title, type, priority })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">Issues</h1>
        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${projectId}/board`}
            className="rounded border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-fg"
          >
            Board
          </Link>
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            className="rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98]"
          >
            {isFormOpen ? 'Cancel' : 'New issue'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <select
          className={formInputClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IssueStatus | '')}
        >
          <option value="">All statuses</option>
          {ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          className={formInputClass}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as IssueType | '')}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-fg-muted">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          Assigned to me
        </label>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 max-w-md rounded border border-border bg-bg-elevated p-4"
        >
          {errors.non_field_errors && (
            <p className="mb-3 text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
          )}
          <div className="mb-3">
            <FormField label="Title" errors={errors.title}>
              <input
                className={formInputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <FormField label="Type" errors={errors.type}>
              <select className={formInputClass} value={type} onChange={(e) => setType(e.target.value as IssueType)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Priority" errors={errors.priority}>
              <select
                className={formInputClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {createMutation.isPending ? 'Creating…' : 'Create issue'}
          </button>
        </form>
      )}

      {issuesQuery.isLoading && <p className="text-sm text-fg-muted">Loading issues…</p>}
      {issuesQuery.isError && (
        <p className="text-sm text-red-400">Couldn't load issues. Is the backend running?</p>
      )}
      {issuesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">No issues yet.</p>}

      <div className="flex flex-col gap-2">
        {issuesQuery.data?.map((issue) => (
          <Link
            key={issue.id}
            to={`/issues/${issue.id}`}
            className="flex items-center justify-between rounded border border-border bg-bg-elevated px-4 py-3 transition-colors duration-150 hover:border-fg"
          >
            <div>
              <div className="text-sm font-medium text-fg">{issue.title}</div>
              <div className="text-xs text-fg-muted">
                {issue.type} · {issue.status.replace('_', ' ')}
                {issue.assignee && ` · ${issue.assignee.username}`}
              </div>
            </div>
            <PriorityBadge priority={issue.priority} />
          </Link>
        ))}
      </div>
    </div>
  )
}
