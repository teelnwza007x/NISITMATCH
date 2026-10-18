self.addEventListener('push', event => {
  let data = {}; try { data = event.data?.json() || {} } catch {}
  const title = data.title || 'Nisit Match 💗'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || 'มีเรื่องราวใหม่รอคุณอยู่',
    icon: '/nisit-match-logo.png', badge: '/nisit-match-logo.png',
    tag: data.tag || 'nisit-match', data: { url: '/' }
  }))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus()
    return clients.openWindow('/')
  }))
})
