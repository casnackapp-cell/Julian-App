/**
 * Registro del service worker y actualización automática.
 *
 * El objetivo: Julián nunca tiene que desinstalar y reinstalar la app. Si se
 * publica un cambio, la próxima vez que la abra ya está actualizada.
 *
 * Cómo funciona:
 *
 *  - `updateViaCache: 'none'` obliga a pedir el `sw.js` a la red y no a la caché
 *    del navegador. Sin esto se podría quedar hasta 24 horas con el viejo.
 *  - Se comprueba si hay versión nueva al cargar y **cada vez que la app vuelve
 *    al frente**. Esto último es lo que más importa en un celular: la PWA no se
 *    cierra, se queda en segundo plano, así que sin ese chequeo podría pasar
 *    días sin enterarse.
 *  - La navegación va a la red primero (ver `public/sw.js`), así que al abrir la
 *    app se recibe el HTML nuevo y con él los archivos nuevos.
 *
 * NO se fuerza la recarga de una pestaña abierta, y el service worker tampoco
 * usa `skipWaiting()`. Que una versión nueva tome el control a mitad de sesión
 * rompe el ingreso con Firebase en iOS (interrumpe el regreso de
 * `signInWithRedirect` y deja al usuario dando vueltas en la pantalla de
 * entrada). La versión nueva entra sola al cerrar y volver a abrir, que es
 * justo el comportamiento que se busca.
 */

/** Cada cuánto se vuelve a preguntar por una versión nueva con la app abierta. */
const CHECK_INTERVAL = 60 * 60 * 1000 // 1 hora

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  // En desarrollo el service worker sirve versiones cacheadas y uno cree que el
  // código no se está actualizando. Solo en producción.
  if (!import.meta.env.PROD) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        const check = () => {
          registration.update().catch(() => {
            // Sin conexión no se puede comprobar. Se reintenta a la próxima.
          })
        }

        check()

        // Al volver al frente: es el momento en que Julián abre la app.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check()
        })
        window.addEventListener('online', check)
        window.setInterval(check, CHECK_INTERVAL)
      })
      .catch((err) => {
        // Que falle el service worker no debe tumbar la app: solo se pierde el
        // funcionamiento sin conexión.
        console.warn('No se pudo registrar el service worker:', err)
      })
  })
}
