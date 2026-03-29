// IPPB Service Worker — offline caching
const CACHE_NAME = 'ippb-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/services.html',
  '/about.html',
  '/faq.html',
  '/contact.html',
  '/css/reset.css',
  '/css/variables.css',
  '/css/typography.css',
  '/css/components.css',
  '/css/navbar.css',
  '/css/footer.css',
  '/css/home.css',
  '/css/animations.css',
  '/css/accessibility.css',
  '/css/responsive.css',
  '/assets/logo.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests for same-origin static assets
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firestore') || e.request.url.includes('firebase')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && e.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (e.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
