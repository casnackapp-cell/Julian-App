import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    rollupOptions: {
      output: {
        // Separar los pesos grandes: React y la librería de animación cambian
        // poco, así que el navegador los reutiliza entre despliegues en vez de
        // volver a bajarlos con cada cambio de la app.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
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
