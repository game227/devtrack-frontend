import type { CSSProperties } from 'react'
import { useT } from '../../i18n'
import { STATUS_COLOR } from '../../lib/statusColors'
import { ISSUE_STATUSES } from '../../types/issue'
import type { IssueStatus } from '../../types/issue'

// The hero's object: a dark device, framed by viewfinder corners, whose screen is a tiny live board.
// Cards settle into their columns once, then one card keeps travelling from "in progress" to review.

const CARDS: Array<{ status: IssueStatus; key: string; number: number; lines: 1 | 2 }> = [
  { status: 'backlog', key: 'backlog', number: 31, lines: 2 },
  { status: 'backlog', key: 'backlog2', number: 33, lines: 1 },
  { status: 'todo', key: 'todo', number: 24, lines: 2 },
  { status: 'todo', key: 'todo2', number: 27, lines: 1 },
  { status: 'in_progress', key: 'progress', number: 17, lines: 2 },
  { status: 'in_review', key: 'review', number: 12, lines: 1 },
  { status: 'done', key: 'done', number: 9, lines: 2 },
  { status: 'done', key: 'done2', number: 6, lines: 1 },
]

export function HeroDevice() {
  const t = useT()
  return (
    <figure className="relative mx-auto w-full max-w-[36rem] select-none">
      <figcaption className="sr-only">{t('landing.device.caption')}</figcaption>
      <div aria-hidden="true" className="relative px-6 py-10 sm:px-10 sm:py-14">
        {/* Viewfinder corners and registration marks around the object. */}
        <span className="corners absolute inset-0 [--corner-size:28px]" />
        <span className="crosshair right-[6%] top-[46%]" />
        <span className="crosshair bottom-[9%] left-[30%]" />
        <span className="crosshair left-[3%] top-[18%] opacity-70" />

        <div className="device-float">
          <div className="relative rounded-[30px] bg-[linear-gradient(155deg,#3a3a38_0%,#141414_38%,#050505_100%)] p-3 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.65),0_12px_24px_-12px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.18)] [transform:perspective(1600px)_rotateY(-12deg)_rotateX(7deg)]">
            {/* The screen. */}
            <div className="on-ink relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#0c0c0c] p-3 shadow-[inset_0_0_40px_rgb(0_0_0/0.8)]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:18px_18px]" />
              <div className="relative grid grid-cols-5 gap-1.5">
                {ISSUE_STATUSES.map((status, column) => (
                  <div key={status} className="min-w-0">
                    <div className="mb-2 flex items-center gap-1 px-0.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
                      <span className="truncate font-mono text-[8px] uppercase tracking-wider text-white/45">{t(`status.${status}`)}</span>
                    </div>
                    <div className="flex min-h-36 flex-col gap-1.5 rounded-lg bg-white/[0.03] p-1">
                      {CARDS.filter((card) => card.status === status).map((card, i) => (
                        <div
                          key={card.key}
                          className="device-card rounded-md border border-white/[0.07] bg-white/[0.06] p-1.5"
                          style={{ '--d': `${300 + column * 120 + i * 90}ms` } as CSSProperties}
                        >
                          <span className="block font-mono text-[7px] text-white/40">#{card.number}</span>
                          <span className="mt-1 block h-1 w-[85%] rounded-full bg-white/30" />
                          {card.lines === 2 && <span className="mt-1 block h-1 w-[55%] rounded-full bg-white/15" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* The travelling card: in progress -> review, over and over. */}
              <div className="device-traveller absolute left-[calc(40%+0.6rem)] top-[5.5rem] w-[calc(20%-1.1rem)] rounded-md border border-white/30 bg-white/90 p-1.5 shadow-[0_8px_18px_-6px_rgb(0_0_0/0.8)]">
                <span className="block font-mono text-[7px] text-black/50">#18</span>
                <span className="mt-1 block h-1 w-[80%] rounded-full bg-black/60" />
                <span className="mt-1 block h-1 w-[50%] rounded-full bg-black/25" />
              </div>
            </div>
            {/* Hardware details under the screen. */}
            <div className="mt-2.5 flex items-center justify-between px-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">DevTrack · live</span>
              <span className="flex items-end gap-px">
                {[3, 6, 2, 7, 4, 8, 3, 5, 2, 6, 4, 7, 3].map((h, i) => (
                  <span key={i} className="w-px bg-white/30" style={{ height: h }} />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
