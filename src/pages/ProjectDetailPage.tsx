import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addProjectMember,
  getProject,
  listProjectMembers,
  removeProjectMember,
  updateProject,
} from '../api/projects'
import { listTeams } from '../api/teams'
import { createProjectComment, listProjectComments } from '../api/comments'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { CommentThread } from '../components/CommentThread'
import { ProjectGithubLink } from '../components/ProjectGithubLink'
import { ProjectHealthCard } from '../components/ProjectHealthCard'
import { FormField, formInputClass } from '../components/FormField'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('member')
  const [errors, setErrors] = useState<FieldErrors>({})

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: Number.isFinite(projectId),
  })

  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers(projectId),
    enabled: Number.isFinite(projectId),
  })

  const addMemberMutation = useMutation({
    mutationFn: () => addProjectMember(projectId, { username, role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
      setUsername('')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error)),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeProjectMember(projectId, userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['project-members', projectId] }),
  })

  const teamsQuery = useQuery({
    queryKey: ['teams', projectQuery.data?.workspace],
    queryFn: () => listTeams(projectQuery.data!.workspace),
    enabled: projectQuery.data?.workspace !== undefined,
  })

  const updateTeamMutation = useMutation({
    mutationFn: (teamId: number | null) => updateProject(projectId, { team: teamId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  function handleAddMember(event: FormEvent) {
    event.preventDefault()
    addMemberMutation.mutate()
  }

  if (projectQuery.isLoading) {
    return <p className="text-sm text-fg-muted">Loading project…</p>
  }
  if (projectQuery.isError || !projectQuery.data) {
    return <p className="text-sm text-red-400">Couldn't load this project.</p>
  }

  const project = projectQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-fg">{project.name}</h1>
          <PriorityBadge priority={project.priority} />
          <StatusBadge status={project.status} />
          <div className="ml-auto flex gap-2">
            <Link
              to={`/projects/${projectId}/issues`}
              className="rounded border border-border px-3 py-1 text-sm text-fg transition-colors duration-150 hover:border-fg"
            >
              Issues
            </Link>
            <Link
              to={`/projects/${projectId}/board`}
              className="rounded border border-border px-3 py-1 text-sm text-fg transition-colors duration-150 hover:border-fg"
            >
              Board
            </Link>
            <Link
              to={`/projects/${projectId}/cycles`}
              className="rounded border border-border px-3 py-1 text-sm text-fg transition-colors duration-150 hover:border-fg"
            >
              Cycles
            </Link>
            <Link
              to={`/projects/${projectId}/milestones`}
              className="rounded border border-border px-3 py-1 text-sm text-fg transition-colors duration-150 hover:border-fg"
            >
              Milestones
            </Link>
            <Link
              to={`/projects/${projectId}/notes`}
              className="rounded border border-border px-3 py-1 text-sm text-fg transition-colors duration-150 hover:border-fg"
            >
              Notes
            </Link>
            <Link
              to={`/projects/${projectId}/timeline`}
              className="rounded border border-border px-3 py-1 text-sm text-fg transition-colors duration-150 hover:border-fg"
            >
              Timeline
            </Link>
          </div>
        </div>
        {project.description && <p className="text-sm text-fg-muted">{project.description}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-fg-muted">Owner</dt>
            <dd className="text-fg">{project.owner.username}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Start date</dt>
            <dd className="text-fg">{project.start_date ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Target date</dt>
            <dd className="text-fg">{project.target_date ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Repository</dt>
            <dd className="text-fg">{project.repository_url ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Team</dt>
            <dd className="text-fg">
              <select
                className="rounded border border-border bg-bg px-2 py-1 text-sm text-fg outline-none focus:border-fg"
                value={project.team ?? ''}
                onChange={(e) =>
                  updateTeamMutation.mutate(e.target.value ? Number(e.target.value) : null)
                }
                disabled={updateTeamMutation.isPending}
              >
                <option value="">No team</option>
                {teamsQuery.data?.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </dd>
          </div>
        </dl>
      </div>

      <ProjectHealthCard projectId={projectId} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-fg">Members</h2>
        {membersQuery.isLoading && <p className="text-sm text-fg-muted">Loading members…</p>}
        <ul className="mb-3 flex flex-col gap-1">
          {membersQuery.data?.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded border border-border bg-bg-elevated px-3 py-2 text-sm"
            >
              <span className="text-fg">
                {member.user.username} <span className="text-fg-muted">· {member.role}</span>
              </span>
              <button
                type="button"
                onClick={() => removeMemberMutation.mutate(member.user.id)}
                className="text-xs text-fg-muted transition-colors duration-150 hover:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddMember} className="flex max-w-md items-end gap-2">
          {errors.non_field_errors && (
            <p className="text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
          )}
          <FormField label="Username" errors={errors.username}>
            <input
              className={formInputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Role" errors={errors.role}>
            <select className={formInputClass} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </FormField>
          <button
            type="submit"
            disabled={addMemberMutation.isPending}
            className="mb-0.5 rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            Add
          </button>
        </form>
      </div>

      <ProjectGithubLink projectId={projectId} />

      <CommentThread
        queryKey={['project-comments', projectId]}
        listComments={() => listProjectComments(projectId)}
        createComment={(body) => createProjectComment(projectId, body)}
      />
    </div>
  )
}
