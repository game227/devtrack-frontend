import type { CSSProperties, ReactNode } from 'react'
import { useI18n } from '../../i18n'
import { Avatar } from '../Avatar'
import { IssueStatusBadge, PriorityBadge } from '../Badge'
import { Icon } from '../Icon'

// Every scene is a small script: each element carries the moment (ms) it appears at via --d, and
// the tour-* classes in index.css do the rest. Scenes are purely decorative mock-ups drawn with the
// app's own badges and tokens, so what visitors watch is what they will actually see in the product.

type Timing = CSSProperties & { '--d'?: string; '--dur'?: string; '--n'?: number }

function at(delayMs: number, extra: Timing = {}): Timing {
  return { '--d': `${delayMs}ms`, ...extra }
}

function Stage({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col justify-center gap-3 p-4 sm:p-8">{children}</div>
}

const chip = 'rounded-md border border-border px-2 py-0.5 text-xs text-fg-muted'

// 1 — write a title, pick type and priority, create: the issue drops into the list.
export function CreateScene() {
  const { t } = useI18n()
  const typed = t('landing.tour.create.typed')
  return (
    <Stage>
      <div className="rounded-2xl border border-border p-4">
        <div className="mb-1 text-xs text-fg-muted">{t('common.title')}</div>
        <div className="flex items-center rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg">
          <span
            className="tour-type inline-block whitespace-nowrap"
            style={at(500, { '--dur': '1300ms', '--n': typed.length })}
          >
            {typed}
          </span>
          <span className="tour-caret ml-0.5 h-4 w-px bg-fg" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`tour-in ${chip}`} style={at(1900)}>
            {t('issueType.bug')}
          </span>
          <span className="tour-in" style={at(2100)}>
            <PriorityBadge priority="high" />
          </span>
          <span
            className="tour-press ml-auto rounded-md border border-border px-3 py-1 text-xs font-medium text-fg"
            style={at(2900)}
          >
            {t('issues.create')}
          </span>
        </div>
      </div>
      <div
        className="tour-in flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
        style={at(3400)}
      >
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 font-mono text-xs text-code">#15</span>
          <span className="truncate text-sm font-medium text-fg">{typed}</span>
        </div>
        <PriorityBadge priority="high" />
      </div>
    </Stage>
  )
}

function MiniCard({ id, title, name, className = '', style }: { id: string; title: string; name: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-xl border border-border bg-bg p-2 ${className}`} style={style}>
      <span className="font-mono text-[10px] text-code">{id}</span>
      <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-fg">{title}</div>
      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-fg-muted">
        <Avatar name={name} size={14} />
        <span className="truncate">{name}</span>
      </div>
    </div>
  )
}

// 2 — drag a card across the board; the columns light up as it passes over them.
export function BoardScene() {
  const { t } = useI18n()
  const columns = [
    { status: 'todo', extra: '', color: 'var(--color-fg-muted)' },
    { status: 'in_progress', extra: 'tour-col-a', color: 'var(--color-warning)' },
    { status: 'done', extra: 'tour-col-b', color: 'var(--color-success)' },
  ] as const
  return (
    <div className="flex h-full items-center p-3 sm:p-6">
      <div className="grid w-full grid-cols-3 gap-2">
        {columns.map((column, index) => (
          <div key={column.status} className={`rounded-2xl border border-border p-2 ${column.extra}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: column.color }} />
              <span className="truncate">{t(`status.${column.status}`)}</span>
            </div>
            <div className="relative mt-2 h-44">
              {index === 0 && (
                <div className="tour-move absolute inset-x-0 top-0 z-10">
                  <MiniCard id="#42" title={t('landing.tour.board.card')} name="jane.dev" className="border-inherit!" />
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    className="tour-cursor absolute -bottom-3 right-1"
                  >
                    <path d="M5 3l14 7-6 2-2 6z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <MiniCard
                id={`#${40 - index}`}
                title={t(`landing.tour.board.other.${index}`)}
                name={index === 1 ? 'alex.k' : index === 2 ? 'priya.s' : 'sam.m'}
                className="absolute inset-x-0 top-[6rem]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ymd(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <span className="text-xs text-fg-muted">{label}</span>
      <div className="relative flex h-7 min-w-40 items-center justify-end">{children}</div>
    </div>
  )
}

const layer = 'absolute right-0 flex items-center gap-2 whitespace-nowrap text-sm'

// 3 — assign someone, bump the priority, and watch the due date change colour as time runs out.
export function AssignScene() {
  const { t, formatDate } = useI18n()
  return (
    <Stage>
      <div className="rounded-2xl border border-border px-4">
        <Row label={t('common.priority')}>
          <span className={`${layer} tour-hide`} style={at(900)}>
            <PriorityBadge priority="medium" />
          </span>
          <span className={`${layer} tour-show`} style={at(1000)}>
            <PriorityBadge priority="high" />
          </span>
        </Row>
        <Row label={t('common.assignee')}>
          <span className={`${layer} tour-hide text-fg-muted`} style={at(1900)}>
            {t('common.unassigned')}
          </span>
          <span className={`${layer} tour-show text-fg`} style={at(2000)}>
            <Avatar name="alex.k" size={20} />
            alex.k
          </span>
        </Row>
        <Row label={t('common.dueDate')}>
          <span className={`${layer} tour-flash text-xs text-fg-muted`} style={at(2800, { '--dur': '1700ms' })}>
            {t('due.later', { date: formatDate(ymd(9)) })}
          </span>
          <span className={`${layer} tour-flash text-xs text-warning`} style={at(4400, { '--dur': '1500ms' })}>
            {t('due.today')}
          </span>
          <span className={`${layer} tour-show text-xs text-danger`} style={at(5800)}>
            {t('due.overdue', { date: formatDate(ymd(-1)) })}
          </span>
        </Row>
      </div>
      <p className="tour-in px-1 text-xs text-fg-muted" style={at(2900)}>
        {t('landing.tour.assign.legend')}
      </p>
    </Stage>
  )
}

// 4 — a commit mentions #42, its pull request merges, and the issue closes itself.
export function GithubScene() {
  const { t } = useI18n()
  return (
    <Stage>
      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 font-mono text-xs text-code">#42</span>
            <span className="truncate text-sm font-medium text-fg">{t('landing.tour.board.card')}</span>
          </div>
          <div className="relative flex h-6 w-24 justify-end">
            <span className="tour-hide absolute right-0" style={at(3000)}>
              <IssueStatusBadge status="in_progress" />
            </span>
            <span className="tour-show absolute right-0" style={at(3100)}>
              <IssueStatusBadge status="done" />
            </span>
          </div>
        </div>
      </div>
      <div className="tour-in rounded-md border border-border px-3 py-2 font-mono text-xs text-fg-muted" style={at(300)}>
        <span className="text-fg">git commit</span> -m "{t('landing.tour.github.commit')} <span className="text-code">#42</span>"
      </div>
      <div className="tour-in flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-fg" style={at(1600)}>
        <Icon name="branch" size={14} className="text-merged" />
        <span className="text-merged">{t('landing.tour.github.merged', { number: 42 })}</span>
      </div>
      <div className="tour-in flex items-center gap-2 px-1 text-xs text-success" style={at(3400)}>
        <Icon name="check" size={14} />
        {t('landing.tour.github.auto')}
      </div>
    </Stage>
  )
}

// 5 — Ctrl+K opens the palette; typing narrows it down to the command you want.
export function KeysScene() {
  const { t } = useI18n()
  const typed = t('landing.tour.keys.typed')
  const kbd = 'rounded-md border border-border px-2.5 py-1 font-mono text-xs text-fg'
  return (
    <Stage>
      <div className="flex items-center justify-center gap-2">
        <kbd className={`tour-press ${kbd}`} style={at(400)}>
          Ctrl
        </kbd>
        <span className="text-xs text-fg-muted">+</span>
        <kbd className={`tour-press ${kbd}`} style={at(450)}>
          K
        </kbd>
      </div>
      <div className="tour-in overflow-hidden rounded-2xl border border-border" style={at(1100)}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 text-sm">
          <Icon name="search" className="text-fg-muted" />
          <span className="tour-type inline-block whitespace-nowrap text-fg" style={at(1700, { '--dur': '700ms', '--n': typed.length })}>
            {typed}
          </span>
          <span className="tour-caret h-4 w-px bg-fg" />
        </div>
        <div className="py-1 text-sm">
          <div className="tour-in mx-1 flex items-center justify-between rounded-md bg-bg px-3 py-2 text-fg" style={at(2600)}>
            {t('cmdk.goBoard')}
            <span className="font-mono text-xs text-fg-muted">G B</span>
          </div>
        </div>
      </div>
      <div className="tour-in flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-fg-muted" style={at(3200)}>
        <span className="flex items-center gap-2">
          <kbd className={kbd}>C</kbd>
          {t('cmdk.newIssue')}
        </span>
        <span className="flex items-center gap-2">
          <kbd className={kbd}>G</kbd>
          <kbd className={kbd}>B</kbd>
          {t('cmdk.goBoard')}
        </span>
      </div>
    </Stage>
  )
}
