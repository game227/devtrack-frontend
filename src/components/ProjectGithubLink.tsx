import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProjectGithubLink,
  linkProjectGithubRepo,
  listAvailableGithubRepos,
  unlinkProjectGithubRepo,
} from '../api/integrations'
import { extractFieldErrors } from '../features/auth/errors'

export function ProjectGithubLink({ projectId }: { projectId: number }) {
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
      if (!repo) throw new Error('Select a repository first.')
      return linkProjectGithubRepo(projectId, { github_repo_id: repo.id, full_name: repo.full_name })
    },
    onSuccess: () => {
      setError(null)
      invalidate()
    },
    onError: (err) => setError(extractFieldErrors(err).non_field_errors?.join(' ') ?? 'Something went wrong.'),
  })

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkProjectGithubRepo(projectId),
    onSuccess: invalidate,
  })

  if (linkQuery.isLoading) {
    return <p className="text-sm text-fg-muted">Loading GitHub link…</p>
  }

  const link = linkQuery.data

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-fg">GitHub</h2>
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

      {link?.linked ? (
        <div className="flex max-w-md items-center justify-between rounded border border-border bg-bg-elevated px-3 py-2 text-sm">
          <a
            href={`https://github.com/${link.full_name}`}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            {link.full_name}
          </a>
          <button
            type="button"
            onClick={() => unlinkMutation.mutate()}
            disabled={unlinkMutation.isPending}
            className="text-xs text-fg-muted transition-colors duration-150 hover:text-red-400"
          >
            Unlink
          </button>
        </div>
      ) : reposQuery.isError ? (
        <p className="text-sm text-fg-muted">
          {extractFieldErrors(reposQuery.error).non_field_errors?.join(' ')}{' '}
          <Link to="/settings" className="text-accent hover:underline">
            Go to Settings
          </Link>
        </p>
      ) : (
        <div className="flex max-w-md items-end gap-2">
          <select
            className="flex-1 rounded border border-border bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-fg"
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
          >
            <option value="">Select a repository…</option>
            {reposQuery.data?.map((repo) => (
              <option key={repo.id} value={repo.full_name}>
                {repo.full_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => linkMutation.mutate()}
            disabled={linkMutation.isPending || !selectedRepo}
            className="rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            Link
          </button>
        </div>
      )}
    </div>
  )
}
