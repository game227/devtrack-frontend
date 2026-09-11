import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, listProjects } from '../api/projects'
import { useWorkspace } from '../features/workspace/WorkspaceContext'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { FormField, formInputClass } from '../components/FormField'
import { Skeleton } from '../components/Skeleton'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import type { ProjectStatus, Priority } from '../types/project'

export function ProjectsPage() {
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('planned')
  const [priority, setPriority] = useState<Priority>('none')
  const [errors, setErrors] = useState<FieldErrors>({})

  const workspaceId = currentWorkspace?.id

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId!),
    enabled: workspaceId !== undefined,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
      setIsFormOpen(false)
      setName('')
      setDescription('')
      setStatus('planned')
      setPriority('none')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error)),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!workspaceId) return
    createMutation.mutate({ workspace: workspaceId, name, description, status, priority })
  }

  if (isWorkspaceLoading) {
    return <p className="text-sm text-fg-muted">Loading workspace…</p>
  }

  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">No workspace found.</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">Projects</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          {isFormOpen ? 'Cancel' : 'New project'}
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 max-w-md rounded border border-border bg-bg-elevated p-4"
        >
          {errors.non_field_errors && (
            <p className="mb-3 text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
          )}
          <div className="mb-3">
            <FormField label="Name" errors={errors.name}>
              <input
                className={formInputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
          <div className="mb-3 grid grid-cols-2 gap-2">
            <FormField label="Status" errors={errors.status}>
              <select
                className={formInputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                {(['planned', 'active', 'paused', 'completed', 'archived'] as ProjectStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </FormField>
            <FormField label="Priority" errors={errors.priority}>
              <select
                className={formInputClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {(['none', 'low', 'medium', 'high', 'urgent'] as Priority[]).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {createMutation.isPending ? 'Creating…' : 'Create project'}
          </button>
        </form>
      )}

      {projectsQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}
      {projectsQuery.isError && (
        <p className="text-sm text-red-400">Couldn't load projects. Is the backend running?</p>
      )}
      {projectsQuery.data && projectsQuery.data.length === 0 && (
        <p className="text-sm text-fg-muted">No projects yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {projectsQuery.data?.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="flex items-center justify-between rounded border border-border bg-bg-elevated px-4 py-3 transition-colors duration-150 hover:border-accent"
          >
            <div>
              <div className="text-sm font-medium text-fg">{project.name}</div>
              {project.description && (
                <div className="text-xs text-fg-muted">{project.description}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={project.priority} />
              <StatusBadge status={project.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
