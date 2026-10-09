/* Chaukas AI service worker - installable + works offline (app shell + cached tiles/assets) */
const VERSION = 'chaukas-v3'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.png', '/brand/logo-mark.png', '/img/pothole-before.jpg', '/img/pothole-after.jpg', '/img/smart-city.jpg', '/img/streetlight-crop.jpg', '/img/water-crop.jpg', '/img/garbage-crop.jpg', '/icons/icon-192.png', '/icons/icon-512.png']
const MAX_RUNTIME = 120

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

async function trim(cache) {
  const keys = await cache.keys()
  if (keys.length > MAX_RUNTIME) await Promise.all(keys.slice(0, keys.length - MAX_RUNTIME).map((k) => cache.delete(k)))
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.pathname.startsWith('/api/')) return // API: always network

  // SPA navigation: network first, fall back to cached shell
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put('/index.html', copy)); return r }).catch(() => caches.match('/index.html')))
    return
  }

  // static assets, fonts, map tiles: stale-while-revalidate
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req)
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()); trim(cache) } return res }).catch(() => hit)
      return hit || net
    })
  )
})
