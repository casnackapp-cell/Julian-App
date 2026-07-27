/**
 * Service worker de Julian App.
 *
 * ACTUALIZACIÓN AUTOMÁTICA — la app se pone al día sola al cerrarla y volverla
 * a abrir, sin desinstalar nada:
 *
 *  1. La navegación va a la RED PRIMERO. Al abrir la app se trae el index.html
 *     fresco, que apunta a los archivos nuevos (llevan hash en el nombre), y
 *     con eso ya está actualizada.
 *  2. `VERSION` se sella en cada compilación (ver el plugin de vite.config.ts).
 *     Si el contenido cambió, este archivo cambia y el navegador instala el
 *     service worker nuevo, que al activarse borra las cachés viejas.
 *
 * SIN `skipWaiting()` y SIN `clients.claim()`, a propósito. Que un service
 * worker nuevo tome el control de una pestaña ya abierta rompe el ingreso con
 * Firebase en iOS: interrumpe el viaje de vuelta de `signInWithRedirect` y deja
 * al usuario dando vueltas en la pantalla de entrada. La versión nueva se queda
 * lista y entra sola la próxima vez que se abre la app.
 *
 * Nada de otros orígenes (Firebase, Google) se intercepta: va directo a la red.
 * Cachear respuestas de autenticación daría sesiones fantasma.
 */

const VERSION = '__BUILD_ID__'
const CACHE = `julian-${VERSION}`

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // allSettled y no addAll: addAll falla entero si un solo recurso falla.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url)))),
  )
  // Aquí NO va skipWaiting() — ver la nota de arriba.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  // Aquí NO va clients.claim() — ver la nota de arriba.
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Otros orígenes (Firebase, Google) van directo a la red, sin tocarlos.
  if (url.origin !== self.location.origin) return

  // Navegación: red primero. Es lo que trae la versión nueva al abrir la app.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached ?? caches.match('/index.html'))
            .then((cached) => cached ?? Response.error()),
        ),
    )
    return
  }

  // Archivos propios: se sirven de la caché al instante y se refrescan detrás.
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          })
          .catch(() => cached)

        return cached ?? network
      }),
    )
  }
})
