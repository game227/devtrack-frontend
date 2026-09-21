import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGithubConnectionStatus, importGithubRepo, listAvailableGithubRepos } from '../api/integrations'
import { describeError } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { formInputClass } from './FormField'

// Turn a GitHub repository into a DevTrack project (linking it and optionally importing its issues).
export function ImportFromGithub({ workspaceId }: { workspaceId: number }) {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState('')
  const [importIssues, setImportIssues] = useState(true)

  const connectionQuery = useQuery({ queryKey: ['github-connection'], queryFn: getGithubConnectionStatus })
  const connected = connectionQuery.data?.connected === true

  const reposQuery = useQuery({
    queryKey: ['github-available-repos'],
    queryFn: listAvailableGithubRepos,
    enabled: connected,
  })

  const importMutation = useMutation({
    mutationFn: () => {
      const repo = reposQuery.data?.find((r) => r.full_name === selected)
      if (!repo) throw new Error('no repository selected')
      return importGithubRepo({
        workspace: workspaceId,
        github_repo_id: repo.id,
        full_name: repo.full_name,
        import_issues: importIssues,
      })
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate(`/projects/${result.project.id}`)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (selected) importMutation.mutate()
  }

  return (
    <div className="mb-6 max-w-md rounded border border-border bg-bg-elevated p-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-fg">
        <Icon name="github" />
        {t('github.import.title')}
      </h2>
      <p className="mb-3 text-sm text-fg-muted">{t('github.import.help')}</p>

      {connectionQuery.isLoading && <p className="text-sm text-fg-muted">{t('common.loading')}</p>}

      {connectionQuery.isSuccess && !connected && (
        <p className="text-sm text-fg-muted">
          {t('github.import.needConnect')}{' '}
          <Link to="/settings" className="text-accent hover:underline">
            {t('github.import.goSettings')}
          </Link>
        </p>
      )}

      {connected && (
        <form onSubmit={handleSubmit}>
          {reposQuery.isLoading && <p className="text-sm text-fg-muted">{t('common.loading')}</p>}
          {reposQuery.isError && (
            <p role="alert" className="mb-2 text-sm text-danger">
              {describeError(reposQuery.error, lang)}
            </p>
          )}
          {reposQuery.data?.length === 0 && <p className="text-sm text-fg-muted">{t('github.import.noRepos')}</p>}
          {reposQuery.data && reposQuery.data.length > 0 && (
            <>
              <select
                aria-label={t('github.import.select')}
                className={formInputClass}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">{t('github.import.select')}</option>
                {reposQuery.data.map((repo) => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.full_name}
                  </option>
                ))}
              </select>
              <label className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
                <input type="checkbox" checked={importIssues} onChange={(e) => setImportIssues(e.target.checked)} />
                {t('github.import.issues')}
              </label>
              {importMutation.isError && (
                <p role="alert" className="mt-3 text-sm text-danger">
                  {describeError(importMutation.error, lang)}
                </p>
              )}
              <button
                type="submit"
                disabled={!selected || importMutation.isPending}
                className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {importMutation.isPending ? t('github.import.submitting') : t('github.import.submit')}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  )
}
