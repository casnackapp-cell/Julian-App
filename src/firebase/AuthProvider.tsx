/**
 * Sesión con Google.
 *
 * Dos detalles que en una PWA instalada marcan la diferencia:
 *
 *  - `browserLocalPersistence`: sin esto, la sesión se pierde al cerrar la app y
 *    Julián tendría que entrar con Google cada vez. Inaceptable.
 *  - Ventana emergente con respaldo de redirección: dentro de una PWA instalada
 *    los emergentes se bloquean, así que si falla se cae a la redirección, que
 *    siempre funciona.
 */

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { auth, isFirebaseConfigured } from './config'

type AuthStatus = 'loading' | 'signedIn' | 'signedOut' | 'unavailable'

interface AuthValue {
  user: User | null
  status: AuthStatus
  error: string
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured ? 'loading' : 'unavailable',
  )
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return

    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('No se pudo fijar la persistencia de la sesión:', err)
    })

    // Al volver de una redirección hay que recoger el resultado, o el error se
    // pierde en silencio y el usuario ve la pantalla de entrada otra vez.
    getRedirectResult(auth).catch((err) => {
      console.warn('Fallo al volver de la redirección:', err)
    })

    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u)
        setStatus(u ? 'signedIn' : 'signedOut')
      },
      (err) => {
        console.error('Error de sesión:', err)
        setError('No se pudo verificar tu sesión.')
        setStatus('signedOut')
      },
    )

    return unsub
  }, [])

  const signIn = useCallback(async () => {
    if (!auth) return
    setError('')

    const provider = new GoogleAuthProvider()
    // Que siempre pregunte con qué cuenta: si alguien presta el celular, no
    // entra sin querer con la sesión de Google que ya estaba abierta.
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      const code = (err as { code?: string })?.code ?? ''

      // El usuario cerró la ventana a propósito: no es un error que mostrar.
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        return
      }

      // Emergente bloqueado (típico en la PWA instalada): se reintenta redirigiendo.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, provider)
          return
        } catch (redirectErr) {
          console.error('Fallo también la redirección:', redirectErr)
        }
      }

      console.error('Error al entrar:', err)
      setError('No se pudo entrar. Revisa tu conexión e inténtalo otra vez.')
    }
  }, [])

  const signOutUser = useCallback(async () => {
    if (!auth) return
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Error al salir:', err)
      setError('No se pudo cerrar la sesión.')
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, error, signIn, signOutUser }),
    [user, status, error, signIn, signOutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
