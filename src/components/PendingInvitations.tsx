import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { acceptInvitation, declineInvitation, listMyInvitations } from '../api/invitations'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useT } from '../i18n'

export function PendingInvitations() {
  const t = useT()
  const queryClient = useQueryClient()
  const { selectWorkspace } = useWorkspace()
  const invitationsQuery = useQuery({ queryKey: ['invitations'], queryFn: listMyInvitations })

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: number; accept: boolean; workspaceId: number }) =>
      accept ? acceptInvitation(id) : declineInvitation(id),
    // An invitation can stop being valid while it is on screen (expired, or its sender is no longer an
    // admin); the server then drops it, so reload the list either way.
    onError: () => void queryClient.invalidateQueries({ queryKey: ['invitations'] }),
    onSuccess: async (_data, { accept, workspaceId }) => {
      await queryClient.invalidateQueries({ queryKey: ['invitations'] })
      if (accept) {
        await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        selectWorkspace(workspaceId)
      }
    },
  })

  const invitations = invitationsQuery.data ?? []
  // Keep the section while an error is showing: a stale invitation disappears from the list as soon as
  // it fails, and the user must still be told why.
  if (invitations.length === 0 && !respond.isError) return null

  return (
    <section aria-labelledby="pending-invitations" className="mb-6 rounded-2xl border border-border p-4">
      <h2 id="pending-invitations" className="mb-3 text-sm font-semibold text-fg">
        {t('invitations.title')}
      </h2>
      {respond.isError && (
        <p role="alert" className="mb-2 text-xs text-danger">
          {t('invitations.failed')}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-fg">
              {t('invitations.line', {
                inviter: invitation.invited_by.username,
                workspace: invitation.workspace.name,
                role: t(`invitations.role.${invitation.role}`),
              })}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: invitation.id, accept: true, workspaceId: invitation.workspace.id })}
                className="rounded-md border border-fg bg-fg px-3 py-1 text-xs font-medium text-bg disabled:opacity-50"
              >
                {t('invitations.accept')}
              </button>
              <button
                type="button"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: invitation.id, accept: false, workspaceId: invitation.workspace.id })}
                className="rounded-md border border-border px-3 py-1 text-xs text-fg-muted hover:text-fg disabled:opacity-50"
              >
                {t('invitations.decline')}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
