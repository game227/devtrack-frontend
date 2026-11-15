import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { iconButton } from './ui'
import type { AppNotification } from '../types/notification'

function notificationLink(notification: AppNotification): string | null {
  if (notification.target_type === 'issue') return `/issues/${notification.target_id}`
  if (notification.target_type === 'project') return `/projects/${notification.target_id}`
  return null
}

export function NotificationsMenu() {
  const { t, formatDateTime } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    // No polling of its own: the layout's live updates mark it stale when something new arrives.
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const notifications = notificationsQuery.data ?? []
  const unreadCount = notifications.filter((n) => !n.is_read).length
  // The bell rings once whenever the unread count goes up (not on the first load).
  const seenUnread = useRef<number | null>(null)
  const [ringKey, setRingKey] = useState(0)
  useEffect(() => {
    if (!notificationsQuery.isSuccess) return
    if (seenUnread.current !== null && unreadCount > seenUnread.current) setRingKey((k) => k + 1)
    seenUnread.current = unreadCount
  }, [unreadCount, notificationsQuery.isSuccess])

  function notificationText(notification: AppNotification): string {
    const key = `notifications.${notification.verb}`
    const text = t(key, { target: notification.target_display })
    // Unknown verbs from a newer backend fall back to the raw verb instead of a translation key.
    return text === key ? notification.verb : text
  }

  function handleClick(notification: AppNotification) {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id)
    }
    const href = notificationLink(notification)
    if (href) {
      navigate(href)
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        // The visible text is the unread count, so the accessible name has to contain it (WCAG 2.5.3).
        aria-label={
          unreadCount > 0 ? `${t('notifications.title')}, ${unreadCount > 9 ? '9+' : unreadCount}` : t('notifications.title')
        }
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`relative ${iconButton()}`}
      >
        <Icon key={ringKey} name="bell" size={18} className={ringKey ? 'origin-top animate-ring' : undefined} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-bg ring-2 ring-bg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 max-h-[28rem] w-96 max-w-[calc(100vw-1.5rem)] origin-top-right animate-scale-in overflow-y-auto rounded-xl border border-border bg-surface shadow-float max-sm:-right-12">
          <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <h2 className="text-sm font-bold text-fg">{t('notifications.title')}</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          {notificationsQuery.isLoading && <p className="px-4 py-4 text-sm text-fg-muted">{t('common.loading')}</p>}
          {notificationsQuery.isSuccess && notifications.length === 0 && (
            <p className="px-4 py-6 text-sm text-fg-muted">{t('notifications.empty')}</p>
          )}
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleClick(notification)}
              className={`flex w-full gap-3 border-b border-border px-4 py-3 text-left text-sm transition-colors duration-150 last:border-b-0 hover:bg-well ${
                notification.is_read ? 'text-fg-muted' : 'text-fg'
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-transparent' : 'bg-brand'}`}
              />
              <span className="min-w-0">
                <span className={`block ${notification.is_read ? '' : 'font-semibold'}`}>{notificationText(notification)}</span>
                <span className="mt-0.5 block text-xs text-fg-muted">{formatDateTime(notification.created_at)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
