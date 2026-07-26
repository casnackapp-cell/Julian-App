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

import { registerServiceWorker } from './lib/pwa'

// Registra el service worker y deja la app actualizándose sola: cuando se
// publica una versión nueva, la siguiente vez que Julián la abre ya está puesta,
// sin desinstalar ni reinstalar nada.
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
