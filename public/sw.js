/**
 * Service worker de Julian App.
 *
 * ACTUALIZACIÓN AUTOMÁTICA — cómo funciona, porque es la parte delicada:
 *
 *  1. `VERSION` se sella en cada compilación (ver el plugin de vite.config.ts).
 *     Si el contenido de la app cambió, este archivo cambia → el navegador
 *     detecta un service worker distinto byte a byte y lo instala.
 *  2. `skipWaiting()` hace que el nuevo tome el control sin esperar a que se
 *     cierren todas las pestañas. Sin esto, el service worker nuevo se queda
 *     "esperando" para siempre y la app se queda vieja hasta reinstalarla —
 *     que es justo el problema que se quería resolver.
 *  3. `clients.claim()` le pasa el control de las páginas ya abiertas.
 *  4. Eso dispara `controllerchange` en la página, y `src/lib/pwa.ts` recarga.
 *
 * Estrategia de caché:
 *  - Navegación: red primero, caché de respaldo. Con señal siempre se recibe la
 *    última versión; sin señal, la app abre igual.
 *  - Recursos (JS, CSS, fuentes, iconos): caché primero. Vite les pone un hash
 *    en el nombre, así que si el contenido cambia, cambia la URL.
 *
 * Nada de Firestore se cachea aquí: de los datos se encarga la propia app.
 */

const VERSION = '__BUILD_ID__'
const SHELL = `julian-shell-${VERSION}`
const ASSETS = `julian-assets-${VERSION}`

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
        // Fuera las cachés de versiones anteriores, o crecerían sin límite.
        Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// Permite forzar la actualización desde la página sin esperar nada.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Firebase y las APIs de Google: siempre a la red. Cachear respuestas de
  // autenticación o de Firestore daría datos viejos o sesiones fantasma.
  const isGoogleApi =
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com')
  if (isGoogleApi) return

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
        if (response.ok) {
          const copy = response.clone()
          caches.open(ASSETS).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
