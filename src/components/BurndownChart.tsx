import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBurndown } from '../api/cycles'
import type { Burndown } from '../api/cycles'
import { useI18n } from '../i18n'

const H = 220
const PAD = { top: 14, right: 14, bottom: 28, left: 34 }
const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']

// The chart is drawn at its box's real width, so labels keep their size on a phone and a wide screen.
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

// Work left per day of a cycle: the ideal straight line (dashed) and what actually happened (ink), ending
// in an orange "today" station. Screen readers get the same numbers as a table.
export function BurndownChart({ cycleId, name }: { cycleId: number; name: string }) {
  const { t, lang, formatDate } = useI18n()
  const [box, W] = useWidth()
  const shortDate = (iso: string) => {
    const [, month, day] = iso.split('-').map(Number)
    return lang === 'uz' ? `${day} ${UZ_MONTHS[month - 1]}` : new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
  }
  const query = useQuery({ queryKey: ['burndown', cycleId], queryFn: () => getBurndown(cycleId) })
  return (
    <div ref={box} className="min-w-0">
      {query.isLoading ? (
        <div className="h-[220px] animate-pulse rounded-lg bg-fg/[0.04]" />
      ) : query.isError || !query.data ? (
        <p className="text-sm text-danger">{t('burndown.failed')}</p>
      ) : query.data.total === 0 ? (
        <p className="text-sm text-fg-muted">{t('burndown.empty')}</p>
      ) : (
        <Chart data={query.data} name={name} width={W} shortDate={shortDate} formatDate={formatDate} />
      )}
    </div>
  )
}

function Chart({
  data,
  name,
  width: W,
  shortDate,
  formatDate,
}: {
  data: Burndown
  name: string
  width: number
  shortDate: (iso: string) => string
  formatDate: (iso: string) => string
}) {
  const { t } = useI18n()

  const n = data.days.length
  const x = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * (W - PAD.left - PAD.right) : 0)
  const y = (v: number) => PAD.top + (1 - v / data.total) * (H - PAD.top - PAD.bottom)
  const ideal = data.days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.ideal).toFixed(1)}`).join(' ')
  const known = data.days.map((d, i) => ({ ...d, i })).filter((d) => d.remaining !== null) as Array<{ date: string; remaining: number; i: number }>
  const actual = known.map((d, k) => `${k ? 'L' : 'M'}${x(d.i).toFixed(1)},${y(d.remaining).toFixed(1)}`).join(' ')
  const last = known[known.length - 1]
  const unit = t(data.unit === 'points' ? 'burndown.points' : 'burndown.issues')
  const ticks = [0, Math.round(data.total / 2), data.total]
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(W / 90))))

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-fg">{t('burndown.title', { name })}</span>
        <span className="font-mono text-xs text-fg-muted">
          {last ? t('burndown.left', { count: last.remaining, unit }) : t('burndown.notStarted')}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" aria-hidden="true">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--color-border)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="fill-[var(--color-fg-muted)] font-mono text-[10px]">
              {v}
            </text>
          </g>
        ))}
        {data.days.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="fill-[var(--color-fg-muted)] font-mono text-[10px]">
              {shortDate(d.date)}
            </text>
          ) : null,
        )}
        <path d={ideal} fill="none" stroke="var(--color-fg-muted)" strokeWidth="1.5" strokeDasharray="4 5" />
        {actual && <path d={actual} fill="none" stroke="var(--color-fg)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="path-draw" />}
        {known.map((d) => (
          <circle key={d.date} cx={x(d.i)} cy={y(d.remaining)} r="2.5" fill="var(--color-fg)" />
        ))}
        {last && <circle cx={x(last.i)} cy={y(last.remaining)} r="5.5" fill="var(--color-orange)" stroke="var(--color-surface)" strokeWidth="2" />}
      </svg>
      <div className="mt-1 flex gap-4 text-xs text-fg-muted" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-fg" />
          {t('burndown.actual')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-[1.5px] border-dashed border-fg-muted" />
          {t('burndown.ideal')}
        </span>
      </div>
      <table className="sr-only">
        <caption>{t('burndown.title', { name })}</caption>
        <thead>
          <tr>
            <th scope="col">{t('burndown.day')}</th>
            <th scope="col">{t('burndown.actual')}</th>
            <th scope="col">{t('burndown.ideal')}</th>
          </tr>
        </thead>
        <tbody>
          {data.days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{formatDate(d.date)}</th>
              <td>{d.remaining ?? '—'}</td>
              <td>{d.ideal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
