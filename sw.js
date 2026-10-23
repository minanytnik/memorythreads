// Service Worker для Мемори Тредс
// Простая стратегия: код всегда свежий, картинки из сети

const CACHE_VERSION = 'memory-threads-v5';

// Кэшируем только HTML и манифест
const CACHE_FILES = [
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            return cache.addAll(CACHE_FILES);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // JS и CSS — всегда из сети (свежий код)
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    // HTML — из сети, но если офлайн — из кэша
    if (url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Картинки и всё остальное — из сети
    event.respondWith(fetch(event.request));
});