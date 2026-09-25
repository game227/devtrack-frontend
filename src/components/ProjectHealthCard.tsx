import { useQuery } from '@tanstack/react-query'
import { getProjectHealth } from '../api/health'
import { useT } from '../i18n'
import { HealthStatusBadge } from './Badge'
import { Skeleton } from './Skeleton'
import type { ProjectHealth, ProjectHealthBreakdownRow, ProjectHealthFactorKey } from '../types/health'

const FACTORS: ProjectHealthFactorKey[] = ['task_progress', 'deadline', 'bug_rate', 'development_activity', 'flow']

// Same thresholds as the backend's status labels, so a bar's colour agrees with the badge.
function toneClass(score: number) {
  if (score >= 80) return 'bg-success'
  if (score >= 50) return 'bg-warning'
  return 'bg-danger'
}

function detailText(t: ReturnType<typeof useT>, row: ProjectHealthBreakdownRow): string {
  const d = row.detail
  switch (row.key) {
    case 'task_progress':
      return t(`health.detail.task_progress.${d.mode ?? 'flow'}`, {
        done: d.done ?? 0,
        total: d.total ?? 0,
        expected: d.expected_percent ?? 0,
        closed: d.closed ?? 0,
        opened: d.opened ?? 0,
        days: d.days ?? 0,
      })
    case 'deadline':
      return t('health.detail.deadline', { overdue: d.overdue ?? 0, dated: d.dated ?? 0 })
    case 'bug_rate':
      return t('health.detail.bug_rate', { open: d.open_bugs ?? 0, urgent: d.urgent ?? 0 })
    case 'development_activity':
      return t(`health.detail.development_activity.${d.source ?? 'devtrack'}`, { days: d.days_since ?? 0 })
    case 'flow':
      return t('health.detail.flow', { stale: d.stale ?? 0, in_flight: d.in_flight ?? 0 })
  }
}

function FactorRow({ health, factorKey }: { health: ProjectHealth; factorKey: ProjectHealthFactorKey }) {
  const t = useT()
  const score = health.factors[factorKey]
  const weight = health.breakdown?.find((row) => row.key === factorKey)?.weight
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-fg-muted">
        <span title={t(`health.hint.${factorKey}`)}>{t(`health.factor.${factorKey}`)}</span>
        <span className="shrink-0">
          {score === null ? '—' : score}
          {weight ? <span className="ml-1.5 text-fg-muted/60">· {weight}%</span> : null}
        </span>
      </div>
      {score === null ? (
        <p className="text-xs text-fg-muted/70">{t(`health.na.${factorKey}`)}</p>
      ) : (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className={`h-full rounded-full ${toneClass(score)}`} style={{ width: `${score}%` }} />
        </div>
      )}
    </div>
  )
}

export function ProjectHealthCard({ projectId }: { projectId: number }) {
  const t = useT()
  const healthQuery = useQuery({
    queryKey: ['project-health', projectId],
    queryFn: () => getProjectHealth(projectId),
    enabled: Number.isFinite(projectId),
  })

  if (healthQuery.isLoading) {
    return <Skeleton className="h-64" />
  }
  if (healthQuery.isError || !healthQuery.data) {
    return null
  }

  const health = healthQuery.data
  // Prefer the structured risks (localizable); older backends only send English strings.
  const risks = health.risk_details
    ? health.risk_details.map((risk) => t(`health.risk.${risk.code}`, { count: risk.count, days: risk.days ?? 0 }))
    : health.risks
  const breakdown = health.breakdown ?? []

  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">{t('health.title')}</h2>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-fg">{health.score}</span>
          <HealthStatusBadge status={health.status} />
        </div>
      </div>

      {health.confidence === 'low' && <p className="mb-3 text-xs text-fg-muted">{t('health.lowConfidence')}</p>}

      {health.capped_by && health.capped_by.length > 0 && (
        <div role="note" className="mb-3 rounded-md border border-border px-3 py-2 text-xs text-warning">
          <span className="font-semibold">{t('health.capped')}</span>{' '}
          {health.capped_by.map((code) => t(`health.cap.${code}`)).join(' ')}
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2.5">
        {FACTORS.map((key) => (
          <FactorRow key={key} health={health} factorKey={key} />
        ))}
      </div>

      {risks.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-xs font-semibold uppercase text-fg-muted">{t('health.risks')}</div>
          <ul className="flex flex-col gap-1">
            {risks.map((risk, index) => (
              <li key={index} className="text-sm text-warning">
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.length > 0 && (
        <details className="group border-t border-border pt-3 text-xs">
          <summary className="cursor-pointer text-fg-muted transition-colors duration-150 hover:text-fg">
            {t('health.how')}
          </summary>
          <p className="mt-2 text-fg-muted">{t('health.howIntro')}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {breakdown.map((row) => (
              <li key={row.key} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-fg">{t(`health.factor.${row.key}`)}</div>
                  <div className="text-fg-muted">{row.score === null ? t(`health.na.${row.key}`) : detailText(t, row)}</div>
                </div>
                <span className="shrink-0 font-mono text-fg-muted">
                  {row.score === null ? '—' : `${row.points.toFixed(1)} ${t('health.points')}`}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
