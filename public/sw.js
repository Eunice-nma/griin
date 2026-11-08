// Griin service worker: only shows reminders. It caches nothing, so updates always show up straight away.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data.json() } catch { d = { body: e.data ? e.data.text() : '' } }
  e.waitUntil(
    self.registration.showNotification(d.title || 'Griin', {
      body: d.body || '',
      icon: '/griin-192.png',
      badge: '/griin-192.png',
      tag: d.tag || undefined,
      data: { url: d.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) if ('focus' in w) return w.focus()
      return self.clients.openWindow(e.notification.data.url || '/')
    })
  )
})
