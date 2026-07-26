import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Sella el service worker con una huella del contenido compilado.
 *
 * Es la pieza que hace que la PWA se actualice sola. El navegador solo instala
 * un service worker nuevo si el archivo cambió byte a byte; como `sw.js` vive en
 * `public/` y se copia tal cual, sin esto sería idéntico en cada despliegue y la
 * app se quedaría congelada en la versión vieja hasta reinstalarla.
 *
 * La huella sale de los nombres de los archivos generados, que Vite calcula a
 * partir del contenido. Si nada cambió, la huella es la misma y no se molesta al
 * usuario con una recarga inútil.
 */
function stampServiceWorker(): Plugin {
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    closeBundle() {
      const outDir = 'dist'
      const swPath = join(outDir, 'sw.js')

      let sw: string
      try {
        sw = readFileSync(swPath, 'utf8')
      } catch {
        this.warn('No se encontró dist/sw.js: la PWA no se actualizará sola.')
        return
      }

      if (!sw.includes('__BUILD_ID__')) {
        this.warn('sw.js no tiene el marcador __BUILD_ID__: revisa public/sw.js.')
        return
      }

      const assets = readdirSync(join(outDir, 'assets')).sort().join('|')
      const html = readFileSync(join(outDir, 'index.html'), 'utf8')
      const buildId = createHash('sha256').update(assets).update(html).digest('hex').slice(0, 12)

      writeFileSync(swPath, sw.replace('__BUILD_ID__', buildId))
      this.info(`Service worker sellado con la versión ${buildId}`)
    },
  }
}

export default defineConfig({
  plugins: [react(), stampServiceWorker()],
  server: { port: 5173, host: true },
  build: {
    rollupOptions: {
      output: {
        // Separar los pesos grandes. React, Firebase y la librería de animación
        // cambian poco, así que el navegador los reutiliza entre despliegues en
        // vez de volver a bajarlos con cada cambio de la app. Firebase es de
        // lejos el más pesado: aislarlo es lo que más ahorra.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(@firebase|firebase|idb)\//.test(id)) return 'firebase'
          if (/node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(id)) {
            return 'react'
          }
          if (/node_modules\/(framer-motion|motion|motion-dom|motion-utils)\//.test(id)) {
            return 'motion'
          }
        },
      },
    },
  },
})
