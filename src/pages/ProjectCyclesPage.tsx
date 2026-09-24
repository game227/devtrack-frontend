import { useState } from 'react'
import { SkeletonList } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCycle, deleteCycle, listCycles } from '../api/cycles'
import { ConfirmButton } from '../components/ConfirmButton'
import { FormField, formInputClass } from '../components/FormField'
import { ProgressBar } from '../components/ProgressBar'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'

export function ProjectCyclesPage() {
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">{t('cycles.title')}</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98]"
        >
          {isFormOpen ? t('common.cancel') : t('cycles.new')}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-md rounded-2xl border border-border bg-bg-elevated p-4">
          {errors.non_field_errors && (
            <p role="alert" className="mb-3 text-sm text-danger">
              {errors.non_field_errors.join(' ')}
            </p>
          )}
          <div className="mb-3">
            <FormField label={t('common.name')} errors={errors.name}>
              <input className={formInputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
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
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {createMutation.isPending ? t('common.creating') : t('cycles.create')}
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

      <div className="flex flex-col gap-2">
        {cyclesQuery.data?.map((cycle) => (
          <div key={cycle.id} className="rounded-2xl border border-border bg-bg-elevated px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <span className="text-sm font-medium text-fg">{cycle.name}</span>
                {cycle.is_active && (
                  <span className="ml-2 rounded-md border border-border px-2 py-0.5 text-xs font-medium text-success">
                    {t('cycles.active')}
                  </span>
                )}
                <div className="text-xs text-fg-muted">
                  {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-fg-muted">
                  {t('planning.doneCount', { done: cycle.completed_count, total: cycle.issue_count })}
                </span>
                <ConfirmButton
                  onConfirm={() => deleteMutation.mutate(cycle.id)}
                  className="text-xs text-fg-muted transition-colors duration-150 hover:text-danger"
                >
                  {t('common.delete')}
                </ConfirmButton>
              </div>
            </div>
            <ProgressBar percent={cycle.completion_percent} label={cycle.name} />
          </div>
        ))}
      </div>
    </div>
  )
}
