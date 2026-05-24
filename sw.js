const CACHE_NAME = 'origin2026-v8';
const BASE = '/origin2026';

const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // schedule.json / events.json: 네트워크 우선 + 오프라인 폴백
  if (url.pathname.endsWith('schedule.json') || url.pathname.endsWith('events.json')) {
    const baseUrl = url.origin + url.pathname;
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
            cache.put(baseUrl, response.clone());
          });
          return response;
        })
        .catch(() =>
          caches.match(event.request)
            .then(r => r || caches.match(baseUrl))
        )
    );
    return;
  }

  // HTML 파일: 항상 네트워크 우선 (index.html이 업데이트되면 즉시 반영)
  if (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    url.pathname === BASE
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 나머지 (이미지, manifest 등): 캐시 우선
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
