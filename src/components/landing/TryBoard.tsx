import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useT } from '../../i18n'
import type { IssueStatus } from '../../types/issue'
import { STATUS_COLOR } from '../../lib/statusColors'
import { useReveal } from '../../hooks/useReveal'
import { Icon } from '../Icon'
import { StationGlyph } from '../Track'
import { button } from '../ui'

// The four stations a visitor can move cards along (the real board also has a backlog).
const COLUMNS: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done']

interface Card {
  number: number
  status: IssueStatus
}

const START: Card[] = [
  { number: 1, status: 'todo' },
  { number: 2, status: 'todo' },
  { number: 3, status: 'in_progress' },
  { number: 4, status: 'in_review' },
]

// "fixes #2" closes an issue, "refs #2" (or a bare #2) starts it: the same words GitHub commits use.
const CLOSING = /\b(fix(e[sd])?|close[sd]?|resolve[sd]?)\s+#(\d+)/i
const MENTION = /#(\d+)/

const BURST = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2
  return { dx: `${Math.round(Math.cos(angle) * 46)}px`, dy: `${Math.round(Math.sin(angle) * 34)}px`, color: Object.values(STATUS_COLOR)[i % 5] }
})

function shortHash(seed: number) {
  return ((seed * 2654435761) >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

// A small working copy of the board on the landing page: drag a card (mouse or touch) to another station,
// press it to send it one station on, or write a commit message with "#number" and watch the card move by
// itself. When it first comes into view it shows the commit trick once, unless motion is reduced.
export function TryBoard() {
  const t = useT()
  const [cards, setCards] = useState<Card[]>(START)
  const [message, setMessage] = useState('')
  const [log, setLog] = useState<Array<{ hash: string; text: string; result: string }>>([])
  const [note, setNote] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  const [landed, setLanded] = useState<{ number: number; done: boolean; key: number } | null>(null)
  const [drag, setDrag] = useState<{ number: number; dx: number; dy: number; over: IssueStatus | null } | null>(null)
  const dragStart = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  // A drag ends with a click event too; that click must not also send the card one station on.
  const suppressClick = useRef(false)
  const touched = useRef(false)
  const [sectionRef, visible] = useReveal<HTMLDivElement>()

  const title = (number: number) => t(`landing.try.card${number}`)

  function move(number: number, status: IssueStatus) {
    setCards((current) => current.map((card) => (card.number === number ? { ...card, status } : card)))
    setLanded((previous) => ({ number, done: status === 'done', key: (previous?.key ?? 0) + 1 }))
    setAnnounce(t('landing.try.moved', { number, title: title(number), status: t(`status.${status}`) }))
  }

  function commit(text: string) {
    const closing = CLOSING.exec(text)
    const mention = closing ? null : MENTION.exec(text)
    const number = Number(closing ? closing[3] : mention?.[1])
    if (!Number.isFinite(number)) {
      setNote(t('landing.try.noMatch'))
      return false
    }
    const card = cards.find((item) => item.number === number)
    if (!card) {
      setNote(t('landing.try.unknown', { number }))
      return false
    }
    const status: IssueStatus = closing ? 'done' : card.status === 'todo' ? 'in_progress' : card.status
    move(number, status)
    setNote(null)
    setLog((current) => [{ hash: shortHash(current.length + number * 7 + text.length), text, result: `#${number} → ${t(`status.${status}`)}` }, ...current].slice(0, 3))
    return true
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    touched.current = true
    if (commit(message.trim())) setMessage('')
  }

  function reset() {
    touched.current = true
    setCards(START)
    setLog([])
    setNote(null)
    setLanded(null)
    setMessage('')
  }

  // The first time the board is seen, type "fixes #3" into the commit box and send it, once.
  useEffect(() => {
    if (!visible) return undefined
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const demo = 'fixes #3'
    const timers: number[] = []
    for (let i = 1; i <= demo.length; i += 1) {
      timers.push(
        window.setTimeout(() => {
          if (!touched.current) setMessage(demo.slice(0, i))
        }, 900 + i * 85),
      )
    }
    timers.push(
      window.setTimeout(() => {
        if (touched.current) return
        commit(demo)
        setMessage('')
      }, 900 + demo.length * 85 + 450),
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
    // Runs once, when the board first scrolls into view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // Dragging: the card follows the pointer; where it is let go picks the station. A plain press (a click,
  // Enter or Space, or a screen reader's activation) sends the card one station on.
  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    touched.current = true
    dragStart.current = { x: event.clientX, y: event.clientY, moved: false }
    // Keep receiving the pointer's moves while it drags outside the card (absent in some test DOMs).
    if (typeof event.currentTarget.setPointerCapture === 'function') event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>, number: number) {
    const start = dragStart.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.moved && Math.hypot(dx, dy) < 6) return
    start.moved = true
    const under = document.elementsFromPoint(event.clientX, event.clientY).find((element) => element instanceof HTMLElement && element.dataset.station)
    const over = (under instanceof HTMLElement ? (under.dataset.station as IssueStatus) : null) ?? null
    setDrag({ number, dx, dy, over })
  }

  function onPointerUp(number: number) {
    const start = dragStart.current
    dragStart.current = null
    const target = drag?.over
    setDrag(null)
    if (!start?.moved) return
    suppressClick.current = true
    const card = cards.find((item) => item.number === number)
    if (target && card && card.status !== target) move(number, target)
  }

  function advance(number: number) {
    const card = cards.find((item) => item.number === number)
    if (!card) return
    const next = COLUMNS[Math.min(COLUMNS.indexOf(card.status) + 1, COLUMNS.length - 1)]
    if (next !== card.status) move(number, next)
  }

  const doneCount = cards.filter((card) => card.status === 'done').length

  return (
    <div ref={sectionRef} className="glass rounded-[28px] p-3 sm:p-5">
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>
      <div className="scroll-quiet -mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        <div role="group" aria-label={t('landing.try.board')} className="grid min-w-[36rem] grid-cols-4 gap-2.5">
          {COLUMNS.map((status, index) => {
            const inColumn = cards.filter((card) => card.status === status)
            const isTarget = drag?.over === status
            return (
              <div key={status} className="flex min-w-0 flex-col">
                <h3 className="relative mb-2.5 flex h-7 items-center gap-2 px-1 text-[13px] font-semibold text-fg">
                  {index < COLUMNS.length - 1 && (
                    <span aria-hidden="true" className="absolute left-[10px] top-1/2 h-[3px] w-[calc(100%+0.625rem)] -translate-y-1/2 rounded-full bg-border" />
                  )}
                  <span aria-hidden="true" className="relative flex rounded-full bg-bg p-0.5">
                    <StationGlyph status={status} size={13} />
                  </span>
                  <span className="relative truncate rounded-md bg-bg px-1">
                    {t(`status.${status}`)} <span className="font-medium text-fg-muted tabular">{inColumn.length}</span>
                  </span>
                </h3>
                <div
                  data-station={status}
                  className={`flex min-h-44 flex-1 flex-col gap-2 rounded-2xl border-2 p-2 transition-colors duration-150 ${
                    isTarget ? 'border-brand bg-brand-soft' : 'border-transparent bg-well'
                  }`}
                >
                  {inColumn.map((card) => {
                    const dragging = drag?.number === card.number
                    const justLanded = landed?.number === card.number
                    return (
                      <button
                        key={justLanded ? `${card.number}-${landed.key}` : card.number}
                        type="button"
                        aria-label={t('landing.try.cardLabel', { number: card.number, title: title(card.number), status: t(`status.${card.status}`) })}
                        onPointerDown={onPointerDown}
                        onPointerMove={(event) => onPointerMove(event, card.number)}
                        onPointerUp={() => onPointerUp(card.number)}
                        onPointerCancel={() => {
                          dragStart.current = null
                          setDrag(null)
                        }}
                        onClick={() => {
                          touched.current = true
                          if (suppressClick.current) {
                            suppressClick.current = false
                            return
                          }
                          advance(card.number)
                        }}
                        style={dragging ? ({ transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(2deg)` } as CSSProperties) : undefined}
                        className={`relative touch-none select-none rounded-xl border border-edge bg-surface p-2.5 text-left shadow-panel transition-[box-shadow,border-color] duration-150 hover:border-border-strong hover:shadow-float ${
                          dragging ? 'z-20 cursor-grabbing shadow-float' : 'cursor-grab'
                        } ${justLanded && !dragging ? 'animate-land' : ''}`}
                      >
                        {justLanded && landed.done && (
                          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
                            {BURST.map((dot, i) => (
                              <span key={i} className="burst-dot" style={{ backgroundColor: dot.color, '--dx': dot.dx, '--dy': dot.dy } as CSSProperties} />
                            ))}
                          </span>
                        )}
                        <span className="block font-mono text-[11px] text-fg-muted">#{card.number}</span>
                        <span className={`mt-0.5 block text-[13px] font-semibold leading-snug ${card.status === 'done' ? 'text-fg-muted line-through decoration-fg/30' : 'text-fg'}`}>
                          {title(card.number)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-2">
        <label className="flex min-w-60 flex-1 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 font-mono text-sm text-fg-muted focus-within:border-fg">
          <Icon name="branch" size={15} />
          <span className="sr-only">{t('landing.try.commitLabel')}</span>
          <span aria-hidden="true">git commit -m</span>
          <input
            value={message}
            onChange={(event) => {
              touched.current = true
              setMessage(event.target.value)
              setNote(null)
            }}
            placeholder='"fixes #2"'
            maxLength={80}
            className="h-10 min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-subtle"
          />
        </label>
        <button type="submit" className={button('primary')}>
          {t('landing.try.commit')}
        </button>
        <button type="button" onClick={reset} className={button('ghost')}>
          {t('landing.try.reset')}
        </button>
      </form>
      {note && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {note}
        </p>
      )}
      <ul aria-label={t('landing.try.log')} className="mt-3 flex flex-col gap-1 font-mono text-xs text-fg-muted">
        {log.map((entry) => (
          <li key={entry.hash} className="animate-row-in">
            <span className="text-subtle">{entry.hash}</span> {entry.text} <span className="text-fg">{entry.result}</span>
          </li>
        ))}
      </ul>
      {doneCount === cards.length && <p className="mt-2 text-sm font-semibold text-success">{t('landing.try.allDone')}</p>}
    </div>
  )
}
