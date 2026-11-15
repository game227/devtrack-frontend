import { useState } from 'react'
import { PageSkeleton, SkeletonList } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addTeamMember, createTeam, listTeamMembers, listTeams, removeTeamMember } from '../api/teams'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { FormField, formInputClass } from '../components/FormField'
import { Avatar } from '../components/Avatar'
import { ConfirmButton } from '../components/ConfirmButton'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { Icon } from '../components/Icon'
import { button } from '../components/ui'

function TeamMembers({ teamId }: { teamId: number }) {
  const { t, lang } = useI18n()
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
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
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
    <div className="border-t border-border pt-4">
      {membersQuery.isLoading && <p className="text-sm text-fg-muted">{t('teams.membersLoading')}</p>}
      <ul className="mb-3 flex flex-col gap-1">
        {membersQuery.data?.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between rounded-lg bg-well px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2 text-fg">
              <Avatar name={member.user.username} src={member.user.avatar} size={20} />
              {member.user.username}
            </span>
            <ConfirmButton
              onConfirm={() => removeMutation.mutate(member.user.id)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-fg-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
            >
              {t('common.remove')}
            </ConfirmButton>
          </li>
        ))}
        {membersQuery.data?.length === 0 && <li className="text-sm text-fg-muted">{t('teams.noMembers')}</li>}
      </ul>

      {errors.non_field_errors && (
        <p role="alert" className="mb-2 text-sm font-semibold text-danger">
          {errors.non_field_errors.join(' ')}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <FormField label={t('common.username')} errors={errors.username}>
          <input className={formInputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
        </FormField>
        <button
          type="submit"
          disabled={addMutation.isPending}
          className={button('primary')}
        >
          {t('common.add')}
        </button>
      </form>
    </div>
  )
}

export function TeamsPage() {
  const { t, lang } = useI18n()
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
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!workspaceId) return
    createMutation.mutate({ workspace: workspaceId, name, description })
  }

  if (isWorkspaceLoading) {
    return <PageSkeleton rows={4} />
  }
  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">{t('common.noWorkspace')}</p>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <h1 className="text-2xl font-extrabold tracking-[-0.015em] text-fg">{t('teams.title')}</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className={button(isFormOpen ? 'secondary' : 'primary')}
        >
          {isFormOpen ? t('common.cancel') : t('teams.new')}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 max-w-xl rounded-xl border border-border bg-surface p-5">
          {errors.non_field_errors && (
            <p role="alert" className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{errors.non_field_errors.join(' ')}</p>
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
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={button('primary')}
          >
            {createMutation.isPending ? t('common.creating') : t('teams.create')}
          </button>
        </form>
      )}

      {teamsQuery.isLoading && <SkeletonList count={3} />}
      {teamsQuery.isError && (
        <p className="text-sm text-danger">{t('teams.loadFailed')}</p>
      )}
      {teamsQuery.data?.length === 0 && !isFormOpen && (
        <EmptyState
          icon="teams"
          title={t('empty.teams.title')}
          description={t('empty.teams.desc')}
          action={{ label: t('empty.teams.action'), onClick: () => setIsFormOpen(true) }}
        />
      )}

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface empty:hidden">
        {teamsQuery.data?.map((team) => {
          const isExpanded = expandedTeamId === team.id
          return (
            <div key={team.id}>
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-well"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-well text-sm font-extrabold text-fg-muted"
                >
                  {team.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-fg">{team.name}</span>
                  {team.description && <span className="block truncate text-sm text-fg-muted">{team.description}</span>}
                </span>
                <span className="shrink-0 text-sm font-semibold text-fg-muted">
                  {t(team.member_count === 1 ? 'teams.memberOne' : 'teams.memberMany', { count: team.member_count })}
                </span>
                <Icon name="chevronDown" className={`shrink-0 text-fg-muted transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && (
                <div className="px-5 pb-4">
                  <TeamMembers teamId={team.id} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
