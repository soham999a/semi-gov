// IPPB Service Worker v2
const CACHE = 'ippb-v2';
const STATIC = [
  '/index.html', '/services.html', '/about.html',
  '/faq.html', '/contact.html', '/404.html',
  '/css/reset.css', '/css/variables.css', '/css/typography.css',
  '/css/components.css', '/css/navbar.css', '/css/footer.css',
  '/css/home.css', '/css/animations.css', '/css/accessibility.css',
  '/css/responsive.css', '/assets/logo.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {})
  );
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
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Skip non-http(s) schemes and external services
  if (!url.startsWith('http')) return;
  if (url.includes('firestore') || url.includes('firebase') || url.includes('googleapis')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
