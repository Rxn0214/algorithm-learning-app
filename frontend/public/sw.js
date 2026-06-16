// 算法学习助手 Service Worker
// 版本号更新会自动清理旧缓存
const CACHE_VERSION = 'v2'
const CACHE_NAME = 'algorithm-app-' + CACHE_VERSION

// 只缓存静态资源，不缓存 HTML（HTML 始终从网络获取）
const urlsToCache = []

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 不预缓存任何页面，避免旧版 HTML 导致空白
      return Promise.resolve()
    })
  )
})

self.addEventListener('fetch', event => {
  // 对 HTML 请求使用 network-first 策略
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(r => r || new Response('离线中，请连接网络后重试'))
      })
    )
    return
  }

  // 对 JS/CSS/图片等静态资源使用 cache-first 策略
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        // 只缓存成功的 GET 响应
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    ))
  )
  // 立即接管所有页面
  event.waitUntil(clients.claim())
})
