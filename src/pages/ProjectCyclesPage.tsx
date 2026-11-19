import { useState } from 'react'
import { SkeletonList } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCycle, deleteCycle, listCycles } from '../api/cycles'
import { BurndownChart } from '../components/BurndownChart'
import { ConfirmButton } from '../components/ConfirmButton'
import { PlanCount, PlanTiming } from '../components/PlanTiming'
import { Icon } from '../components/Icon'
import { FormField, formInputClass } from '../components/FormField'
import { ProgressBar } from '../components/ProgressBar'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { button } from '../components/ui'
import { Spinner } from '../components/Spinner'

export function ProjectCyclesPage() {
  // The active cycle's burndown is open by default; the others open on request.
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const isOpen = (cycle: { id: number; is_active: boolean }) => open[cycle.id] ?? cycle.is_active
  const { t, lang, formatDate } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const cyclesQuery = useQuery({
    queryKey: ['cycles', projectId],
    queryFn: () => listCycles(projectId),
    enabled: Number.isFinite(projectId),
  })

  const createMutation = useMutation({
    mutationFn: createCycle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cycles', projectId] })
      setIsFormOpen(false)
      setName('')
      setStartDate('')
      setEndDate('')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCycle,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['cycles', projectId] }),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate({ project: projectId, name, start_date: startDate, end_date: endDate })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <h1 className="text-2xl font-semibold tracking-[-0.015em] text-fg">{t('cycles.title')}</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className={button(isFormOpen ? 'secondary' : 'primary')}
        >
          {isFormOpen ? t('common.cancel') : t('cycles.new')}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 max-w-xl rounded-xl border border-edge bg-surface shadow-panel p-5">
          {errors.non_field_errors && (
            <p role="alert" className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {errors.non_field_errors.join(' ')}
            </p>
          )}
          <div className="mb-4">
            <FormField label={t('common.name')} errors={errors.name}>
              <input className={formInputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <FormField label={t('common.startDate')} errors={errors.start_date}>
              <input
                type="date"
                className={formInputClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </FormField>
            <FormField label={t('cycles.endDate')} errors={errors.end_date}>
              <input
                type="date"
                className={formInputClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </FormField>
          </div>
          <button aria-busy={createMutation.isPending}
            type="submit"
            disabled={createMutation.isPending}
            className={button('primary')}
          >
            {createMutation.isPending && <Spinner />}
{t('cycles.create')}
          </button>
        </form>
      )}

      {cyclesQuery.isLoading && <SkeletonList count={3} className="h-20" />}
      {cyclesQuery.isError && <p className="text-sm text-danger">{t('cycles.loadFailed')}</p>}
      {cyclesQuery.data?.length === 0 && !isFormOpen && (
        <EmptyState
          icon="cycles"
          title={t('empty.cycles.title')}
          description={t('empty.cycles.desc')}
          action={{ label: t('empty.cycles.action'), onClick: () => setIsFormOpen(true) }}
        />
      )}

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel empty:hidden">
        {cyclesQuery.data?.map((cycle) => (
          <div key={cycle.id} className="px-5 py-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <span className="text-[15px] font-bold text-fg">{cycle.name}</span>
                {cycle.is_active && (
                  <span className="ml-2 inline-flex h-6 items-center rounded-full border border-success/40 bg-success/10 px-2.5 text-xs font-semibold text-success">
                    {t('cycles.active')}
                  </span>
                )}
                <div className="text-xs text-fg-muted">
                  {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}
                </div>
                <div className="mt-1">
                  <PlanTiming start={cycle.start_date} end={cycle.end_date} done={cycle.completed_count} total={cycle.issue_count} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PlanCount done={cycle.completed_count} total={cycle.issue_count} />
                <ConfirmButton
                  onConfirm={() => deleteMutation.mutate(cycle.id)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-fg-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
                >
                  {t('common.delete')}
                </ConfirmButton>
              </div>
            </div>
            {cycle.issue_count > 0 ? (
              <>
                <ProgressBar percent={cycle.completion_percent} label={cycle.name} />
                <button
                  type="button"
                  aria-expanded={isOpen(cycle)}
                  aria-controls={`burndown-${cycle.id}`}
                  onClick={() => setOpen((current) => ({ ...current, [cycle.id]: !isOpen(cycle) }))}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-fg-muted hover:text-fg"
                >
                  <Icon name="chevronDown" className={`h-3.5 w-3.5 transition-transform ${isOpen(cycle) ? 'rotate-180' : ''}`} />
                  {t('burndown.toggle')}
                </button>
                {isOpen(cycle) && (
                  <div id={`burndown-${cycle.id}`} className="mt-3">
                    <BurndownChart cycleId={cycle.id} name={cycle.name} />
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-fg-muted">{t('plan.howToAddCycle')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
