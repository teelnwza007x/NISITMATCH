self.addEventListener('push', event => {
  let data = {}

  try {
    data = event.data?.json() || {}
  } catch {}

  const title = data.title || 'Nisit Match 💗'
  const body = data.body || 'คุณมีข้อความใหม่ 💌'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: data.tag || 'nisit-match',
      data: {
        url: data.url || '/'
      }
    })
  )
})


self.addEventListener('notificationclick', event => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(async list => {
      for (const client of list) {
        if ('focus' in client) {
          await client.focus()
          return
        }
      }

      return clients.openWindow(url)
    })
  )
})
