import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
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
    refetchInterval: 30000,
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
        aria-label={t('notifications.title')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex rounded-md border border-border p-1.5 transition-colors duration-150 hover:text-fg"
      >
        <Icon name="bell" size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-bg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 max-h-96 w-80 max-w-[calc(100vw-2rem)] origin-top-right animate-scale-in overflow-y-auto rounded-md border border-border bg-bg-elevated">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold uppercase text-fg-muted">{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-accent hover:underline disabled:opacity-50"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          {notificationsQuery.isLoading && <p className="px-3 py-3 text-sm text-fg-muted">{t('common.loading')}</p>}
          {notificationsQuery.isSuccess && notifications.length === 0 && (
            <p className="px-3 py-3 text-sm text-fg-muted">{t('notifications.empty')}</p>
          )}
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleClick(notification)}
              className={`block w-full border-b border-border px-3 py-2 text-left text-sm transition-colors duration-150 last:border-b-0 hover:bg-bg ${
                notification.is_read ? 'text-fg-muted' : 'text-fg'
              }`}
            >
              <div>{notificationText(notification)}</div>
              <div className="mt-0.5 text-xs text-fg-muted">{formatDateTime(notification.created_at)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
