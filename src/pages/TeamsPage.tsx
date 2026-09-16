import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addTeamMember, createTeam, listTeamMembers, listTeams, removeTeamMember } from '../api/teams'
import { useWorkspace } from '../features/workspace/WorkspaceContext'
import { FormField, formInputClass } from '../components/FormField'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'

function TeamMembers({ teamId }: { teamId: number }) {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const membersQuery = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => listTeamMembers(teamId),
  })

  const addMutation = useMutation({
    mutationFn: () => addTeamMember(teamId, username),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
      setUsername('')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error)),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeTeamMember(teamId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!username.trim()) return
    addMutation.mutate()
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {membersQuery.isLoading && <p className="text-sm text-fg-muted">Loading members…</p>}
      <ul className="mb-3 flex flex-col gap-1">
        {membersQuery.data?.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between rounded border border-border bg-bg px-3 py-2 text-sm"
          >
            <span className="text-fg">{member.user.username}</span>
            <button
              type="button"
              onClick={() => removeMutation.mutate(member.user.id)}
              className="text-xs text-fg-muted transition-colors duration-150 hover:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
        {membersQuery.data?.length === 0 && <li className="text-sm text-fg-muted">No members yet.</li>}
      </ul>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {errors.non_field_errors && (
          <p className="text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
        )}
        <FormField label="Username" errors={errors.username}>
          <input className={formInputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
        </FormField>
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="mb-0.5 rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          Add
        </button>
      </form>
    </div>
  )
}

export function TeamsPage() {
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const queryClient = useQueryClient()
  const workspaceId = currentWorkspace?.id
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)

  const teamsQuery = useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: () => listTeams(workspaceId!),
    enabled: workspaceId !== undefined,
  })

  const createMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] })
      setIsFormOpen(false)
      setName('')
      setDescription('')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error)),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!workspaceId) return
    createMutation.mutate({ workspace: workspaceId, name, description })
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
        <h1 className="text-xl font-semibold text-fg">Teams</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98]"
        >
          {isFormOpen ? 'Cancel' : 'New team'}
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
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {createMutation.isPending ? 'Creating…' : 'Create team'}
          </button>
        </form>
      )}

      {teamsQuery.isLoading && <p className="text-sm text-fg-muted">Loading teams…</p>}
      {teamsQuery.isError && (
        <p className="text-sm text-red-400">Couldn't load teams. Is the backend running?</p>
      )}
      {teamsQuery.data?.length === 0 && <p className="text-sm text-fg-muted">No teams yet.</p>}

      <div className="flex flex-col gap-2">
        {teamsQuery.data?.map((team) => {
          const isExpanded = expandedTeamId === team.id
          return (
            <div key={team.id} className="rounded border border-border bg-bg-elevated px-4 py-3">
              <button
                type="button"
                onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <div className="text-sm font-medium text-fg">{team.name}</div>
                  {team.description && <div className="text-xs text-fg-muted">{team.description}</div>}
                </div>
                <span className="text-xs text-fg-muted">
                  {team.member_count} member{team.member_count === 1 ? '' : 's'}
                </span>
              </button>
              {isExpanded && <TeamMembers teamId={team.id} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
