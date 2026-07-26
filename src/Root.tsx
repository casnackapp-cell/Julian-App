/**
 * Decide de dónde salen los datos y monta la app.
 *
 * Tres caminos:
 *
 *  - Sin Firebase configurado → proveedor local, sin entrar con cuenta.
 *    Sirve en desarrollo y para reutilizar la app sin nube.
 *  - Con Firebase pero sin sesión → pantalla de entrada.
 *  - Con sesión → Firestore, que además guarda una copia en el dispositivo y
 *    por eso la app sigue funcionando sin señal.
 *
 * Ninguna pantalla se entera de cuál de los tres es: todas hablan con la misma
 * interfaz `DataProvider`.
 */

import { useMemo } from 'react'

import { App } from './App'
import { AppProvider } from './store/store'
import { createLocalProvider } from './data/localProvider'
import { createFirebaseProvider } from './data/firebaseProvider'
import { db, isFirebaseConfigured } from './firebase/config'
import { useAuth } from './firebase/AuthProvider'
import { Login } from './screens/Login'
import { Splash } from './screens/Splash'

export function Root() {
  const { status, user } = useAuth()

  const provider = useMemo(() => {
    if (user && db) return createFirebaseProvider(db, user.uid)
    return createLocalProvider()
    // El proveedor se rehace solo si cambia el usuario. Recrearlo en cada
    // render obligaría al store a recargar todo una y otra vez.
  }, [user])

  if (!isFirebaseConfigured) {
    return (
      <AppProvider dataProvider={provider}>
        <App />
      </AppProvider>
    )
  }

  if (status === 'loading') return <Splash />
  if (status === 'signedOut') return <Login />

  return (
    <AppProvider dataProvider={provider}>
      <App />
    </AppProvider>
  )
}
