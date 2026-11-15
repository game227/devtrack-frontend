import { useState } from 'react'
import type { DragEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { loadBoard, updateIssue } from '../api/issues'
import type { BoardIssues } from '../api/issues'
import { Avatar } from '../components/Avatar'
import { PriorityBadge } from '../components/Badge'
import { DueChip } from '../components/DueChip'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Skeleton } from '../components/Skeleton'
import { button, pageHeader, pageTitle } from '../components/ui'
import { useAuth } from '../features/auth/authContext'
import { issueEditRights } from '../features/issues/permissions'
import { useNewIssue } from '../features/issues/newIssueContext'
import { STATUS_COLOR } from '../lib/statusColors'
import { dueState } from '../lib/dueDate'
import { useT } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { Issue, IssueStatus } from '../types/issue'

// A long-running project piles up finished work; only the most recently completed cards are shown
// until the user asks for the rest, so the board stays about what is still moving.
const DONE_PREVIEW = 10

export function ProjectBoardPage() {
  const t = useT()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const openNewIssue = useNewIssue()
  const [dragOverColumn, setDragOverColumn] = useState<IssueStatus | null>(null)
  const [draggingIssueId, setDraggingIssueId] = useState<number | null>(null)
  const [showAllDone, setShowAllDone] = useState(false)
  const queryKey = ['issues', projectId, 'board', showAllDone ? 'all-done' : 'latest-done']

  const issuesQuery = useQuery({
    queryKey,
    queryFn: () => loadBoard(projectId, showAllDone),
    enabled: Number.isFinite(projectId),
    placeholderData: (previous) => previous, // expanding Done keeps the board on screen while it loads
  })

  const moveMutation = useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: IssueStatus }) =>
      updateIssue(issueId, { status }),
    onMutate: async ({ issueId, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<BoardIssues>(queryKey)
      const now = new Date().toISOString()
      queryClient.setQueryData<BoardIssues>(queryKey, (board) => {
        if (!board) return board
        const moved = board.issues.find((issue) => issue.id === issueId)
        const delta = moved ? Number(status === 'done') - Number(moved.status === 'done') : 0
        return {
          // completed_at too, so a card dropped into Done sorts first instead of vanishing below the fold.
          issues: board.issues.map((issue) =>
            issue.id === issueId
              ? { ...issue, status, updated_at: now, completed_at: status === 'done' ? now : null }
              : issue,
          ),
          doneTotal: board.doneTotal + delta,
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['issues', projectId, 'board'] }),
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
    return (
      <div role="status" aria-busy="true">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {ISSUE_STATUSES.map((status) => (
            <Skeleton key={status} className="h-72 w-[260px] shrink-0 xl:w-auto xl:flex-1" />
          ))}
        </div>
      </div>
    )
  }
  if (issuesQuery.isError) {
    return <p className="text-sm text-danger">{t('board.loadFailed')}</p>
  }

  const issues = issuesQuery.data?.issues ?? []
  const doneTotal = issuesQuery.data?.doneTotal ?? 0

  return (
    <div>
      <div className={pageHeader}>
        <h1 className={pageTitle}>{t('board.title')}</h1>
        <div className="flex items-center gap-2">
          <Link to={`/projects/${projectId}/issues`} className={button('secondary')}>
            {t('board.listView')}
          </Link>
          <button type="button" onClick={() => openNewIssue(projectId)} className={button('primary')}>
            <Icon name="plus" />
            {t('issues.new')}
          </button>
        </div>
      </div>

      {issues.length === 0 && (
        <EmptyState
          className="mb-6"
          icon="board"
          title={t('empty.board.title')}
          description={t('empty.board.desc')}
          action={{ label: t('empty.board.action'), onClick: () => openNewIssue(projectId) }}
        />
      )}

      {/* One column per station; their heads are joined into the line. Wide screens fit all five, narrower
          ones scroll sideways (snapping to columns) instead of stacking, so the line stays a line. */}
      <div className="scroll-quiet -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 lg:-mx-7 lg:scroll-px-7 lg:px-7 xl:snap-none">
        {ISSUE_STATUSES.map((status, columnIndex) => {
          const columnIssues = issues.filter((issue) => issue.status === status)
          const isDoneColumn = status === 'done'
          const columnTotal = isDoneColumn ? Math.max(doneTotal, columnIssues.length) : columnIssues.length
          const collapsed = isDoneColumn && !showAllDone && columnTotal > DONE_PREVIEW
          // Done is ordered most recently completed first whether collapsed or not, so expanding it only
          // appends older cards instead of reshuffling the ones already on screen.
          const finishedAt = (issue: Issue) => issue.completed_at ?? issue.updated_at
          const ordered = isDoneColumn
            ? [...columnIssues].sort((a, b) => finishedAt(b).localeCompare(finishedAt(a)))
            : columnIssues
          const visibleIssues = collapsed ? ordered.slice(0, DONE_PREVIEW) : ordered
          const isTarget = dragOverColumn === status
          return (
            <section
              key={status}
              aria-label={t(`status.${status}`)}
              className="flex w-[272px] shrink-0 snap-start flex-col xl:w-auto xl:min-w-0 xl:flex-1"
            >
              <h2 className="relative mb-3 flex h-7 items-center gap-2.5 px-1 text-sm font-bold text-fg">
                {columnIndex < ISSUE_STATUSES.length - 1 && (
                  <span aria-hidden="true" className="absolute left-[10px] top-1/2 h-[3px] w-[calc(100%+0.75rem)] -translate-y-1/2 rounded-full bg-border" />
                )}
                <span
                  aria-hidden="true"
                  className="relative block h-[13px] w-[13px] shrink-0 rounded-full ring-4 ring-bg"
                  style={{ backgroundColor: STATUS_COLOR[status] }}
                />
                <span className="relative bg-bg pr-2">
                  {t(`status.${status}`)}
                  <span className="ml-2 font-semibold text-fg-muted tabular">{columnTotal}</span>
                </span>
              </h2>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverColumn(status)
                }}
                onDragLeave={() => setDragOverColumn((current) => (current === status ? null : current))}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex min-h-[220px] flex-1 flex-col gap-2 rounded-xl border-2 p-2 transition-colors duration-150 ${
                  isTarget ? 'border-brand bg-brand-soft' : 'border-transparent bg-well'
                }`}
              >
                {columnIssues.length === 0 && <p className="px-2 py-3 text-xs text-fg-muted">{t('board.emptyColumn')}</p>}
                {visibleIssues.map((issue) => {
                  // The creator and the assignee can change an issue's status (backend: CanEditIssue);
                  // for anyone else dragging or the status picker would just bounce off a 403, so it is
                  // disabled here instead of letting the user hit that silently.
                  const canEdit = issueEditRights(issue, user?.id) !== 'none'
                  const isOverdue = dueState(issue.due_date, issue.status) === 'overdue'
                  const isDone = issue.status === 'done'
                  return (
                    <div
                      key={issue.id}
                      draggable={canEdit}
                      onDragStart={canEdit ? (e) => handleDragStart(e, issue.id) : undefined}
                      onDragEnd={canEdit ? handleDragEnd : undefined}
                      title={canEdit ? undefined : t('board.notYours')}
                      className={`group relative rounded-lg border bg-surface p-3 transition-[border-color,box-shadow,opacity] duration-150 ${
                        isOverdue ? 'border-danger/50' : 'border-border'
                      } ${canEdit ? 'cursor-grab hover:border-border-strong hover:shadow-float active:cursor-grabbing' : ''} ${
                        draggingIssueId === issue.id ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-fg-muted">#{issue.number}</span>
                        <PriorityBadge priority={issue.priority} />
                      </div>
                      <Link
                        to={`/issues/${issue.id}`}
                        className={`block text-sm font-semibold leading-snug hover:underline ${isDone ? 'text-fg-muted line-through decoration-border-strong' : 'text-fg'}`}
                      >
                        {issue.title}
                      </Link>
                      {issue.labels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1">
                          {issue.labels.slice(0, 3).map((label) => (
                            <span key={label.id} className="inline-flex items-center gap-1 text-xs text-fg-muted">
                              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-fg-muted">
                        {issue.assignee ? (
                          <>
                            <Avatar name={issue.assignee.username} src={issue.assignee.avatar} size={20} />
                            <span className="min-w-0 truncate">{issue.assignee.username}</span>
                          </>
                        ) : (
                          <span className="min-w-0 truncate">{t('common.unassigned')}</span>
                        )}
                        <span className="ml-auto shrink-0">
                          {issue.due_date ? <DueChip dueDate={issue.due_date} status={issue.status} /> : t(`issueType.${issue.type}`)}
                        </span>
                      </div>
                      {/* Dragging needs a mouse, so every card also has a status control. It is always shown on
                          narrow and touch screens; on a desktop it stays out of sight (but in the tab order) and
                          appears as soon as it gets keyboard focus. */}
                      {canEdit && (
                        <select
                          aria-label={t('board.moveTo')}
                          value={issue.status}
                          onChange={(e) => moveMutation.mutate({ issueId: issue.id, status: e.target.value as IssueStatus })}
                          className="mt-2.5 w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-fg md:sr-only md:focus:not-sr-only md:focus:w-full [@media(pointer:coarse)]:not-sr-only [@media(pointer:coarse)]:w-full"
                        >
                          {ISSUE_STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {t(`status.${value}`)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )
                })}
                {isDoneColumn && columnTotal > DONE_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAllDone((current) => !current)}
                    className="rounded-md px-2 py-1.5 text-xs font-semibold text-accent hover:bg-surface hover:underline"
                  >
                    {collapsed ? t('board.showAllDone', { count: columnTotal }) : t('board.showFewerDone')}
                  </button>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
