/**
 * Conexión con Firebase.
 *
 * Las credenciales vienen de variables de entorno (`.env`), no del código.
 * En Firebase Web estas claves son públicas por diseño — la seguridad real está
 * en las reglas de Firestore — pero tenerlas fuera del fuente permite cambiar de
 * proyecto sin tocar código, que es justo lo que hace falta para reutilizar la
 * app con otro cliente.
 *
 * Si faltan las variables, la app no revienta: arranca con el proveedor local.
 * Eso deja el proyecto funcionando en desarrollo y para quien la reutilice sin
 * querer nube.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** `true` cuando hay credenciales suficientes para hablar con Firebase. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

if (isFirebaseConfigured) {
  app = initializeApp(config)
  authInstance = getAuth(app)

  /**
   * Caché local persistente.
   *
   * Es lo que hace que la app funcione sin señal: Firestore guarda los datos en
   * IndexedDB, sirve las lecturas desde ahí y encola las escrituras hasta que
   * vuelva la conexión. Julián puede registrar un gasto en el bus y sincroniza solo.
   *
   * Una sola pestaña: es una app de celular instalada, no un panel con varias
   * ventanas abiertas, y el gestor multipestaña añade complejidad sin beneficio.
   */
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
  })
}

export const auth = authInstance
export const db = dbInstance
