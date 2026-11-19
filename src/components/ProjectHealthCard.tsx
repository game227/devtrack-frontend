import { useQuery } from '@tanstack/react-query'
import { getProjectHealth } from '../api/health'
import { useT } from '../i18n'
import { HealthStatusBadge } from './Badge'
import { Skeleton } from './Skeleton'
import { CountUp } from './CountUp'
import type { ProjectHealth, ProjectHealthBreakdownRow, ProjectHealthFactorKey } from '../types/health'

const FACTORS: ProjectHealthFactorKey[] = ['task_progress', 'deadline', 'bug_rate', 'development_activity', 'flow']

// Same thresholds as the backend's status labels, so a bar's colour agrees with the badge.
function toneClass(score: number) {
  if (score >= 80) return 'bg-st-done'
  if (score >= 50) return 'bg-st-progress'
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
      if (!d.days_since) return t('health.detail.activityToday', { source: d.source === 'github' ? 'GitHub' : 'DevTrack' })
      return t(`health.detail.development_activity.${d.source ?? 'devtrack'}`, { days: d.days_since ?? 0 })
    case 'flow':
      return t('health.detail.flow', { stale: d.stale ?? 0, in_flight: d.in_flight ?? 0 })
  }
}

// The score as a ring: the arc carries the same tone as the factor bars (green, orange, red at the
// backend's thresholds), on a faint track of that tone; the number sits in the middle.
function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--color-st-done)' : score >= 50 ? 'var(--color-st-progress)' : 'var(--color-danger)'
  return (
    <span className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center">
      <svg aria-hidden="true" viewBox="0 0 76 76" className="absolute inset-0 -rotate-90">
        <circle cx="38" cy="38" r="33" fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r="33"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${Math.max(score, 0.5)} 100`}
          className="ring-fill"
        />
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        <span className="text-[26px] font-semibold tracking-[-0.02em] text-fg">
          <CountUp value={score} />
        </span>
        <span className="mt-0.5 text-[10px] font-medium text-fg-muted">/100</span>
      </span>
    </span>
  )
}

function FactorRow({ health, factorKey }: { health: ProjectHealth; factorKey: ProjectHealthFactorKey }) {
  const t = useT()
  const score = health.factors[factorKey]
  const row = health.breakdown?.find((entry) => entry.key === factorKey)
  const weight = row?.weight
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span title={t(`health.hint.${factorKey}`)} className="font-semibold text-fg">
          {t(`health.factor.${factorKey}`)}
          {weight ? <span className="ml-1.5 text-xs font-normal text-fg-muted">({weight}%)</span> : null}
        </span>
        <span className="shrink-0 font-bold text-fg tabular">{score === null ? t('health.noScore') : score}</span>
      </div>
      {score === null ? (
        <p className="text-xs text-fg-muted">{t(`health.na.${factorKey}`)}</p>
      ) : (
        <>
          <div className="h-[6px] w-full overflow-hidden rounded-full bg-well">
            <div className={`h-full origin-left animate-grow-x rounded-full ${toneClass(score)}`} style={{ width: `${Math.max(score, 1)}%` }} />
          </div>
          {/* Why the number is what it is, in one line ("7 issues in the active cycle, 0 done..."). */}
          {row && <p className="mt-1 text-xs text-fg-muted">{detailText(t, row)}</p>}
        </>
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
    return <Skeleton className="h-72" />
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
    <section aria-labelledby="project-health" className="rounded-xl border border-edge bg-surface shadow-panel p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="project-health" className="text-base font-semibold tracking-[-0.01em] text-fg">
            {t('health.title')}
          </h2>
          {health.confidence === 'low' && <p className="mt-1 max-w-md text-sm text-fg-muted">{t('health.lowConfidence')}</p>}
        </div>
        <div className="flex items-center gap-4">
          <HealthStatusBadge status={health.status} />
          <ScoreRing score={health.score} />
        </div>
      </div>

      {health.capped_by && health.capped_by.length > 0 && (
        <div role="note" className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <span className="font-semibold">{t('health.capped')}</span>{' '}
          {health.capped_by.map((code) => t(`health.cap.${code}`)).join(' ')}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-4">
        {FACTORS.map((key) => (
          <FactorRow key={key} health={health} factorKey={key} />
        ))}
      </div>

      {risks.length > 0 && (
        <div className="mb-4 rounded-lg border border-border bg-well px-4 py-3">
          <h3 className="mb-1.5 text-sm font-bold text-fg">{t('health.risks')}</h3>
          <ul className="flex flex-col gap-1.5">
            {risks.map((risk, index) => (
              <li key={index} className="flex gap-2 text-sm text-fg">
                <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-st-progress" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.length > 0 && (
        <details className="group border-t border-border pt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-accent hover:underline">
            {t('health.how')}
          </summary>
          <p className="mt-2 text-fg-muted">{t('health.howIntro')}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {breakdown.map((row) => (
              <li key={row.key} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-fg">{t(`health.factor.${row.key}`)}</div>
                  <div className="text-fg-muted">{t(`health.hint.${row.key}`)}</div>
                </div>
                <span className="shrink-0 font-semibold text-fg-muted tabular">
                  {row.score === null ? t('health.noScore') : `${row.points.toFixed(1)} ${t('health.points')}`}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
