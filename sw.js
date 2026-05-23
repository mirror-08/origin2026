const CACHE_NAME = 'origin2026-v3';
const BASE = '/origin2026';

// ???쒖옉 ??罹먯떆???뚯씪??const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

// install: 湲곕낯 ?뚯씪 罹먯떆
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// activate: 援?罹먯떆 ?뺣━
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: ?ㅽ듃?뚰겕 ?곗꽑, ?ㅽ뙣 ??罹먯떆
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // schedule.json ???ㅽ듃?뚰겕 ?곗꽑 (理쒖떊 ?ㅼ?以?, ?ㅽ뙣 ??罹먯떆
  if (url.pathname.endsWith('schedule.json') || url.pathname.endsWith('events.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ?섎㉧吏 ??罹먯떆 ?곗꽑, ?놁쑝硫??ㅽ듃?뚰겕
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
