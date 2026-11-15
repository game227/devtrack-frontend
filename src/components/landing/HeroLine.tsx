import type { CSSProperties } from 'react'
import { useT } from '../../i18n'
import { STATUS_COLOR } from '../../lib/statusColors'
import { ISSUE_STATUSES } from '../../types/issue'
import { Avatar } from '../Avatar'

// The landing page's one moving moment: the line is drawn, then five example issues ride from where
// they were to where they are now. On small screens the line turns vertical and nothing moves.

const EXAMPLES: Array<{ key: string; number: number; from: number; to: number; who: string }> = [
  { key: 'backlog', number: 31, from: 0, to: 0, who: 'dilnoza' },
  { key: 'todo', number: 24, from: 0, to: 1, who: 'sardor' },
  { key: 'progress', number: 17, from: 1, to: 2, who: 'jasur' },
  { key: 'review', number: 12, from: 1, to: 3, who: 'malika' },
  { key: 'done', number: 9, from: 2, to: 4, who: 'aziz' },
]

// Stations sit at these points of the line (in % of its width), leaving room for the cards at the ends.
const STATION_X = [10, 30, 50, 70, 90]

function ExampleCard({ number, title, who }: { number: number; title: string; who: string }) {
  return (
    <div className="w-full rounded-lg border border-border bg-surface p-3 text-left shadow-float transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-fg-muted">#{number}</span>
        <Avatar name={who} size={20} />
      </div>
      <p className="mt-1.5 text-[13px] font-semibold leading-snug text-fg">{title}</p>
    </div>
  )
}

export function HeroLine({ animated = true }: { animated?: boolean }) {
  const t = useT()
  return (
    <figure className="relative">
      <figcaption className="sr-only">{t('landing.line.caption')}</figcaption>

      {/* Wide screens: one horizontal line, cards riding above it. */}
      <div aria-hidden="true" className="relative hidden h-[248px] sm:block">
        <div className="absolute left-[2%] right-[2%] top-[177px] h-[6px] rounded-full bg-border" />
        <div className={`absolute left-[2%] right-[2%] top-[177px] h-[6px] origin-left rounded-full bg-brand ${animated ? 'line-draw' : ''}`} />
        {ISSUE_STATUSES.map((status, i) => (
          <div key={status} className="absolute top-[167px] flex -translate-x-1/2 flex-col items-center" style={{ left: `${STATION_X[i]}%` }}>
            <span className="relative block h-[26px] w-[26px]">
              {/* Work in progress is the one station that keeps moving. */}
              {status === 'in_progress' && <span className="live-ring absolute inset-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />}
              <span className="relative block h-[26px] w-[26px] rounded-full ring-[5px] ring-bg" style={{ backgroundColor: STATUS_COLOR[status] }} />
            </span>
            <span className="mt-3 whitespace-nowrap text-sm font-bold text-fg">{t(`status.${status}`)}</span>
          </div>
        ))}
        {EXAMPLES.map((example, i) => (
          <div
            key={example.key}
            className={`absolute top-0 flex h-[167px] w-[17%] max-w-52 -translate-x-1/2 flex-col ${animated ? 'line-ride' : ''}`}
            style={
              {
                left: `${STATION_X[example.to]}%`,
                '--from': `${STATION_X[example.from]}%`,
                '--to': `${STATION_X[example.to]}%`,
                '--d': `${900 + i * 140}ms`,
              } as CSSProperties
            }
          >
            <ExampleCard number={example.number} title={t(`landing.line.${example.key}`)} who={example.who} />
            <span className="mx-auto block w-0.5 flex-1 bg-border-strong" />
          </div>
        ))}
      </div>

      {/* Small screens: the same line, top to bottom. */}
      <ol aria-hidden="true" className="relative flex flex-col gap-4 sm:hidden">
        <span className="absolute bottom-6 left-[12px] top-6 w-[4px] -translate-x-1/2 rounded-full bg-brand" />
        {EXAMPLES.map((example, i) => {
          const status = ISSUE_STATUSES[i]
          return (
            <li key={example.key} className="relative flex items-center gap-4">
              <span className="relative z-10 block h-6 w-6 shrink-0 rounded-full ring-4 ring-bg" style={{ backgroundColor: STATUS_COLOR[status] }} />
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-bold text-fg">{t(`status.${status}`)}</p>
                <ExampleCard number={example.number} title={t(`landing.line.${example.key}`)} who={example.who} />
              </div>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}
