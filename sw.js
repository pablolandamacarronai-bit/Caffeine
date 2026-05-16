const CACHE = 'training-tracker-v3';
const SHELL = ['/Caffeine/', '/Caffeine/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // CDN requests: network first, no cache fallback needed
  if (url.hostname !== self.location.hostname) {
    e.respondWith(fetch(e.request));
    return;
  }
  // App shell: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fresh = fetch(e.request).then(res => {
          cache.put(e.request, res.clone());
          return res;
        });
        return cached || fresh;
      })
    )
  );
});
