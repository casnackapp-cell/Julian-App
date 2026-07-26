/**
 * Registro del service worker y actualización automática.
 *
 * El objetivo: Julián nunca tiene que desinstalar y reinstalar la app. Si se
 * publica un cambio, la próxima vez que la abra ya está actualizada.
 *
 * Cómo se consigue:
 *
 *  - Al arrancar y **cada vez que la app vuelve al frente** se le pide al
 *    navegador que compruebe si hay una versión nueva. Esto último es lo que
 *    más importa en un celular: la PWA no se cierra, se queda en segundo plano,
 *    así que sin este chequeo podría pasar días sin enterarse de nada.
 *  - Cuando el service worker nuevo toma el control, se recarga la página.
 *
 * La recarga solo ocurre si ya había una versión anterior corriendo. En la
 * primerísima instalación también cambia el controlador, y recargar ahí sería
 * un parpadeo sin motivo.
 */

/** Cada cuánto se vuelve a preguntar por una versión nueva estando la app abierta. */
const CHECK_INTERVAL = 60 * 60 * 1000 // 1 hora

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  // En desarrollo el service worker sirve versiones cacheadas y uno cree que el
  // código no se está actualizando. Solo en producción.
  if (!import.meta.env.PROD) return

  window.addEventListener('load', () => {
    // Si ya había un controlador, cualquier cambio posterior es una actualización.
    const hadController = Boolean(navigator.serviceWorker.controller)

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        const check = () => {
          registration.update().catch(() => {
            // Sin conexión no se puede comprobar. Se reintenta a la próxima.
          })
        }

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

    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return // primera instalación: no hay nada que recargar
      if (reloading) return // el guardia evita el bucle de recargas
      reloading = true
      window.location.reload()
    })
  })
}
