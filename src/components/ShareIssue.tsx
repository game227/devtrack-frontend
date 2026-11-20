import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createShareLink, listShareLinks, revokeShareLink } from '../api/issueTools'
import { describeError } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import { button, iconButton } from './ui'

const DAYS = [1, 7, 30] as const

// Links go through the API's preview page (/s/<token>): chat apps such as Telegram read the issue's title
// and a picture of it there, and people are sent straight on to this app's /share/<token>. Without an API
// address the page itself is linked.
function shareUrl(token: string, lang: string) {
  const api = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (api) {
    try {
      return `${new URL(api, window.location.origin).origin}/s/${token}?lang=${lang}`
    } catch {
      // A malformed address: fall back to the page itself.
    }
  }
  return `${window.location.origin}/share/${token}`
}

// "Share" on the issue page: read-only links for people outside the workspace, with an expiry, and
// "Print" for a paper or PDF copy.
export function ShareIssueButtons({ issueId, canShare }: { issueId: number; canShare: boolean }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2 print:hidden">
      <button type="button" onClick={() => window.print()} className={button('ghost', 'sm')}>
        {t('share.print')}
      </button>
      {canShare && (
        <button type="button" onClick={() => setOpen(true)} className={button('secondary', 'sm')}>
          <Icon name="external" className="h-3.5 w-3.5" />
          {t('share.button')}
        </button>
      )}
      {open && <ShareDialog issueId={issueId} onClose={() => setOpen(false)} />}
    </div>
  )
}

function ShareDialog({ issueId, onClose }: { issueId: number; onClose: () => void }) {
  const { t, lang, formatDateTime } = useI18n()
  const queryClient = useQueryClient()
  const key = ['share-links', issueId]
  const links = useQuery({ queryKey: key, queryFn: () => listShareLinks(issueId) })
  const [days, setDays] = useState<(typeof DAYS)[number]>(7)
  const [copied, setCopied] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => createShareLink(issueId, days),
    onSuccess: async (link) => {
      void queryClient.invalidateQueries({ queryKey: key })
      await copy(link.id, link.token)
    },
    onError: (e) => setError(describeError(e, lang)),
  })
  const revoke = useMutation({ mutationFn: revokeShareLink, onSettled: () => void queryClient.invalidateQueries({ queryKey: key }) })

  async function copy(id: number, token: string) {
    try {
      await navigator.clipboard.writeText(shareUrl(token, lang))
      setCopied(id)
    } catch {
      setCopied(null)
    }
  }

  const live = (links.data ?? []).filter((link) => link.live)

  return (
    <Dialog title={t('share.title')} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-fg">{t('share.title')}</h2>
        <button type="button" onClick={onClose} aria-label={t('common.close')} className={iconButton('sm')}>
          <Icon name="close" />
        </button>
      </div>
      <div className="space-y-4 p-5">
        <p className="text-sm text-fg-muted">{t('share.explain')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-fg">{t('share.validFor')}</span>
          {DAYS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={days === value}
              onClick={() => setDays(value)}
              className={`h-8 rounded-full border px-3 text-xs font-semibold ${days === value ? 'border-fg bg-fg text-bg' : 'border-border text-fg-muted hover:text-fg'}`}
            >
              {t(`share.days.${value}`)}
            </button>
          ))}
          <button type="button" onClick={() => create.mutate()} disabled={create.isPending} className={`ml-auto ${button('primary', 'sm')}`}>
            {t('share.create')}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {live.length > 0 && (
          <ul className="divide-y divide-border rounded-xl border border-edge">
            {live.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-xs text-fg">{shareUrl(link.token, lang)}</span>{' '}
                  <span className="block text-xs text-fg-muted">{t('share.until', { date: formatDateTime(link.expires_at) })}</span>
                </span>
                <button type="button" onClick={() => void copy(link.id, link.token)} className={button('ghost', 'sm')}>
                  {copied === link.id ? t('share.copied') : t('share.copy')}
                </button>
                <button type="button" onClick={() => revoke.mutate(link.id)} className={`${button('ghost', 'sm')} text-danger`}>
                  {t('share.revoke')}
                </button>
              </li>
            ))}
          </ul>
        )}
        {links.isSuccess && live.length === 0 && <p className="text-xs text-fg-muted">{t('share.none')}</p>}
      </div>
    </Dialog>
  )
}
