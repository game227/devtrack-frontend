import { useQuery } from '@tanstack/react-query'
import { getProjectHealth } from '../api/health'
import { useT } from '../i18n'
import { HealthStatusBadge } from './Badge'
import type { ProjectHealthFactors } from '../types/health'

const FACTORS: (keyof ProjectHealthFactors)[] = ['task_progress', 'development_activity', 'deadline', 'bug_rate']

export function ProjectHealthCard({ projectId }: { projectId: number }) {
  const t = useT()
  const healthQuery = useQuery({
    queryKey: ['project-health', projectId],
    queryFn: () => getProjectHealth(projectId),
    enabled: Number.isFinite(projectId),
  })

  if (healthQuery.isLoading) {
    return <p className="text-sm text-fg-muted">{t('health.loading')}</p>
  }
  if (healthQuery.isError || !healthQuery.data) {
    return null
  }

  const health = healthQuery.data
  // Prefer the structured risks (localizable); older backends only send English strings.
  const risks = health.risk_details
    ? health.risk_details.map((risk) => t(`health.risk.${risk.code}`, { count: risk.count, days: risk.days ?? 0 }))
    : health.risks

  return (
    <div className="rounded border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">{t('health.title')}</h2>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-fg">{health.score}</span>
          <HealthStatusBadge status={health.status} />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        {FACTORS.map((key) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs text-fg-muted">
              <span>{t(`health.factor.${key}`)}</span>
              <span>{health.factors[key]}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-fg" style={{ width: `${health.factors[key]}%` }} />
            </div>
          </div>
        ))}
      </div>

      {risks.length > 0 && (
        <div>
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
    </div>
  )
}
