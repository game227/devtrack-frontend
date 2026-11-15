import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeMemberRole,
  inviteMember,
  leaveWorkspace,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  removeMember,
  transferOwnership,
  withdrawInvitation,
} from '../api/workspaces'
import { Avatar } from '../components/Avatar'
import { ConfirmButton } from '../components/ConfirmButton'
import { FormField, formInputClass } from '../components/FormField'
import { PageSkeleton } from '../components/Skeleton'
import { useAuth } from '../features/auth/authContext'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { canChangeRoles, canInvite, canInviteAdmins, canLeave, canRemove } from '../features/workspace/memberRules'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useI18n } from '../i18n'
import type { Invitation } from '../types/invitation'
import type { WorkspaceMember, WorkspaceRole } from '../types/workspace'
import { button, pageLead, pageTitle } from '../components/ui'

const INVITATION_DAYS = 14 // backend: workspaces.models.INVITATION_TTL
const buttonClass = button('primary')
const dangerClass = button('danger', 'sm')

function daysLeft(invitation: Invitation): number {
  const age = (Date.now() - new Date(invitation.created_at).getTime()) / 86_400_000
  return Math.max(0, Math.ceil(INVITATION_DAYS - age))
}

export function WorkspaceMembersPage() {
  const { t, lang, formatDate } = useI18n()
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const workspaceId = currentWorkspace?.id
  const me = currentWorkspace?.my_role ?? 'member'

  const [username, setUsername] = useState('')
  const [role, setRole] = useState<Exclude<WorkspaceRole, 'owner'>>('member')
  const [inviteErrors, setInviteErrors] = useState<FieldErrors>({})
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => listWorkspaceMembers(workspaceId!),
    enabled: workspaceId !== undefined,
  })
  const invitationsQuery = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () => listWorkspaceInvitations(workspaceId!),
    enabled: workspaceId !== undefined && canInvite(me),
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
    void queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
    void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
  }
  const failed = (error: unknown) => {
    const errors = extractFieldErrors(error, lang)
    setNotice({ kind: 'error', text: (errors.detail ?? errors.non_field_errors ?? errors.role ?? [t('members.failed')]).join(' ') })
  }

  const invite = useMutation({
    mutationFn: () => inviteMember(workspaceId!, username.trim(), role),
    onSuccess: (invitation) => {
      setNotice({ kind: 'success', text: t('members.invited', { username: invitation.user.username }) })
      setUsername('')
      setInviteErrors({})
      refresh()
    },
    onError: (error) => setInviteErrors(extractFieldErrors(error, lang)),
  })
  const withdraw = useMutation({ mutationFn: (id: number) => withdrawInvitation(workspaceId!, id), onSuccess: refresh, onError: failed })
  const setMemberRole = useMutation({
    mutationFn: ({ userId, next }: { userId: number; next: Exclude<WorkspaceRole, 'owner'> }) => changeMemberRole(workspaceId!, userId, next),
    onSuccess: refresh,
    onError: failed,
  })
  const remove = useMutation({ mutationFn: (userId: number) => removeMember(workspaceId!, userId), onSuccess: refresh, onError: failed })
  const handOver = useMutation({ mutationFn: (userId: number) => transferOwnership(workspaceId!, userId), onSuccess: refresh, onError: failed })
  const leave = useMutation({
    mutationFn: () => leaveWorkspace(workspaceId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      navigate('/dashboard', { replace: true })
    },
    onError: failed,
  })

  if (!currentWorkspace || membersQuery.isLoading) return <PageSkeleton />
  if (membersQuery.isError) return <p className="text-sm text-danger">{t('members.loadFailed')}</p>

  const members = membersQuery.data ?? []
  const invitations = invitationsQuery.data ?? []

  function submitInvite(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    invite.mutate()
  }

  function memberRow(member: WorkspaceMember) {
    const isSelf = member.user.id === user?.id
    const editableRole = canChangeRoles(me) && member.role !== 'owner'
    return (
      <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
        <Avatar name={member.user.username} src={member.user.avatar} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">
            {member.user.username}
            {isSelf && <span className="ml-1.5 text-xs font-normal text-fg-muted">({t('members.you')})</span>}
          </p>
          <p className="text-xs text-fg-muted">{t('members.joined', { date: formatDate(member.joined_at) })}</p>
        </div>
        {editableRole ? (
          <select
            aria-label={t('members.roleFor', { username: member.user.username })}
            value={member.role}
            disabled={setMemberRole.isPending}
            onChange={(e) => setMemberRole.mutate({ userId: member.user.id, next: e.target.value as 'admin' | 'member' })}
            className={`${formInputClass} mt-0! w-auto!`}
          >
            <option value="member">{t('members.role.member')}</option>
            <option value="admin">{t('members.role.admin')}</option>
          </select>
        ) : (
          <span className="inline-flex h-6 items-center rounded-full border border-border px-2.5 text-xs font-semibold text-fg-muted">{t(`members.role.${member.role}`)}</span>
        )}
        {me === 'owner' && !currentWorkspace!.is_personal && !isSelf && (
          <ConfirmButton onConfirm={() => handOver.mutate(member.user.id)} disabled={handOver.isPending} className={button('secondary', 'sm')}>
            {t('members.handOver')}
          </ConfirmButton>
        )}
        {canRemove(me, member.role, isSelf) && (
          <ConfirmButton onConfirm={() => remove.mutate(member.user.id)} disabled={remove.isPending} className={dangerClass}>
            {t('members.remove')}
          </ConfirmButton>
        )}
      </li>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className={pageTitle}>{t('members.title')}</h1>
        <p className={pageLead}>
          {currentWorkspace.name}, {t('members.count', { count: members.length })}
        </p>
      </div>

      {notice && (
        <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${
            notice.kind === 'error' ? 'border-danger/40 bg-danger/10 text-danger' : 'border-success/40 bg-success/10 text-success'
          }`}>
          {notice.text}
        </p>
      )}

      {canInvite(me) && (
        <section aria-labelledby="invite-title" className="rounded-xl border border-edge bg-surface shadow-panel p-5">
          <h2 id="invite-title" className="mb-1 text-base font-bold text-fg">{t('members.inviteTitle')}</h2>
          <p className="mb-4 text-sm text-fg-muted">{t('members.inviteHint', { days: INVITATION_DAYS })}</p>
          <form onSubmit={submitInvite} className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <FormField label={t('members.username')} errors={inviteErrors.username}>
                <input className={formInputClass} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" required />
              </FormField>
            </div>
            <div>
              <FormField label={t('members.roleLabel')} errors={inviteErrors.role}>
                <select className={formInputClass} value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'member')}>
                  <option value="member">{t('members.role.member')}</option>
                  {canInviteAdmins(me) && <option value="admin">{t('members.role.admin')}</option>}
                </select>
              </FormField>
            </div>
            <button type="submit" disabled={invite.isPending || !username.trim()} className={buttonClass}>
              {t('members.invite')}
            </button>
          </form>

          {invitations.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <h3 className="mb-2 text-sm font-bold text-fg">{t('members.pending')}</h3>
              <ul className="space-y-2">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-fg">
                      {invitation.user.username}
                      <span className="ml-2 text-xs text-fg-muted">
                        {t(`members.role.${invitation.role}`)} · {t('members.daysLeft', { days: daysLeft(invitation) })}
                      </span>
                    </span>
                    <ConfirmButton onConfirm={() => withdraw.mutate(invitation.id)} disabled={withdraw.isPending} className={dangerClass}>
                      {t('members.withdraw')}
                    </ConfirmButton>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="members-title" className="rounded-xl border border-edge bg-surface shadow-panel px-5">
        <h2 id="members-title" className="sr-only">{t('members.title')}</h2>
        <ul className="divide-y divide-border">{members.map(memberRow)}</ul>
      </section>

      {canLeave(me) && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-surface shadow-panel p-5">
          <p className="text-sm text-fg-muted">{t('members.leaveHint')}</p>
          <ConfirmButton onConfirm={() => leave.mutate()} disabled={leave.isPending} className={dangerClass}>
            {t('members.leave')}
          </ConfirmButton>
        </section>
      )}
      {me === 'owner' && <p className="text-sm text-fg-muted">{t(currentWorkspace.is_personal ? 'members.personalHint' : 'members.ownerHint')}</p>}
    </div>
  )
}
