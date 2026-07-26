/**
 * Service worker de Julian App.
 *
 * Estrategia deliberadamente conservadora:
 *
 *  - Navegación (abrir la app): red primero, caché de respaldo. Así Julián
 *    siempre recibe la última versión si tiene señal, y sigue entrando si no.
 *  - Recursos estáticos (JS, CSS, iconos, fuentes): caché primero. Ya vienen con
 *    un hash en el nombre, así que si el contenido cambia, cambia la URL.
 *
 * No se cachea nada de Firestore: los datos los maneja la propia app.
 */

const VERSION = 'v1'
const SHELL = `julian-shell-${VERSION}`
const ASSETS = `julian-assets-${VERSION}`

const PRECACHE = ['/', '/index.html', '/manifest.json', '/icon.svg', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      // addAll falla entero si un solo recurso falla; se toleran los ausentes.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Firebase y cualquier API: siempre a la red, nunca cacheado.
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com')) {
    if (url.hostname !== 'fonts.googleapis.com' && url.hostname !== 'fonts.gstatic.com') return
  }

  // Navegación: red primero.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html').then((cached) => cached ?? Response.error())),
    )
    return
  }

  // Recursos: caché primero.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        // Las respuestas opacas (CDN de fuentes) no se pueden inspeccionar;
        // se guardan igual porque son las fuentes y no cambian.
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone()
          caches.open(ASSETS).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
