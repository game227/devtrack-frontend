import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMilestone, deleteMilestone, listMilestones } from '../api/milestones'
import { ConfirmButton } from '../components/ConfirmButton'
import { FormField, formInputClass } from '../components/FormField'
import { ProgressBar } from '../components/ProgressBar'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'

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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">{t('milestones.title')}</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98]"
        >
          {isFormOpen ? t('common.cancel') : t('milestones.new')}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-md rounded border border-border bg-bg-elevated p-4">
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
          <div className="mb-3">
            <FormField label={t('common.description')} errors={errors.description}>
              <textarea
                className={formInputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </FormField>
          </div>
          <div className="mb-3">
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
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {createMutation.isPending ? t('common.creating') : t('milestones.create')}
          </button>
        </form>
      )}

      {milestonesQuery.isLoading && <p className="text-sm text-fg-muted">{t('milestones.loading')}</p>}
      {milestonesQuery.isError && <p className="text-sm text-danger">{t('milestones.loadFailed')}</p>}
      {milestonesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">{t('milestones.empty')}</p>}

      <div className="flex flex-col gap-2">
        {milestonesQuery.data?.map((milestone) => (
          <div key={milestone.id} className="rounded border border-border bg-bg-elevated px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-fg">{milestone.name}</div>
                {milestone.description && <div className="text-xs text-fg-muted">{milestone.description}</div>}
                <div className="text-xs text-fg-muted">
                  {t('milestones.target', { date: formatDate(milestone.target_date) })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-fg-muted">
                  {t('planning.doneCount', { done: milestone.completed_count, total: milestone.issue_count })}
                </span>
                <ConfirmButton
                  onConfirm={() => deleteMutation.mutate(milestone.id)}
                  className="text-xs text-fg-muted transition-colors duration-150 hover:text-danger"
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
