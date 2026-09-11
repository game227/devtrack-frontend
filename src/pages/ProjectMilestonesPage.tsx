import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMilestone, deleteMilestone, listMilestones } from '../api/milestones'
import { FormField, formInputClass } from '../components/FormField'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'

export function ProjectMilestonesPage() {
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
    onError: (error) => setErrors(extractFieldErrors(error)),
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
        <h1 className="text-xl font-semibold text-fg">Milestones</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          {isFormOpen ? 'Cancel' : 'New milestone'}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-md rounded border border-border bg-bg-elevated p-4">
          {errors.non_field_errors && (
            <p className="mb-3 text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
          )}
          <div className="mb-3">
            <FormField label="Name" errors={errors.name}>
              <input className={formInputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
          </div>
          <div className="mb-3">
            <FormField label="Description" errors={errors.description}>
              <textarea
                className={formInputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </FormField>
          </div>
          <div className="mb-3">
            <FormField label="Target date" errors={errors.target_date}>
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
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create milestone'}
          </button>
        </form>
      )}

      {milestonesQuery.isLoading && <p className="text-sm text-fg-muted">Loading milestones…</p>}
      {milestonesQuery.isError && (
        <p className="text-sm text-red-400">Couldn't load milestones. Is the backend running?</p>
      )}
      {milestonesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">No milestones yet.</p>}

      <div className="flex flex-col gap-2">
        {milestonesQuery.data?.map((milestone) => (
          <div key={milestone.id} className="rounded border border-border bg-bg-elevated px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-fg">{milestone.name}</div>
                {milestone.description && (
                  <div className="text-xs text-fg-muted">{milestone.description}</div>
                )}
                <div className="text-xs text-fg-muted">Target: {milestone.target_date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-fg-muted">
                  {milestone.completed_count}/{milestone.issue_count} done
                </span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(milestone.id)}
                  className="text-xs text-fg-muted hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${milestone.completion_percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
