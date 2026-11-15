import { useState } from 'react'
import { SkeletonList } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMilestone, deleteMilestone, listMilestones } from '../api/milestones'
import { ConfirmButton } from '../components/ConfirmButton'
import { FormField, formInputClass } from '../components/FormField'
import { ProgressBar } from '../components/ProgressBar'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { button } from '../components/ui'

export function ProjectMilestonesPage() {
  const { t, lang, formatDate } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const milestonesQuery = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => listMilestones(projectId),
    enabled: Number.isFinite(projectId),
  })

  const createMutation = useMutation({
    mutationFn: createMilestone,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      setIsFormOpen(false)
      setName('')
      setDescription('')
      setTargetDate('')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['milestones', projectId] }),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate({ project: projectId, name, description, target_date: targetDate })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <h1 className="text-2xl font-extrabold tracking-[-0.015em] text-fg">{t('milestones.title')}</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className={button(isFormOpen ? 'secondary' : 'primary')}
        >
          {isFormOpen ? t('common.cancel') : t('milestones.new')}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 max-w-xl rounded-xl border border-border bg-surface p-5">
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
          <div className="mb-4">
            <FormField label={t('common.description')} errors={errors.description}>
              <textarea
                className={formInputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </FormField>
          </div>
          <div className="mb-4">
            <FormField label={t('common.targetDate')} errors={errors.target_date}>
              <input
                type="date"
                className={formInputClass}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </FormField>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={button('primary')}
          >
            {createMutation.isPending ? t('common.creating') : t('milestones.create')}
          </button>
        </form>
      )}

      {milestonesQuery.isLoading && <SkeletonList count={3} className="h-20" />}
      {milestonesQuery.isError && <p className="text-sm text-danger">{t('milestones.loadFailed')}</p>}
      {milestonesQuery.data?.length === 0 && !isFormOpen && (
        <EmptyState
          icon="milestones"
          title={t('empty.milestones.title')}
          description={t('empty.milestones.desc')}
          action={{ label: t('empty.milestones.action'), onClick: () => setIsFormOpen(true) }}
        />
      )}

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface empty:hidden">
        {milestonesQuery.data?.map((milestone) => (
          <div key={milestone.id} className="px-5 py-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-bold text-fg">{milestone.name}</div>
                {milestone.description && <div className="text-xs text-fg-muted">{milestone.description}</div>}
                <div className="text-xs text-fg-muted">
                  {t('milestones.target', { date: formatDate(milestone.target_date) })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-fg-muted tabular">
                  {t('planning.doneCount', { done: milestone.completed_count, total: milestone.issue_count })}
                </span>
                <ConfirmButton
                  onConfirm={() => deleteMutation.mutate(milestone.id)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-fg-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
                >
                  {t('common.delete')}
                </ConfirmButton>
              </div>
            </div>
            <ProgressBar percent={milestone.completion_percent} label={milestone.name} />
          </div>
        ))}
      </div>
    </div>
  )
}
