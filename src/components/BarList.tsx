import { useT } from '../i18n'

export interface BarRow {
  key: string
  label: string
  value: number
  // Reserved status colours only, and always next to the text label; defaults to the foreground.
  color?: string
}

interface BarListProps {
  rows: BarRow[]
  total: number
}

// Horizontal bars for one measure: label left, value + share right. A single hue, thin marks with a
// rounded data-end, and the numbers printed beside each bar so nothing depends on colour alone.
export function BarList({ rows, total }: BarListProps) {
  const t = useT()
  const max = Math.max(...rows.map((row) => row.value), 1)
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const percent = total > 0 ? Math.round((row.value / total) * 100) : 0
        return (
          <li
            key={row.key}
            title={t('analytics.barLabel', { label: row.label, value: row.value, percent })}
            className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm"
          >
            <span className="flex items-center gap-2 truncate text-fg-muted">
              {row.color && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />}
              <span className="truncate">{row.label}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-r bg-border/40">
              <span
                className="block h-full rounded-r"
                style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color ?? 'var(--color-fg)' }}
              />
            </span>
            <span className="w-16 text-right font-mono text-xs tabular-nums text-fg">
              {row.value} <span className="text-fg-muted">· {percent}%</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
