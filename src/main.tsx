import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { AppProvider } from './store/store'
import { ErrorBoundary } from './components/ErrorBoundary'
import { createLocalProvider } from './data/localProvider'

import './styles/global.css'
import './styles/ui.css'

/**
 * Proveedor de datos.
 *
 * Hoy es el local (funciona sin cuenta y sin señal). Cuando Firebase esté
 * conectado, aquí se elegirá el de Firestore si hay sesión iniciada — y no hay
 * que tocar ni una pantalla, porque todas hablan con la misma interfaz.
 */
const dataProvider = createLocalProvider()

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
      <AppProvider dataProvider={dataProvider}>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
)
