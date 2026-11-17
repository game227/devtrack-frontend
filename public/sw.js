/* DevTrack service worker: an installable app shell and Web Push.
 *
 * Only the app's own static files are cached. API responses (private data) are never touched: they go
 * straight to the network, as do all cross-origin requests. Pages are fetched from the network first;
 * the cached shell is only a fallback when offline. */
const SHELL = 'devtrack-shell-v1'
const ASSETS = 'devtrack-assets-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(['/index.html', '/favicon.svg', '/icon-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL && key !== ASSETS).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html', { cacheName: SHELL }).then((cached) => cached || Response.error())),
    )
    return
  }
  // Vite's build files carry a content hash in their name, so a cached copy is always the right one.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSETS).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone())
              return response
            }),
        ),
      ),
    )
  }
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'DevTrack', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'DevTrack', {
      body: data.body || '',
      tag: data.tag,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/dashboard' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data && event.notification.data.url ? event.notification.data.url : '/dashboard', self.location.origin)
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === target.origin)
      if (open) return open.focus().then(() => open.navigate(target.href))
      return self.clients.openWindow(target.href)
    }),
  )
})
