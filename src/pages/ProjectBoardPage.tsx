import { useState } from 'react'
import type { DragEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listIssues, updateIssue } from '../api/issues'
import { PriorityBadge } from '../components/Badge'
import { BOARD_STATUSES } from '../types/issue'
import type { Issue, IssueStatus } from '../types/issue'

const COLUMN_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

export function ProjectBoardPage() {
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
    return <p className="text-sm text-fg-muted">Loading board…</p>
  }
  if (issuesQuery.isError) {
    return <p className="text-sm text-red-400">Couldn't load the board. Is the backend running?</p>
  }

  const issues = issuesQuery.data ?? []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">Board</h1>
        <Link
          to={`/projects/${projectId}/issues`}
          className="rounded border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-fg"
        >
          List view
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BOARD_STATUSES.map((status) => {
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
              className={`flex min-h-[200px] flex-col gap-2 rounded border p-2 transition-colors duration-150 ${
                dragOverColumn === status ? 'border-fg bg-bg-elevated' : 'border-border'
              }`}
            >
              <div className="px-1 text-xs font-semibold uppercase text-fg-muted">
                {COLUMN_LABELS[status]} <span className="text-fg-muted/70">({columnIssues.length})</span>
              </div>
              {columnIssues.map((issue) => (
                <div
                  key={issue.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, issue.id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-grab rounded border border-border bg-bg-elevated p-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-fg active:cursor-grabbing ${
                    draggingIssueId === issue.id ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <Link to={`/issues/${issue.id}`} className="text-sm text-fg transition-colors duration-150 hover:text-accent">
                    {issue.title}
                  </Link>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-fg-muted">
                      {issue.assignee?.username ?? 'Unassigned'}
                    </span>
                    <PriorityBadge priority={issue.priority} />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
