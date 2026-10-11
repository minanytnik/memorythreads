// Service Worker для Мемори Тредс
// Кэширует файлы, чтобы игра работала офлайн

const CACHE_NAME = 'memory-threads-v1';

// Файлы, которые кэшируем сразу
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/images/logo.jpg',
    '/images/icon-192.png',
    '/images/icon-512.png',
    '/images/cat1.gif',
    '/images/cat2.gif',
    '/images/cat3.gif',
    '/images/cat4.gif',
    '/images/cat5.gif',
    '/images/cat6.gif',
    '/images/cat7.gif',
    '/images/cat8.gif',
    '/images/cat9.gif',
    '/images/cat10.gif',
    '/images/cat11.gif',
    '/images/cat12.gif',
    '/images/cat13.gif',
    '/images/cat14.gif',
    '/images/cat15.gif',
    '/images/cat16.gif',
    '/images/cat17.gif',
    '/images/cat18.gif',
    '/images/cat19.gif',
    '/images/cat20.gif',
    '/images/cat21.gif',
    '/images/cat22.gif',
    '/images/cat23.gif',
    '/images/cat24.gif',
    '/images/cat25.gif',
    '/images/cat26.gif',
    '/images/cat27.gif'
];

// Установка — кэшируем основные файлы
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Кэшируем файлы по одному — если один не загрузится, остальные всё равно закэшируются
            return Promise.all(
                FILES_TO_CACHE.map((url) => {
                    return cache.add(url).catch((err) => {
                        console.log('Не удалось закэшировать:', url, err);
                    });
                })
            );
        })
    );
    self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Перехват запросов — сначала ищем в кэше, потом в сети
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});