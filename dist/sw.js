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
  const url = event.notification.data?.url || '/'\n  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.navigate(url).then(() => c.focus())
    return clients.openWindow(url)
  }))
})
