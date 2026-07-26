/**
 * Entrada con Google.
 *
 * Se entra con la cuenta para que los datos queden respaldados en la nube y
 * sobrevivan a un celular perdido — que es el respaldo que se decidió tener.
 */

import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'

import { brand } from '../config/brand'
import { useAuth } from '../firebase/AuthProvider'

export function Login() {
  const { signIn, error } = useAuth()

  return (
    <div className="app">
      <div
        className="screen screen--plain"
        style={{ minHeight: '100dvh', justifyContent: 'center', gap: 22 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="center"
        >
          <img
            src="/icon.svg"
            alt=""
            width={86}
            height={86}
            style={{ borderRadius: 20, boxShadow: 'var(--shadow-lg)' }}
          />
          <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 18 }}>
            {brand.name}
          </h1>
          <p className="muted" style={{ marginTop: 4 }}>
            {brand.tagline}
          </p>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="empty__text" style={{ maxWidth: 'none', textAlign: 'center' }}>
            Entra con tu cuenta de Google. Tus cuentas quedan guardadas y las recuperas aunque
            cambies de celular.
          </p>

          <button
            className="btn btn--primary btn--block btn--lg"
            style={{ marginTop: 16 }}
            onClick={signIn}
          >
            <LogIn size={18} />
            Entrar con Google
          </button>

          {error && (
            <p
              className="small center"
              style={{ color: 'var(--expense)', marginTop: 12 }}
              role="alert"
            >
              {error}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
