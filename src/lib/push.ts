import { apiClient } from '../api/client'

// The service worker (public/sw.js) makes DevTrack installable and receives Web Push. It is registered
// in production builds only, so development never serves stale files from its cache.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export interface PushStatus {
  enabled: boolean
  public_key: string
  subscriptions: number
}

export async function getPushStatus(): Promise<PushStatus> {
  const { data } = await apiClient.get<PushStatus>('/notifications/push/')
  return data
}

function keyBytes(base64url: string) {
  const padded = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ?? navigator.serviceWorker.register('/sw.js')
}

// Is this browser subscribed right now?
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  return reg ? reg.pushManager.getSubscription() : null
}

export async function subscribePush(publicKey: string, lang: string): Promise<'granted' | 'denied'> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'
  const reg = await registration()
  await navigator.serviceWorker.ready
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }))
  await apiClient.post('/notifications/push/subscribe/', { ...subscription.toJSON(), lang })
  return 'granted'
}

export async function unsubscribePush() {
  const subscription = await currentSubscription()
  if (!subscription) return
  await apiClient.post('/notifications/push/unsubscribe/', { endpoint: subscription.endpoint })
  await subscription.unsubscribe()
}
