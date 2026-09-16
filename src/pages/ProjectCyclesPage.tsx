import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCycle, deleteCycle, listCycles } from '../api/cycles'
import { FormField, formInputClass } from '../components/FormField'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'

export function ProjectCyclesPage() {
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
    onError: (error) => setErrors(extractFieldErrors(error)),
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
        <h1 className="text-xl font-semibold text-fg">Cycles</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98]"
        >
          {isFormOpen ? 'Cancel' : 'New cycle'}
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
          <div className="mb-3 grid grid-cols-2 gap-2">
            <FormField label="Start date" errors={errors.start_date}>
              <input
                type="date"
                className={formInputClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </FormField>
            <FormField label="End date" errors={errors.end_date}>
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
            className="rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {createMutation.isPending ? 'Creating…' : 'Create cycle'}
          </button>
        </form>
      )}

      {cyclesQuery.isLoading && <p className="text-sm text-fg-muted">Loading cycles…</p>}
      {cyclesQuery.isError && (
        <p className="text-sm text-red-400">Couldn't load cycles. Is the backend running?</p>
      )}
      {cyclesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">No cycles yet.</p>}

      <div className="flex flex-col gap-2">
        {cyclesQuery.data?.map((cycle) => (
          <div key={cycle.id} className="rounded border border-border bg-bg-elevated px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-fg">{cycle.name}</span>
                {cycle.is_active && (
                  <span className="ml-2 rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    active
                  </span>
                )}
                <div className="text-xs text-fg-muted">
                  {cycle.start_date} – {cycle.end_date}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-fg-muted">
                  {cycle.completed_count}/{cycle.issue_count} done
                </span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(cycle.id)}
                  className="text-xs text-fg-muted transition-colors duration-150 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${cycle.completion_percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
