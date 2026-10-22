self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data = {}
    try { data = event.data?.json() || {} } catch {}
    // Suppress OS notifications while any NISIT MATCH window is actively visible.
    // Background and closed-app notifications continue as before.
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    if (windows.some(client => client.visibilityState === 'visible' && client.focused)) return
    const title = data.title || 'Nisit Match 💗'
    await self.registration.showNotification(title, {
      body: data.body || 'มีเรื่องราวใหม่รอคุณอยู่',
      icon: '/nisit-match-logo.png',
      badge: '/nisit-match-logo.png',
      tag: data.tag || 'nisit-match',
      data: { url: typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/' }
    })
  })())
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.navigate(url).then(() => c.focus())
    return clients.openWindow(url)
  }))
})

// Cache only the public offline fallback. Never cache authenticated API responses or chats.
const OFFLINE_CACHE = 'nisit-match-offline-v1'
self.addEventListener('install', event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.add('/offline.html')))
  self.skipWaiting()
})
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('nisit-match-offline-') && key !== OFFLINE_CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]))
})
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(OFFLINE_CACHE)
    return (await cache.match('/offline.html')) || Response.error()
  }))
})
