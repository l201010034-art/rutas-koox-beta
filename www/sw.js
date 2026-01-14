// www/sw.js

const CACHE_VERSION = 'v5.2'; // <-- ¡Subí la versión!
const CACHE_NAME = `rutas-1oox-cache-${CACHE_VERSION}`;

const APP_SHELL_URLS = [
    './',
    'index.html',
    'style.min.css',      // Ahora sí existirá después del build
    'manifest.json',
    'images/favicon.png',
    'images/icon-512.png',
    'js/app.min.js',      // Ahora sí existirá después del build
    'data/paraderos.geojson',
    'data/rutas.geojson',

    // Librerías externas
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/@turf/turf@6/turf.min.js',
    'https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css',
    'https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // CORRECCIÓN CLAVE: Usamos 'includes' para que funcione en Live Server y Celular
    if (requestUrl.pathname.includes('/data/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return fetch(event.request).then((networkResponse) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => cache.match(event.request));
            })
        );
        return;
    }

    // Estrategia Cache First por defecto
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});