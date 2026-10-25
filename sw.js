// Service Worker для Мемори Тредс
// Стратегия: сначала свежее из сети, при любой осечке — запасная копия из кэша

const CACHE_VERSION = 'memory-threads-v6';

// Что кэшируем сразу при установке (аварийный набор)
const PRECACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/images/logo.jpg',
    '/images/icon-192.png',
    '/images/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            return Promise.all(
                PRECACHE.map((url) =>
                    cache.add(url).catch((err) => console.log('Не закэшировалось:', url, err))
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Чужие домены (Supabase и т.п.) и не-GET не трогаем вовсе
    if (url.origin !== location.origin) return;
    if (event.request.method !== 'GET') return;

    // Сеть в приоритете; упала сеть — отдаём последнюю хорошую копию из кэша
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});