import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  disconnectGithub,
  getGithubAuthorizeUrl,
  getGithubConnectionStatus,
} from '../api/integrations'

export function SettingsPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-fg">Settings</h1>
      <GithubConnectionCard />
    </div>
  )
}

function GithubConnectionCard() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const connectionQuery = useQuery({
    queryKey: ['github-connection'],
    queryFn: getGithubConnectionStatus,
  })

  // The OAuth callback is handled entirely by the backend, which 302s back
  // here with ?github=connected or ?github_error=... — this just surfaces
  // that one-time result, then strips the params so a refresh doesn't re-show it.
  useEffect(() => {
    const connected = searchParams.get('github')
    const error = searchParams.get('github_error')
    if (connected === 'connected') {
      setBanner({ kind: 'success', text: 'GitHub account connected.' })
      void queryClient.invalidateQueries({ queryKey: ['github-connection'] })
    } else if (error) {
      setBanner({ kind: 'error', text: `Couldn't connect GitHub: ${error.replace(/_/g, ' ')}` })
    }
    if (connected || error) {
      setSearchParams((params) => {
        params.delete('github')
        params.delete('github_error')
        return params
      }, { replace: true })
    }
    // Only run once on mount — this reads the redirect result, not live state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connectMutation = useMutation({
    mutationFn: getGithubAuthorizeUrl,
    onSuccess: ({ authorize_url }) => {
      // Full browser navigation, not apiClient — GitHub's consent page can't be fetched via XHR.
      window.location.href = authorize_url
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: disconnectGithub,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['github-connection'] }),
  })

  return (
    <div className="rounded border border-border bg-bg-elevated p-5">
      <h2 className="mb-3 text-sm font-semibold text-fg">GitHub</h2>

      {banner && (
        <p className={`mb-3 text-sm ${banner.kind === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>
          {banner.text}
        </p>
      )}

      {connectionQuery.isLoading && <p className="text-sm text-fg-muted">Loading…</p>}

      {connectionQuery.data && !connectionQuery.data.connected && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-fg-muted">Connect your GitHub account to link repositories to projects.</p>
          <button
            type="button"
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="shrink-0 rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            Connect GitHub
          </button>
        </div>
      )}

      {connectionQuery.data?.connected && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-fg">
            Connected as <span className="font-medium">{connectionQuery.data.github_username}</span>
          </p>
          <button
            type="button"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="shrink-0 rounded border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
