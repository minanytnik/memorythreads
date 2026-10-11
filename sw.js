// Service Worker для Мемори Тредс
// Кэширует файлы, чтобы игра работала офлайн

const CACHE_NAME = 'memory-threads-v2';

// Файлы, которые кэшируем сразу
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/logo.jpg',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/1.jpg',
  '/images/2.jpg',
  '/images/3.jpg',
  '/images/4.jpg',
  '/images/5.jpg',
  '/images/6.jpg',
  '/images/7.jpg',
  '/images/8.jpg',
  '/images/9.jpg',
  '/images/10.jpg',
  '/images/11.jpg',
  '/images/12.jpg',
  '/images/13.jpg',
  '/images/14.jpg',
  '/images/15.jpg',
  '/images/16.jpg',
  '/images/17.jpg',
  '/images/18.jpg',
  '/images/19.jpg',
  '/images/20.jpg',
  '/images/21.jpg',
  '/images/22.jpg',
  '/images/23.jpg',
  '/images/24.jpg',
  '/images/25.jpg',
  '/images/26.jpg',
  '/images/27.jpg',
  '/images/28.jpg',
  '/images/29.jpg',
  '/images/30.jpg',
  '/images/31.jpg',
  '/images/32.jpg',
  '/images/33.jpg',
  '/images/34.jpg',
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

// Установка — кэшируем файлы по одному
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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