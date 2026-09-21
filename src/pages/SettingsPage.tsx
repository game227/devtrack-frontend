import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  disconnectGithub,
  getGithubAuthorizeUrl,
  getGithubConnectionStatus,
} from '../api/integrations'
import { disconnectTelegram, getTelegramConnectionStatus, getTelegramDeepLink } from '../api/telegram'
import { ConfirmButton } from '../components/ConfirmButton'
import { Icon } from '../components/Icon'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useI18n } from '../i18n'

const primaryButton =
  'shrink-0 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100'
const dangerButton =
  'shrink-0 rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-danger hover:text-danger disabled:opacity-50'

function Card({ title, icon, children }: { title: string; icon?: 'github' | 'send' | 'settings'; children: ReactNode }) {
  return (
    <div className="rounded border border-border bg-bg-elevated p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
        {icon && <Icon name={icon} />}
        {title}
      </h2>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { t } = useI18n()
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-fg">{t('settings.title')}</h1>
      <LanguageCard />
      <GithubConnectionCard />
      <TelegramConnectionCard />
    </div>
  )
}

function LanguageCard() {
  const { t } = useI18n()
  return (
    <Card title={t('settings.language')} icon="settings">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">{t('settings.languageHelp')}</p>
        <LanguageSwitcher />
      </div>
    </Card>
  )
}

function GithubConnectionCard() {
  const { t } = useI18n()
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
      setBanner({ kind: 'success', text: t('settings.githubConnected') })
      void queryClient.invalidateQueries({ queryKey: ['github-connection'] })
    } else if (error) {
      const key = `github.error.${error}`
      const known = t(key)
      setBanner({
        kind: 'error',
        text: t('settings.githubConnectFailed', { reason: known === key ? error.replace(/_/g, ' ') : known }),
      })
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
    <Card title={t('github.title')} icon="github">
      {banner && (
        <p role={banner.kind === 'error' ? 'alert' : 'status'} className={`mb-3 text-sm ${banner.kind === 'success' ? 'text-success' : 'text-danger'}`}>
          {banner.text}
        </p>
      )}
      {connectMutation.isError && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {t('settings.connectFailed')}
        </p>
      )}

      {connectionQuery.isLoading && <p className="text-sm text-fg-muted">{t('common.loading')}</p>}

      {connectionQuery.data && !connectionQuery.data.connected && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">{t('settings.githubHelp')}</p>
          <button type="button" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending} className={primaryButton}>
            {t('settings.githubConnect')}
          </button>
        </div>
      )}

      {connectionQuery.data?.connected && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-fg">
            {t('settings.connectedAs')} <span className="font-medium">{connectionQuery.data.github_username}</span>
          </p>
          <ConfirmButton
            onConfirm={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className={dangerButton}
          >
            {t('common.disconnect')}
          </ConfirmButton>
        </div>
      )}
    </Card>
  )
}

function TelegramConnectionCard() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const connectionQuery = useQuery({
    queryKey: ['telegram-connection'],
    queryFn: getTelegramConnectionStatus,
    // No redirect-back exists for Telegram (unlike GitHub's OAuth callback) —
    // the link happens via the bot webhook, so re-check whenever the user
    // returns to this tab after tapping Start in Telegram.
    refetchOnWindowFocus: true,
  })

  const connectMutation = useMutation({
    mutationFn: getTelegramDeepLink,
    onSuccess: ({ deep_link }) => {
      window.open(deep_link, '_blank', 'noopener,noreferrer')
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: disconnectTelegram,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['telegram-connection'] }),
  })

  return (
    <Card title="Telegram" icon="send">
      {connectMutation.isError && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {t('settings.connectFailed')}
        </p>
      )}

      {connectionQuery.isLoading && <p className="text-sm text-fg-muted">{t('common.loading')}</p>}

      {connectionQuery.data && !connectionQuery.data.connected && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">{t('settings.telegramHelp')}</p>
          <button type="button" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending} className={primaryButton}>
            {t('settings.telegramConnect')}
          </button>
        </div>
      )}

      {connectionQuery.data?.connected && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-fg">
            {t('settings.connectedAs')}{' '}
            <span className="font-medium">@{connectionQuery.data.telegram_username || t('settings.telegramUnknown')}</span>
          </p>
          <ConfirmButton
            onConfirm={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className={dangerButton}
          >
            {t('common.disconnect')}
          </ConfirmButton>
        </div>
      )}
    </Card>
  )
}
