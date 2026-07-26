import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Root } from './Root'
import { AuthProvider } from './firebase/AuthProvider'
import { ErrorBoundary } from './components/ErrorBoundary'

// Fuentes auto-alojadas, no traídas de un CDN. Es una PWA que tiene que
// funcionar sin señal: depender de fonts.googleapis.com significaría que la
// primera carga con datos malos se queda esperando, y que Google ve cada
// apertura de la app.
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'

import './styles/global.css'
import './styles/ui.css'

// El service worker solo en producción: en desarrollo se queda sirviendo
// versiones cacheadas y uno cree que el código no se está actualizando.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('No se pudo registrar el service worker:', err)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
