import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeGithubConnection,
  disconnectGithub,
  getGithubAuthorizeUrl,
  getGithubConnectionStatus,
} from '../api/integrations'
import { disconnectTelegram, getTelegramConnectionStatus, getTelegramDeepLink } from '../api/telegram'
import { ConfirmButton } from '../components/ConfirmButton'
import { Icon } from '../components/Icon'
import { ContactList } from '../components/ContactLinks'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useI18n } from '../i18n'
import { button, notice, pageTitle } from '../components/ui'
import { PushCard } from '../components/PushCard'

const primaryButton = button('primary')
const dangerButton = button('danger')

function Card({ title, icon, children }: { title: string; icon?: 'github' | 'send' | 'settings'; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-edge bg-surface shadow-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-fg">
        {icon && <Icon name={icon} size={18} />}
        {title}
      </h2>
      {children}
    </section>
  )
}

function ContactCard() {
  const { t } = useI18n()
  return (
    <Card title={t('contact.title')}>
      <p className="mb-4 text-sm text-fg-muted">{t('contact.settingsHelp')}</p>
      <ContactList />
    </Card>
  )
}

export function SettingsPage() {
  const { t } = useI18n()
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className={pageTitle}>{t('settings.title')}</h1>
      <LanguageCard />
      <GithubConnectionCard />
      <TelegramConnectionCard />
      <PushCard />
      <ContactCard />
    </div>
  )
}

function LanguageCard() {
  const { t } = useI18n()
  return (
    <Card title={t('settings.language')} icon="settings">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">{t('settings.languageHelp')}</p>
        <LanguageSwitcher />
      </div>
    </Card>
  )
}

const GITHUB_NONCE_KEY = 'devtrack_github_nonce'
// Error codes the backend may send back; anything else in the URL is not echoed (a crafted link could
// otherwise put any sentence in this banner).
const GITHUB_ERRORS = new Set([
  'access_denied',
  'authorization_failed',
  'missing_params',
  'invalid_state',
  'connection_failed',
  'account_already_linked',
  'invalid_or_expired',
])

function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function takeNonce(): string {
  try {
    const nonce = sessionStorage.getItem(GITHUB_NONCE_KEY) ?? ''
    sessionStorage.removeItem(GITHUB_NONCE_KEY)
    return nonce
  } catch {
    return ''
  }
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

  const showError = (code: string) =>
    setBanner({
      kind: 'error',
      text: t('settings.githubConnectFailed', {
        reason: t(`github.error.${GITHUB_ERRORS.has(code) ? code : 'authorization_failed'}`),
      }),
    })

  // GitHub sends the browser back through the backend, which parks the authorization and redirects here
  // with ?github_pending=<id> (or ?github_error=<code>). This browser then claims it with the nonce it
  // kept, signed in as the user who started; the params are stripped so a refresh does not repeat it.
  const handled = useRef(false)
  useEffect(() => {
    if (handled.current) return
    handled.current = true
    const pending = searchParams.get('github_pending')
    const error = searchParams.get('github_error')
    if (pending) {
      completeGithubConnection(pending, takeNonce())
        .then(() => {
          setBanner({ kind: 'success', text: t('settings.githubConnected') })
          void queryClient.invalidateQueries({ queryKey: ['github-connection'] })
        })
        .catch((failure: unknown) => {
          const detail = isAxiosError(failure) ? String(failure.response?.data?.detail ?? '') : ''
          showError(detail)
        })
    } else if (error) {
      showError(error)
    }
    if (pending || error) {
      setSearchParams((params) => {
        params.delete('github_pending')
        params.delete('github_error')
        return params
      }, { replace: true })
    }
    // Only run once on mount — this reads the redirect result, not live state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connectMutation = useMutation({
    mutationFn: () => {
      const nonce = newNonce()
      try {
        sessionStorage.setItem(GITHUB_NONCE_KEY, nonce)
      } catch {
        // Without storage the connection cannot be finished; the server will say so.
      }
      return getGithubAuthorizeUrl(nonce)
    },
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
        <p role={banner.kind === 'error' ? 'alert' : 'status'} className={`mb-4 ${banner.kind === 'success' ? notice.success : notice.error}`}>
          {banner.text}
        </p>
      )}
      {connectMutation.isError && (
        <p role="alert" className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {t('settings.connectFailed')}
        </p>
      )}

      {connectionQuery.isLoading && <p className="text-sm text-fg-muted">{t('common.loading')}</p>}

      {connectionQuery.data && !connectionQuery.data.connected && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">{t('settings.githubHelp')}</p>
          <button type="button" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending} className={primaryButton}>
            {t('settings.githubConnect')}
          </button>
        </div>
      )}

      {connectionQuery.data?.connected && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg">
            {t('settings.connectedAs')} <span className="font-semibold">{connectionQuery.data.github_username}</span>
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
        <p role="alert" className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {t('settings.connectFailed')}
        </p>
      )}

      {connectionQuery.isLoading && <p className="text-sm text-fg-muted">{t('common.loading')}</p>}

      {connectionQuery.data && !connectionQuery.data.connected && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">{t('settings.telegramHelp')}</p>
          <button type="button" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending} className={primaryButton}>
            {t('settings.telegramConnect')}
          </button>
        </div>
      )}

      {connectionQuery.data?.connected && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg">
            {t('settings.connectedAs')}{' '}
            <span className="font-semibold">@{connectionQuery.data.telegram_username || t('settings.telegramUnknown')}</span>
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
