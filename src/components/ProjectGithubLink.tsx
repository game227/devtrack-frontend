import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProjectGithubLink,
  linkProjectGithubRepo,
  listAvailableGithubRepos,
  syncProjectGithub,
  unlinkProjectGithubRepo,
} from '../api/integrations'
import { describeError } from '../features/auth/errors'
import { ConfirmButton } from './ConfirmButton'
import { useTimeAgo } from '../hooks/useTimeAgo'
import { useI18n } from '../i18n'

export function ProjectGithubLink({ projectId }: { projectId: number }) {
  const { t, lang } = useI18n()
  const timeAgo = useTimeAgo()
  const queryClient = useQueryClient()
  const [selectedRepo, setSelectedRepo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const linkQuery = useQuery({
    queryKey: ['project-github-link', projectId],
    queryFn: () => getProjectGithubLink(projectId),
    enabled: Number.isFinite(projectId),
  })

  const reposQuery = useQuery({
    queryKey: ['github-available-repos'],
    queryFn: listAvailableGithubRepos,
    enabled: linkQuery.data?.linked === false,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['project-github-link', projectId] })
    void queryClient.invalidateQueries({ queryKey: ['project', projectId] })
  }

  const linkMutation = useMutation({
    mutationFn: () => {
      const repo = reposQuery.data?.find((r) => r.full_name === selectedRepo)
      if (!repo) throw new Error(t('github.selectFirst'))
      return linkProjectGithubRepo(projectId, { github_repo_id: repo.id, full_name: repo.full_name })
    },
    onSuccess: () => {
      setError(null)
      invalidate()
    },
    onError: (err) => setError(err instanceof Error && !('response' in err) ? err.message : describeError(err, lang)),
  })

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkProjectGithubRepo(projectId),
    onSuccess: invalidate,
  })

  const syncMutation = useMutation({
    mutationFn: () => syncProjectGithub(projectId),
    onSuccess: () => {
      // New commits / merged pull requests change issues, health and the timeline.
      for (const key of ['issues', 'issue-github-links', 'project-timeline', 'project-health', 'issue']) {
        void queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
  })

  if (linkQuery.isLoading) {
    return <p className="text-sm text-fg-muted">{t('github.loading')}</p>
  }

  const link = linkQuery.data

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-fg">{t('github.title')}</h2>
      {error && (
        <p role="alert" className="mb-2 text-sm text-danger">
          {error}
        </p>
      )}

      {link?.linked ? (
        <div className="max-w-md rounded-2xl border border-border bg-bg-elevated px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <a
              href={`https://github.com/${link.full_name}`}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {link.full_name}
            </a>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-fg transition-colors duration-150 hover:border-fg disabled:opacity-50"
              >
                {syncMutation.isPending ? t('github.syncing') : t('github.sync')}
              </button>
              <ConfirmButton
                onConfirm={() => unlinkMutation.mutate()}
                disabled={unlinkMutation.isPending}
                className="text-xs text-fg-muted transition-colors duration-150 hover:text-danger"
              >
                {t('common.unlink')}
              </ConfirmButton>
            </div>
          </div>
          {link.webhook_installed ? (
            link.last_event_at ? (
              <p className="mt-2 text-xs text-success">{t('github.lastEvent', { when: timeAgo(link.last_event_at) })}</p>
            ) : (
              <p className="mt-2 text-xs text-warning">{t('github.webhookQuiet')}</p>
            )
          ) : (
            <>
              <p className="mt-2 text-xs text-fg-muted">{t('github.noWebhook')}</p>
              <p className="mt-1 text-xs text-fg-muted">
                {link.last_synced_at ? t('github.lastSynced', { when: timeAgo(link.last_synced_at) }) : t('github.neverSynced')}
              </p>
            </>
          )}
          {link.default_branch && (
            <p className="mt-1 text-xs text-fg-muted">{t('github.defaultBranch', { branch: link.default_branch })}</p>
          )}
          <p className="mt-2 border-t border-border pt-2 text-xs text-fg-muted">{t('github.rules')}</p>
          {syncMutation.isSuccess && (
            <p role="status" className="mt-1 text-xs text-fg-muted">
              {t('github.synced', {
                pulls: syncMutation.data.pull_requests,
                commits: syncMutation.data.commits,
                issues: syncMutation.data.issues ?? 0,
              })}
            </p>
          )}
          {syncMutation.isError && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {describeError(syncMutation.error, lang) || t('github.syncFailed')}
            </p>
          )}
        </div>
      ) : reposQuery.isError ? (
        <p className="text-sm text-fg-muted">
          {describeError(reposQuery.error, lang)}{' '}
          <Link to="/settings" className="text-accent hover:underline">
            {t('github.goToSettings')}
          </Link>
        </p>
      ) : (
        <div className="flex max-w-md items-end gap-2">
          <select
            aria-label={t('github.selectRepo')}
            className="flex-1 rounded-md border border-border bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-fg"
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
          >
            <option value="">{t('github.selectRepo')}</option>
            {reposQuery.data?.map((repo) => (
              <option key={repo.id} value={repo.full_name}>
                {repo.full_name}
                {repo.admin ? '' : ` (${t('github.readOnly')})`}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => linkMutation.mutate()}
            disabled={linkMutation.isPending || !selectedRepo}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {t('common.link')}
          </button>
        </div>
      )}
    </div>
  )
}
