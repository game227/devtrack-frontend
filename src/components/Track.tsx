import { useMounted } from '../hooks/useCountUp'
import { useT } from '../i18n'
import { STATUS_COLOR as STATION_COLOR } from '../lib/statusColors'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus } from '../types/issue'

// The line every issue rides: backlog, to do, in progress, review, done. These pieces draw it at
// different sizes; the station colours live in styles/index.css (--color-st-*).

const STEP = 9
const START = 5

// The compact track in issue rows: where the issue is on the line, readable at a glance down a list.
// Position carries the meaning as much as colour does (WCAG 1.4.1), and the name is the status label.
export function StatusTrack({ status, className = '' }: { status: IssueStatus; className?: string }) {
  const t = useT()
  const index = ISSUE_STATUSES.indexOf(status)
  const color = STATION_COLOR[status]
  const label = t(`status.${status}`)
  const end = START + STEP * (ISSUE_STATUSES.length - 1)
  return (
    <svg
      role="img"
      aria-label={label}
      width={end + START}
      height={12}
      viewBox={`0 0 ${end + START} 12`}
      className={`shrink-0 ${className}`}
    >
      <title>{label}</title>
      <line x1={START} y1={6} x2={end} y2={6} stroke="var(--color-border-strong)" strokeWidth={1.25} strokeLinecap="round" />
      {index > 0 && (
        <line x1={START} y1={6} x2={START + STEP * index} y2={6} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      )}
      {ISSUE_STATUSES.map((station, i) => {
        const cx = START + STEP * i
        if (i === index) {
          return <circle key={station} cx={cx} cy={6} r={4} fill={color} stroke="var(--color-surface)" strokeWidth={1.5} />
        }
        if (i < index) return <circle key={station} cx={cx} cy={6} r={2.25} fill={color} />
        return <circle key={station} cx={cx} cy={6} r={2.25} fill="var(--color-surface)" stroke="var(--color-border-strong)" strokeWidth={1.25} />
      })}
    </svg>
  )
}

// A station's mark, readable without colour: how full the circle is says how far the work is. Backlog
// is a dashed ring, Todo an empty ring, In progress half full, In review three-quarters, Done a full disc
// with a tick. Decorative: the label next to it says the name.
export function StationGlyph({ status, size = 12, className = '' }: { status: IssueStatus; size?: number; className?: string }) {
  const color = STATION_COLOR[status]
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 12 12" className={`shrink-0 ${className}`}>
      {status === 'done' ? (
        <>
          <circle cx="6" cy="6" r="5.5" fill={color} />
          <path d="m3.6 6.1 1.6 1.6 3.2-3.3" fill="none" stroke="var(--color-surface)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="6" cy="6" r="4.75" fill="var(--color-surface)" stroke={color} strokeWidth="1.5" strokeDasharray={status === 'backlog' ? '2 1.6' : undefined} />
          {status === 'in_progress' && <path d="M6 2.75a3.25 3.25 0 0 1 0 6.5z" fill={color} />}
          {status === 'in_review' && <path d="M6 2.75a3.25 3.25 0 1 1-3.25 3.25H6z" fill={color} />}
        </>
      )}
    </svg>
  )
}

// A single station marker (relations, search results, legends).
export function StationDot({ status, size = 10, className = '' }: { status: IssueStatus; size?: number; className?: string }) {
  return <StationGlyph status={status} size={size + 2} className={className} />
}

// The issue page's status control: the whole line, one button per station. Toggle buttons rather than
// radios, so moving through them with the keyboard never changes anything until a station is chosen.
export function StatusStepper({
  status,
  disabled = false,
  onChange,
}: {
  status: IssueStatus
  disabled?: boolean
  onChange: (next: IssueStatus) => void
}) {
  const t = useT()
  const index = ISSUE_STATUSES.indexOf(status)
  const color = STATION_COLOR[status]
  const travelled = (index / (ISSUE_STATUSES.length - 1)) * 100
  const mounted = useMounted()
  return (
    <fieldset aria-label={t('common.status')} disabled={disabled} className="min-w-0">
      <div className="relative">
        {/* The rail runs between the first and the last station centres (each station is 1/5 wide). */}
        <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-[11px] h-[3px] rounded-full bg-border" />
        <div
          aria-hidden="true"
          className="absolute left-[10%] top-[11px] h-[3px] rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={{ width: `${(mounted ? travelled : 0) * 0.8}%`, backgroundColor: color }}
        />
        {/* The "train": one marker that rides along the rail to the current station. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[3.5px] z-10 block h-[18px] w-[18px] -translate-x-1/2 rounded-full ring-4 ring-surface transition-[left,background-color] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={{ left: `${10 + (mounted ? index : 0) * 20}%`, backgroundColor: color }}
        />
        <ol className="relative grid grid-cols-5">
          {ISSUE_STATUSES.map((station, i) => {
            const current = i === index
            const passed = i < index
            return (
              <li key={station} className="flex justify-center">
                <button
                  type="button"
                  aria-pressed={current}
                  onClick={() => !current && onChange(station)}
                  className="group flex min-h-11 w-full flex-col items-center rounded-md px-0.5 pb-1 text-center disabled:cursor-not-allowed"
                >
                  {/* 25px high, so every marker — small or the larger current one — centres on the rail. */}
                  <span aria-hidden="true" className="flex h-[25px] items-center justify-center">
                    <span
                      // The current station's own dot hides under the train.
                      className={`block h-[10px] w-[10px] rounded-full ring-2 ring-surface transition-transform duration-150 ${
                        current ? 'opacity-0' : 'group-enabled:group-hover:scale-125'
                      }`}
                      style={{
                        backgroundColor: current || passed ? color : 'var(--color-surface)',
                        boxShadow: current || passed ? undefined : 'inset 0 0 0 1.5px var(--color-border-strong)',
                      }}
                    />
                  </span>
                  <span
                    className={`mt-1 text-[12px] leading-tight ${current ? 'font-bold text-fg' : 'text-fg-muted group-enabled:group-hover:text-fg'}`}
                  >
                    {t(`status.${station}`)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </fieldset>
  )
}

// A progress line: the filled part ends in a station marker, the rest of the rail waits.
export function TrackProgress({ percent, label, className = '' }: { percent: number; label: string; className?: string }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)))
  const shown = useMounted() ? value : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={`relative h-3 w-full ${className}`}
    >
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-border" />
      <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${shown}%` }} />
      <div
        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-2 ring-surface transition-[left] duration-700 ease-out"
        style={{ left: `${shown}%` }}
      />
    </div>
  )
}

// The brand mark: a short line with three stations, the last one reached.
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 12) / 28} viewBox="0 0 28 12" aria-hidden="true" focusable="false" className="shrink-0">
      <line x1="3" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="3.5" cy="6" r="2.5" fill="currentColor" />
      <circle cx="13.5" cy="6" r="2.5" fill="currentColor" />
      <circle cx="23" cy="6" r="4.25" fill="var(--color-orange)" stroke="var(--color-surface)" strokeWidth="1.5" className="origin-[23px_6px] transition-transform duration-300 group-hover/logo:scale-125" />
    </svg>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`group/logo inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.03em] text-fg ${className}`}>
      <LogoMark />
      DevTrack
    </span>
  )
}
