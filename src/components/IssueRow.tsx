import { useRef, useState } from 'react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { updateIssue } from '../api/issues'
import { useAuth } from '../features/auth/authContext'
import { issueEditRights } from '../features/issues/permissions'
import { useToast } from '../features/toast/toastContext'
import { useT } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { Issue, IssueStatus } from '../types/issue'
import { Avatar } from './Avatar'
import { PriorityBadge } from './Badge'
import { DueChip } from './DueChip'
import { Icon } from './Icon'
import { StationGlyph, StatusTrack } from './Track'
import { useQueryClient } from '@tanstack/react-query'

const SWIPE_ARM = 72
const SWIPE_MAX = 132

// Phones: swipe a row to the left to send the issue to its next station (if you may change it). The
// row follows the finger, uncovers where the issue will go, and a toast offers to undo. Mouse and
// keyboard users change the status on the issue page or the board instead.
function useSwipeToAdvance(issue: Issue) {
  const t = useT()
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const swallowClick = useRef(false)
  const index = ISSUE_STATUSES.indexOf(issue.status)
  const next: IssueStatus | null = issueEditRights(issue, user?.id) !== 'none' && index < ISSUE_STATUSES.length - 1 ? ISSUE_STATUSES[index + 1] : null

  const move = useMutation({
    mutationFn: ({ status }: { status: IssueStatus; undo?: boolean }) => updateIssue(issue.id, { status }),
    onSuccess: (updated, { undo }) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.setQueryData(['issue', updated.id], updated)
      if (undo) return
      const from = issue.status
      toast({
        tone: 'info',
        text: t('board.moved', { number: updated.number, status: t(`status.${updated.status}`) }),
        action: { label: t('board.undo'), onClick: () => move.mutate({ status: from, undo: true }) },
      })
    },
    onError: () => toast({ tone: 'error', text: t('issue.updateFailed') }),
  })

  const handlers = next
    ? {
        onPointerDown: (event: PointerEvent<HTMLAnchorElement>) => {
          if (event.pointerType !== 'touch') return
          start.current = { x: event.clientX, y: event.clientY, horizontal: null }
        },
        onPointerMove: (event: PointerEvent<HTMLAnchorElement>) => {
          const from = start.current
          if (!from) return
          const dx = event.clientX - from.x
          const dy = event.clientY - from.y
          // Decide once, after a few pixels, whether this is a swipe or a scroll.
          if (from.horizontal === null && Math.hypot(dx, dy) > 8) from.horizontal = Math.abs(dx) > Math.abs(dy) * 1.2
          if (!from.horizontal) return
          setDragging(true)
          setOffset(Math.max(Math.min(dx, 0), -SWIPE_MAX))
        },
        onPointerUp: () => {
          const from = start.current
          start.current = null
          setDragging(false)
          if (from?.horizontal) {
            swallowClick.current = true
            if (offset <= -SWIPE_ARM) move.mutate({ status: next })
          }
          setOffset(0)
        },
        onPointerCancel: () => {
          start.current = null
          setDragging(false)
          setOffset(0)
        },
      }
    : {}

  return {
    next,
    offset,
    dragging,
    armed: offset <= -SWIPE_ARM,
    handlers,
    // A swipe ends in a click on the link: that click must not open the issue.
    consumeClick: () => {
      const swallow = swallowClick.current
      swallowClick.current = false
      return swallow
    },
  }
}

// One issue in a list: where it is on the line first, so a column of rows reads like a progress chart.
// Rendered inside a <ul> (IssueList) whose rows are separated by hairlines.
// `projectName` is given on lists that mix projects, where "#3" alone would be ambiguous.
// With `onSelect`, a checkbox sits before the row (outside its link) for bulk changes.
export function IssueRow({
  issue,
  index = 0,
  projectName,
  selected,
  onSelect,
}: {
  issue: Issue
  index?: number
  projectName?: string
  selected?: boolean
  onSelect?: (id: number, selected: boolean) => void
}) {
  const t = useT()
  const queryClient = useQueryClient()
  const done = issue.status === 'done'
  const swipe = useSwipeToAdvance(issue)
  return (
    <li style={{ '--i': index } as CSSProperties} className={`relative flex items-stretch overflow-hidden ${selected ? 'bg-brand-soft/70' : ''}`}>
      {/* What a swipe to the left does, uncovered as the row slides (phones only). */}
      {swipe.next && swipe.offset < 0 && (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 right-0 flex items-center gap-2 pr-5 text-sm font-semibold transition-colors ${
            swipe.armed ? 'bg-fg text-bg' : 'bg-well text-fg-muted'
          }`}
          style={{ width: Math.max(-swipe.offset, 0) + 24 }}
        >
          <span className="ml-auto flex items-center gap-2 whitespace-nowrap">
            <StationGlyph status={swipe.next} size={14} />
            {t(`status.${swipe.next}`)}
          </span>
        </span>
      )}
      {onSelect && (
        <label className="flex shrink-0 cursor-pointer items-center pl-4">
          <input
            type="checkbox"
            checked={Boolean(selected)}
            onChange={(e) => onSelect(issue.id, e.target.checked)}
            aria-label={t('bulk.select', { number: issue.number, title: issue.title })}
            className="h-4 w-4 accent-[var(--color-fg)]"
          />
        </label>
      )}
      <Link
        to={`/issues/${issue.id}`}
        viewTransition
        {...swipe.handlers}
        style={swipe.offset ? { transform: `translateX(${swipe.offset}px)` } : undefined}
        onClick={(event) => {
          if (swipe.consumeClick()) {
            event.preventDefault()
            return
          }
          // Open at once from the row's data, and let the title glide into the page heading (a plain click
          // only: ctrl/cmd-click opens a new tab and leaves this page as it is).
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          queryClient.setQueryData<Issue>(['issue', issue.id], (cached) => cached ?? issue)
          const title = event.currentTarget.querySelector<HTMLElement>('[data-issue-title]')
          if (title) title.style.viewTransitionName = 'issue-title'
        }}
        className={`group relative flex min-w-0 flex-1 touch-pan-y flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 transition-[background-color,transform] duration-150 hover:bg-brand-soft/60 @lg:flex-nowrap ${swipe.offset ? 'bg-surface' : ''} ${swipe.dragging ? 'duration-0' : ''}`}
      >
        <StatusTrack status={issue.status} />
        <span className="w-10 shrink-0 font-mono text-xs text-fg-muted tabular">#{issue.number}</span>
        <span className="flex min-w-0 flex-1 basis-48 items-baseline gap-2">
          <span data-issue-title className={`min-w-0 truncate text-sm font-semibold ${done ? 'text-fg-muted line-through decoration-border-strong' : 'text-fg'}`}>
            {issue.title}
          </span>
          {projectName && (
            <span className="hidden max-w-[45%] shrink-0 truncate rounded-md border border-border px-1.5 text-[11px] font-medium text-fg-muted @xl:inline-block">
              {projectName}
            </span>
          )}
          {/* Imported issues keep GitHub's number, so this only adds information when they differ. */}
          {issue.github_number !== null && issue.github_number !== issue.number && (
            <span className="shrink-0 font-mono text-xs text-fg-muted">GH#{issue.github_number}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="hidden w-24 truncate text-right text-xs text-fg-muted @4xl:inline">{t(`issueType.${issue.type}`)}</span>
          <span className="hidden w-32 items-center justify-end gap-2.5 overflow-hidden @5xl:flex">
            {issue.labels.slice(0, 2).map((label) => (
              <span key={label.id} className="inline-flex min-w-0 items-center gap-1 text-xs text-fg-muted">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                <span className="truncate">{label.name}</span>
              </span>
            ))}
          </span>
          {issue.checklist && (
            <span title={t('checklist.short', issue.checklist)} className="hidden items-center gap-1 font-mono text-xs text-fg-muted tabular @xl:inline-flex">
              <Icon name="check" className="h-3.5 w-3.5" />
              <span className="sr-only">{t('checklist.title')}</span>
              {issue.checklist.done}/{issue.checklist.total}
            </span>
          )}
          <span className="flex justify-end @3xl:w-40">
            <DueChip dueDate={issue.due_date} status={issue.status} />
          </span>
          <span className="flex @3xl:w-28">
            <PriorityBadge priority={issue.priority} />
          </span>
          {issue.assignee ? (
            <span title={issue.assignee.username} className="inline-flex">
              <Avatar name={issue.assignee.username} src={issue.assignee.avatar} size={22} />
              <span className="sr-only">{issue.assignee.username}</span>
            </span>
          ) : (
            <span
              title={t('common.unassigned')}
              className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-dashed border-border-strong"
            >
              <span className="sr-only">{t('common.unassigned')}</span>
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}

export function IssueList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul aria-label={label} className="stagger @container divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel">
      {children}
    </ul>
  )
}
