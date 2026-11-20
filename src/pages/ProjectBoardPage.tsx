import { Fragment, useContext, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { loadBoard, updateIssue } from '../api/issues'
import { getProject } from '../api/projects'
import type { BoardIssues } from '../api/issues'
import { Avatar } from '../components/Avatar'
import { PriorityBadge } from '../components/Badge'
import { DueChip } from '../components/DueChip'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Skeleton } from '../components/Skeleton'
import { button, pageHeader, pageTitle } from '../components/ui'
import { WipLimitsPanel } from '../components/WipLimits'
import { useAuth } from '../features/auth/authContext'
import { canManageProject } from '../features/projects/permissions'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { issueEditRights } from '../features/issues/permissions'
import { useNewIssue } from '../features/issues/newIssueContext'
import { useToast } from '../features/toast/toastContext'
import { formInputClass } from '../components/FormField'
import { StationGlyph } from '../components/Track'
import { dueState } from '../lib/dueDate'
import { useT } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { Issue, IssueStatus } from '../types/issue'
import { STATUS_COLOR } from '../lib/statusColors'

const BURST = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2
  return { dx: `${Math.round(Math.cos(angle) * 46)}px`, dy: `${Math.round(Math.sin(angle) * 34)}px`, color: Object.values(STATUS_COLOR)[i % 5] }
})

// A long-running project piles up finished work; only the most recently completed cards are shown
// until the user asks for the rest, so the board stays about what is still moving.
const DONE_PREVIEW = 10
// With a row per assignee, each row's Done cell shows only its latest few.
const DONE_PREVIEW_LANE = 3

// How this person likes this project's board, remembered on this device.
interface BoardPrefs {
  compact: boolean
  lanes: boolean
  collapsed: IssueStatus[]
}

const DEFAULT_PREFS: BoardPrefs = { compact: false, lanes: false, collapsed: [] }

function readBoardPrefs(projectId: number): BoardPrefs {
  try {
    const raw = localStorage.getItem(`devtrack_board:${projectId}`)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<BoardPrefs>
    return {
      compact: parsed.compact === true,
      lanes: parsed.lanes === true,
      collapsed: Array.isArray(parsed.collapsed)
        ? parsed.collapsed.filter((value): value is IssueStatus => (ISSUE_STATUSES as readonly string[]).includes(value))
        : [],
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function writeBoardPrefs(projectId: number, prefs: BoardPrefs) {
  try {
    localStorage.setItem(`devtrack_board:${projectId}`, JSON.stringify(prefs))
  } catch {
    // Storage unavailable (private mode): the choice lasts until the page is left.
  }
}

interface Lane {
  key: string
  person: { id: number; username: string; avatar: string | null } | null
  issues: Issue[]
}

function laneKeyOf(issue: Issue, lanes: boolean): string {
  if (!lanes) return 'all'
  return issue.assignee ? `u${issue.assignee.id}` : 'none'
}

export function ProjectBoardPage() {
  const t = useT()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const openNewIssue = useNewIssue()
  // The cell a card is being dragged over: "<lane>:<status>".
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<BoardPrefs>(() => readBoardPrefs(projectId))
  const updatePrefs = (patch: Partial<BoardPrefs>) =>
    setPrefs((current) => {
      const next = { ...current, ...patch }
      writeBoardPrefs(projectId, next)
      return next
    })
  const toggleColumn = (status: IssueStatus) =>
    updatePrefs({ collapsed: prefs.collapsed.includes(status) ? prefs.collapsed.filter((value) => value !== status) : [...prefs.collapsed, status] })
  const [draggingIssueId, setDraggingIssueId] = useState<number | null>(null)
  const [showAllDone, setShowAllDone] = useState(false)
  const [query, setQuery] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null)
  // The card that just moved lands with a glow (and a burst when it reached Done); keyed so it replays.
  const [landed, setLanded] = useState<{ id: number; done: boolean; key: number } | null>(null)
  const toast = useToast()
  const queryKey = ['issues', projectId, 'board', showAllDone ? 'all-done' : 'latest-done']

  const issuesQuery = useQuery({
    queryKey,
    queryFn: () => loadBoard(projectId, showAllDone),
    enabled: Number.isFinite(projectId),
    placeholderData: (previous) => previous, // expanding Done keeps the board on screen while it loads
  })

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: Number.isFinite(projectId),
  })
  const [wipOpen, setWipOpen] = useState(false)
  const workspace = useContext(WorkspaceContext)?.currentWorkspace ?? null

  const moveMutation = useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: IssueStatus; from?: IssueStatus; undo?: boolean }) =>
      updateIssue(issueId, { status }),
    onSuccess: (updated, { from, undo }) => {
      setLanded((previous) => ({ id: updated.id, done: updated.status === 'done', key: (previous?.key ?? 0) + 1 }))
      if (undo || !from || from === updated.status) return
      toast({
        tone: 'info',
        text: t('board.moved', { number: updated.number, status: t(`status.${updated.status}`) }),
        action: { label: t('board.undo'), onClick: () => moveMutation.mutate({ issueId: updated.id, status: from, undo: true }) },
      })
    },
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
    setDragOverCell(null)
  }

  // With a row per assignee a card moves along its own row: dropping it in someone else's row would not
  // change who it is assigned to, so it is not offered as a target.
  function handleDrop(event: DragEvent<HTMLDivElement>, status: IssueStatus, laneKey: string) {
    event.preventDefault()
    setDragOverCell(null)
    const issueId = Number(event.dataTransfer.getData('text/plain'))
    const dropped = issuesQuery.data?.issues.find((issue) => issue.id === issueId)
    if (!dropped || laneKeyOf(dropped, prefs.lanes) !== laneKey) return
    if (dropped.status !== status) moveMutation.mutate({ issueId, status, from: dropped.status })
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

  const allIssues = issuesQuery.data?.issues ?? []
  const doneTotal = issuesQuery.data?.doneTotal ?? 0
  const people = [...new Map(allIssues.filter((i) => i.assignee).map((i) => [i.assignee!.id, i.assignee!])).values()].sort((a, b) =>
    a.username.localeCompare(b.username),
  )
  const needle = query.trim().toLowerCase().replace(/^#/, '')
  const filtering = Boolean(needle || mineOnly || assigneeFilter !== null)
  const issues = allIssues.filter(
    (issue) =>
      (!needle || issue.title.toLowerCase().includes(needle) || String(issue.number) === needle) &&
      (!mineOnly || issue.assignee?.id === user?.id) &&
      (assigneeFilter === null || issue.assignee?.id === assigneeFilter),
  )

  const project = projectQuery.data
  const canManage = project ? canManageProject(project, user?.id, workspace) : false
  const wipLimits = project?.wip_limits ?? {}
  const collapsedSet = new Set(prefs.collapsed)
  const dragged = draggingIssueId === null ? null : (allIssues.find((issue) => issue.id === draggingIssueId) ?? null)

  // One row for everything, or (grouped) a row per assignee: you first, then by name, unassigned last.
  const lanes: Lane[] = prefs.lanes
    ? [
        ...[...people]
          .sort((a, b) => Number(b.id === user?.id) - Number(a.id === user?.id))
          .map((person) => ({ key: `u${person.id}`, person, issues: issues.filter((issue) => issue.assignee?.id === person.id) })),
        { key: 'none', person: null, issues: issues.filter((issue) => !issue.assignee) },
      ].filter((lane) => lane.issues.length > 0)
    : [{ key: 'all', person: null, issues }]

  const finishedAt = (issue: Issue) => issue.completed_at ?? issue.updated_at
  const doneShown = !filtering ? Math.max(doneTotal, issues.filter((issue) => issue.status === 'done').length) : issues.filter((issue) => issue.status === 'done').length

  function renderHead(status: IssueStatus, columnIndex: number) {
    const name = t(`status.${status}`)
    const folded = collapsedSet.has(status)
    // WIP is judged on the whole column, not on what the filters leave visible.
    const limit = wipLimits[status]
    const inColumn = allIssues.filter((issue) => issue.status === status).length
    const overLimit = Boolean(limit && inColumn > limit)
    const shownCount = status === 'done' ? doneShown : issues.filter((issue) => issue.status === status).length
    return (
      <div key={`head-${status}`} className="snap-start">
        <h2 id={`column-${status}`} className="group/head relative mb-3 flex h-7 items-center gap-2.5 px-1 text-sm font-bold text-fg">
          {columnIndex < ISSUE_STATUSES.length - 1 && (
            <span aria-hidden="true" className="absolute left-[10px] top-1/2 h-[3px] w-[calc(100%+0.75rem)] -translate-y-1/2 rounded-full bg-border" />
          )}
          {folded ? (
            <button
              type="button"
              aria-expanded={false}
              aria-label={t('board.expandColumn', { status: name })}
              title={t('board.expandColumn', { status: name })}
              onClick={() => toggleColumn(status)}
              className="relative flex shrink-0 rounded-full bg-bg p-0.5 transition-transform duration-150 hover:scale-110"
            >
              <StationGlyph status={status} size={14} />
            </button>
          ) : (
            <>
              <span aria-hidden="true" className="relative flex shrink-0 rounded-full bg-bg p-0.5">
                <StationGlyph status={status} size={14} />
              </span>
              <span className="relative min-w-0 truncate rounded-md bg-bg px-1.5">
                {name}
                {limit ? (
                  <span className={`ml-2 font-semibold tabular ${overLimit ? 'text-danger' : 'text-fg-muted'}`} title={t('wip.limitTitle', { limit })}>
                    {inColumn}/{limit}
                  </span>
                ) : (
                  <span className="ml-2 font-semibold text-fg-muted tabular">{shownCount}</span>
                )}
              </span>
              <button
                type="button"
                aria-expanded={true}
                aria-label={t('board.collapseColumn', { status: name })}
                title={t('board.collapseColumn', { status: name })}
                onClick={() => toggleColumn(status)}
                className="absolute right-0 top-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg text-fg-muted opacity-0 transition-opacity duration-150 hover:text-fg focus-visible:opacity-100 group-hover/head:opacity-100 [@media(pointer:coarse)]:opacity-100"
              >
                <Icon name="collapse" size={15} />
              </button>
            </>
          )}
        </h2>
        {!folded && overLimit && (
          <p role="note" className="-mt-1 mb-2 px-1 text-xs font-medium text-danger">
            {t('wip.over', { count: inColumn, limit: limit ?? 0 })}
          </p>
        )}
        {!folded && prefs.lanes && status === 'done' && !filtering && doneShown > DONE_PREVIEW_LANE && (
          <button
            type="button"
            onClick={() => setShowAllDone((current) => !current)}
            className="-mt-1 mb-2 rounded-md px-1 text-xs font-semibold text-accent hover:underline"
          >
            {showAllDone ? t('board.showFewerDone') : t('board.showAllDone', { count: doneShown })}
          </button>
        )}
      </div>
    )
  }

  function renderBody(status: IssueStatus, lane: Lane) {
    const cellKey = `${lane.key}:${status}`
    const name = t(`status.${status}`)
    const folded = collapsedSet.has(status)
    const isDoneColumn = status === 'done'
    const columnIssues = lane.issues.filter((issue) => issue.status === status)
    // Done is ordered most recently completed first whether collapsed or not, so expanding it only
    // appends older cards instead of reshuffling the ones already on screen.
    const ordered = isDoneColumn ? [...columnIssues].sort((a, b) => finishedAt(b).localeCompare(finishedAt(a))) : columnIssues
    const columnTotal = isDoneColumn && !filtering && !prefs.lanes ? Math.max(doneTotal, columnIssues.length) : columnIssues.length
    const previewSize = prefs.lanes ? DONE_PREVIEW_LANE : DONE_PREVIEW
    const doneCut = isDoneColumn && !showAllDone && (prefs.lanes ? ordered.length : columnTotal) > previewSize
    const visibleIssues = doneCut ? ordered.slice(0, previewSize) : ordered
    const accepts = dragged !== null && laneKeyOf(dragged, prefs.lanes) === lane.key
    const isTarget = dragOverCell === cellKey && accepts
    // Where the dragged card will land: Done puts the latest first; the other columns are newest first.
    const landingIndex =
      isTarget && dragged && dragged.status !== status
        ? isDoneColumn
          ? 0
          : visibleIssues.filter((issue) => issue.created_at > dragged.created_at).length
        : -1
    const placeholder = (
      <div key="landing" aria-hidden="true" className="flex h-14 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-fg/25 bg-surface/60 text-xs font-medium text-fg-muted">
        {t('board.dropHere')}
      </div>
    )
    const cards = visibleIssues.map(renderCard)
    if (landingIndex >= 0) cards.splice(landingIndex, 0, placeholder)

    return (
      <div
        key={cellKey}
        role="group"
        aria-labelledby={prefs.lanes ? undefined : `column-${status}`}
        aria-label={prefs.lanes ? `${lane.person?.username ?? t('common.unassigned')}, ${name}` : undefined}
        onDragOver={(e) => {
          if (!accepts) return
          e.preventDefault()
          setDragOverCell(cellKey)
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
          setDragOverCell((current) => (current === cellKey ? null : current))
        }}
        onDrop={(e) => handleDrop(e, status, lane.key)}
        className={`flex flex-col rounded-xl border-2 transition-colors duration-150 ${prefs.compact ? 'gap-1.5 p-1.5' : 'gap-2 p-2'} ${
          prefs.lanes ? 'min-h-24' : 'min-h-[220px] flex-1'
        } ${isTarget ? 'border-brand bg-brand-soft' : 'border-transparent bg-well'}`}
      >
        {folded ? (
          <span className="mx-auto mt-1 font-semibold text-fg-muted tabular [writing-mode:vertical-rl]">
            {lane.key === lanes[0]?.key && <span className="mb-2 inline-block text-fg">{name}</span>} {columnIssues.length}
          </span>
        ) : (
          <>
            {columnIssues.length === 0 && landingIndex < 0 && !prefs.lanes && <p className="px-2 py-3 text-xs text-fg-muted">{t('board.emptyColumn')}</p>}
            {cards}
            {!isDoneColumn && !prefs.lanes && (
              <button
                type="button"
                onClick={() => openNewIssue(projectId, status)}
                aria-label={t('board.addTo', { status: name })}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-transparent px-2 py-2 text-xs font-semibold text-fg-muted transition-colors duration-150 hover:border-border-strong hover:bg-surface hover:text-fg"
              >
                <Icon name="plus" size={14} />
                {t('board.add')}
              </button>
            )}
            {isDoneColumn && !prefs.lanes && !filtering && columnTotal > DONE_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllDone((current) => !current)}
                className="rounded-md px-2 py-1.5 text-xs font-semibold text-accent hover:bg-surface hover:underline"
              >
                {doneCut ? t('board.showAllDone', { count: columnTotal }) : t('board.showFewerDone')}
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  // The issue page opens at once from what the card already knows (it refetches right after), and the
  // title is named for the view transition, so it glides from the card to the page heading.
  function openingIssue(title: HTMLElement, issue: Issue) {
    queryClient.setQueryData<Issue>(['issue', issue.id], (cached) => cached ?? issue)
    title.style.viewTransitionName = 'issue-title'
  }

  function renderCard(issue: Issue) {
    // The creator and the assignee can change an issue's status (backend: CanEditIssue); for anyone else
    // dragging or the status picker would just bounce off a 403, so it is disabled here instead.
    const canEdit = issueEditRights(issue, user?.id) !== 'none'
    const isOverdue = dueState(issue.due_date, issue.status) === 'overdue'
    const isDone = issue.status === 'done'
    const justLanded = landed?.id === issue.id
    const compact = prefs.compact
    return (
      <div
        key={justLanded ? `${issue.id}-${landed.key}` : issue.id}
        draggable={canEdit}
        onDragStart={canEdit ? (e) => handleDragStart(e, issue.id) : undefined}
        onDragEnd={canEdit ? handleDragEnd : undefined}
        title={canEdit ? undefined : t('board.notYours')}
        className={`group relative rounded-lg border bg-surface shadow-panel transition-[border-color,box-shadow,opacity] duration-150 ${compact ? 'px-2.5 py-2' : 'p-3'} ${
          isOverdue ? 'border-danger/50' : 'border-edge'
        } ${canEdit ? 'cursor-grab hover:border-border-strong hover:shadow-float active:cursor-grabbing' : ''} ${
          draggingIssueId === issue.id ? 'opacity-40' : 'opacity-100'
        } ${justLanded ? 'animate-land' : ''}`}
      >
        {justLanded && landed.done && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
            {BURST.map((dot, i) => (
              <span key={i} className="burst-dot" style={{ backgroundColor: dot.color, '--dx': dot.dx, '--dy': dot.dy } as CSSProperties} />
            ))}
          </span>
        )}
        {!compact && (
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-fg-muted">#{issue.number}</span>
            <PriorityBadge priority={issue.priority} />
          </div>
        )}
        <Link
          to={`/issues/${issue.id}`}
          viewTransition
          onClick={(event) => {
            // A plain click only: ctrl/cmd-click opens a new tab and leaves this page as it is.
            if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) openingIssue(event.currentTarget, issue)
          }}
          className={`block font-semibold leading-snug hover:underline ${compact ? 'line-clamp-2 text-[13px]' : 'text-sm'} ${
            isDone ? 'text-fg-muted line-through decoration-border-strong' : 'text-fg'
          }`}
        >
          {compact && <span className="mr-1.5 font-mono text-xs font-normal text-fg-muted">#{issue.number}</span>}
          {issue.title}
        </Link>
        {!compact && issue.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1">
            {issue.labels.slice(0, 3).map((label) => (
              <span key={label.id} className="inline-flex items-center gap-1 text-xs text-fg-muted">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                {label.name}
              </span>
            ))}
          </div>
        )}
        <div className={`flex items-center gap-2 text-xs text-fg-muted ${compact ? 'mt-1.5 flex-wrap gap-y-1' : 'mt-2.5'}`}>
          {issue.assignee ? (
            <>
              <Avatar name={issue.assignee.username} src={issue.assignee.avatar} size={compact ? 18 : 20} />
              <span className={compact ? 'sr-only' : 'min-w-0 truncate'}>{issue.assignee.username}</span>
            </>
          ) : (
            <span className={compact ? 'sr-only' : 'min-w-0 truncate'}>{t('common.unassigned')}</span>
          )}
          {compact && <PriorityBadge priority={issue.priority} />}
          {!compact && issue.estimate !== null && (
            <span className="shrink-0 rounded-full border border-border px-1.5 font-mono text-[10px] tabular" title={t('issue.points', { count: issue.estimate })}>
              {issue.estimate}
            </span>
          )}
          {issue.checklist && (
            <span className="inline-flex shrink-0 items-center gap-0.5 font-mono tabular" title={t('checklist.short', issue.checklist)}>
              <Icon name="check" className="h-3 w-3" />
              {issue.checklist.done}/{issue.checklist.total}
            </span>
          )}
          <span className="ml-auto shrink-0">
            {issue.due_date ? <DueChip dueDate={issue.due_date} status={issue.status} /> : !compact && t(`issueType.${issue.type}`)}
          </span>
        </div>
        {/* Dragging needs a mouse, so every card also has a status control. It is always shown on narrow and
            touch screens; on a desktop it stays out of sight (but in the tab order) and appears on focus. */}
        {canEdit && (
          <select
            aria-label={t('board.moveTo')}
            value={issue.status}
            onChange={(e) => moveMutation.mutate({ issueId: issue.id, status: e.target.value as IssueStatus, from: issue.status })}
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
  }

  return (
    <div>
      <div className={pageHeader}>
        <h1 className={pageTitle}>{t('board.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && project && !wipOpen && (
            <button type="button" onClick={() => setWipOpen(true)} className={button('ghost')}>
              {t('wip.button')}
            </button>
          )}
          <Link to={`/projects/${projectId}/issues`} className={button('secondary')}>
            {t('board.listView')}
          </Link>
          {/* On phones the bottom bar's "+" does this. */}
          <button type="button" onClick={() => openNewIssue(projectId)} className={`${button('primary')} max-md:hidden`}>
            <Icon name="plus" />
            {t('issues.new')}
          </button>
        </div>
      </div>

      {allIssues.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <label className="relative min-w-52 flex-1 sm:max-w-xs">
            <span className="sr-only">{t('board.search')}</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('board.search')}
              className={`${formInputClass} mt-0! pl-9`}
            />
          </label>
          <button type="button" aria-pressed={mineOnly} onClick={() => setMineOnly((v) => !v)} className={`${button(mineOnly ? 'primary' : 'secondary', 'md')}`}>
            {t('board.mine')}
          </button>
          {people.length > 1 && (
            <div role="group" aria-label={t('board.byAssignee')} className="flex items-center -space-x-1.5 pl-1">
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  aria-pressed={assigneeFilter === person.id}
                  aria-label={person.username}
                  title={person.username}
                  onClick={() => setAssigneeFilter((current) => (current === person.id ? null : person.id))}
                  className={`rounded-full ring-2 transition-transform duration-150 hover:z-10 hover:-translate-y-0.5 ${
                    assigneeFilter === person.id ? 'z-10 ring-brand' : 'ring-bg'
                  } ${assigneeFilter !== null && assigneeFilter !== person.id ? 'opacity-45' : ''}`}
                >
                  <Avatar name={person.username} src={person.avatar} size={30} />
                </button>
              ))}
            </div>
          )}
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setMineOnly(false)
                setAssigneeFilter(null)
              }}
              className="text-sm font-semibold text-accent hover:underline"
            >
              {t('board.clearFilters', { count: issues.length })}
            </button>
          )}
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              aria-pressed={prefs.lanes}
              onClick={() => updatePrefs({ lanes: !prefs.lanes })}
              className={button(prefs.lanes ? 'primary' : 'secondary', 'md')}
            >
              <Icon name="teams" />
              {t('board.lanes')}
            </button>
            <div role="group" aria-label={t('board.view')} className="inline-flex gap-0.5 rounded-xl bg-fg/[0.07] p-1">
              {([false, true] as const).map((compact) => (
                <button
                  key={String(compact)}
                  type="button"
                  aria-pressed={prefs.compact === compact}
                  onClick={() => updatePrefs({ compact })}
                  className={`flex h-8 items-center rounded-lg px-3 text-[13px] font-medium transition-colors ${
                    prefs.compact === compact ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {t(compact ? 'board.compact' : 'board.comfortable')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {wipOpen && project && <WipLimitsPanel project={project} onClose={() => setWipOpen(false)} />}

      {allIssues.length === 0 && (
        <EmptyState
          className="mb-6"
          icon="board"
          title={t('empty.board.title')}
          description={t('empty.board.desc')}
          action={{ label: t('empty.board.action'), onClick: () => openNewIssue(projectId) }}
        />
      )}

      {/* One column per station, their heads joined into the line. Wide screens fit all five, narrower ones
          scroll sideways (snapping to columns) instead of stacking, so the line stays a line. It is a grid, so
          with a row per assignee every row's cells line up under their column. */}
      <div className="scroll-quiet -mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-4 lg:-ml-3 lg:-mr-6 lg:scroll-pl-3 lg:pl-3 lg:pr-6 xl:snap-none">
        <div
          className="grid w-max gap-x-3 [--col:272px] xl:w-auto xl:[--col:minmax(0,1fr)]"
          style={{ gridTemplateColumns: ISSUE_STATUSES.map((status) => (collapsedSet.has(status) ? '3rem' : 'var(--col)')).join(' ') }}
        >
          {ISSUE_STATUSES.map((status, columnIndex) => renderHead(status, columnIndex))}
          {lanes.map((lane) => (
            <Fragment key={lane.key}>
              {prefs.lanes && (
                <div style={{ gridColumn: '1 / -1' }} className="mb-2 mt-5 first:mt-0">
                  <h3 className="sticky left-4 inline-flex items-center gap-2 text-sm font-semibold text-fg lg:left-3">
                    {lane.person ? <Avatar name={lane.person.username} src={lane.person.avatar} size={22} /> : <span aria-hidden="true" className="h-[22px] w-[22px] rounded-full border border-dashed border-border-strong" />}
                    {lane.person ? lane.person.username : t('common.unassigned')}
                    {lane.person?.id === user?.id && <span className="font-normal text-fg-muted">({t('board.you')})</span>}
                    <span className="font-semibold text-fg-muted tabular">{lane.issues.length}</span>
                  </h3>
                </div>
              )}
              {ISSUE_STATUSES.map((status) => renderBody(status, lane))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
