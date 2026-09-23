import { useState } from 'react'
import type { DragEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listIssues, updateIssue } from '../api/issues'
import { Avatar } from '../components/Avatar'
import { PriorityBadge } from '../components/Badge'
import { STATUS_COLOR } from '../lib/statusColors'
import { useT } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { Issue, IssueStatus } from '../types/issue'

export function ProjectBoardPage() {
  const t = useT()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const queryKey = ['issues', projectId, 'board']
  const [dragOverColumn, setDragOverColumn] = useState<IssueStatus | null>(null)
  const [draggingIssueId, setDraggingIssueId] = useState<number | null>(null)

  const issuesQuery = useQuery({
    queryKey,
    queryFn: () => listIssues({ project: projectId }),
    enabled: Number.isFinite(projectId),
  })

  const moveMutation = useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: IssueStatus }) =>
      updateIssue(issueId, { status }),
    onMutate: async ({ issueId, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Issue[]>(queryKey)
      queryClient.setQueryData<Issue[]>(queryKey, (issues) =>
        issues?.map((issue) => (issue.id === issueId ? { ...issue, status } : issue)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  })

  function handleDragStart(event: DragEvent<HTMLDivElement>, issueId: number) {
    event.dataTransfer.setData('text/plain', String(issueId))
    event.dataTransfer.effectAllowed = 'move'
    setDraggingIssueId(issueId)
  }

  function handleDragEnd() {
    setDraggingIssueId(null)
    setDragOverColumn(null)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, status: IssueStatus) {
    event.preventDefault()
    setDragOverColumn(null)
    const issueId = Number(event.dataTransfer.getData('text/plain'))
    if (Number.isFinite(issueId)) {
      moveMutation.mutate({ issueId, status })
    }
  }

  if (issuesQuery.isLoading) {
    return <p className="text-sm text-fg-muted">{t('board.loading')}</p>
  }
  if (issuesQuery.isError) {
    return <p className="text-sm text-danger">{t('board.loadFailed')}</p>
  }

  const issues = issuesQuery.data ?? []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">{t('board.title')}</h1>
        <Link
          to={`/projects/${projectId}/issues`}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-fg"
        >
          {t('board.listView')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ISSUE_STATUSES.map((status) => {
          const columnIssues = issues.filter((issue) => issue.status === status)
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverColumn(status)
              }}
              onDragLeave={() => setDragOverColumn((current) => (current === status ? null : current))}
              onDrop={(e) => handleDrop(e, status)}
              className={`flex min-h-[200px] flex-col gap-2 rounded-2xl border p-2 transition-colors duration-150 ${
                dragOverColumn === status ? 'border-fg bg-bg-elevated' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase text-fg-muted">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
                {t(`status.${status}`)}
                <span className="ml-auto font-mono font-normal text-fg-muted/70">{columnIssues.length}</span>
              </div>
              {columnIssues.length === 0 && (
                <p className="px-1 py-2 text-xs text-fg-muted/70">{t('board.emptyColumn')}</p>
              )}
              {columnIssues.map((issue) => (
                <div
                  key={issue.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, issue.id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-grab rounded-2xl border border-border bg-bg-elevated p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-fg active:cursor-grabbing ${
                    draggingIssueId === issue.id ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-code">#{issue.id}</span>
                    <PriorityBadge priority={issue.priority} />
                  </div>
                  <Link
                    to={`/issues/${issue.id}`}
                    className="block text-sm text-fg transition-colors duration-150 hover:text-accent"
                  >
                    {issue.title}
                  </Link>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-fg-muted">
                    {issue.assignee ? (
                      <>
                        <Avatar name={issue.assignee.username} src={issue.assignee.avatar} size={18} />
                        <span className="truncate">{issue.assignee.username}</span>
                      </>
                    ) : (
                      <span>{t('common.unassigned')}</span>
                    )}
                    <span className="ml-auto shrink-0">{t(`issueType.${issue.type}`)}</span>
                  </div>
                  {/* Touch screens cannot drag cards, so small screens get an explicit status control. */}
                  <select
                    aria-label={t('board.moveTo')}
                    value={issue.status}
                    onChange={(e) => moveMutation.mutate({ issueId: issue.id, status: e.target.value as IssueStatus })}
                    className="mt-2 w-full rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg-muted outline-none focus:border-fg md:hidden"
                  >
                    {ISSUE_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {t(`status.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
