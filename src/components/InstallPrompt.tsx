/**
 * Invitación a instalar la PWA.
 *
 * Julián la va a abrir desde el navegador de Android, y una app que vive en una
 * pestaña se pierde y se deja de usar. Esto la convierte en un icono en su
 * pantalla de inicio.
 *
 * Solo aparece cuando Chrome dice que se puede instalar, y si la descarta no
 * vuelve a molestar.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { brand } from '../config/brand'

/** El evento no está en los tipos estándar de TypeScript. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'julian.install.dismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === '1') return
    } catch {
      // Sin almacenamiento, se muestra igual.
    }

    // Ya instalada: no tiene sentido ofrecerlo.
    if (window.matchMedia?.('(display-mode: standalone)').matches) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setDeferred(null))

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    setDeferred(null)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Da igual: en el peor caso vuelve a ofrecerse la próxima vez.
    }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <AnimatePresence>
      {deferred && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 'calc(var(--nav-h) + var(--safe-bottom) + 14px)',
            zIndex: 45,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            className="card card--tight"
            style={{ maxWidth: 'var(--maxw)', width: '100%', pointerEvents: 'auto' }}
          >
            <div className="hstack">
              <span className="row__icon">
                <Download size={18} />
              </span>
              <span className="row__main">
                <span className="row__title">Instala {brand.name}</span>
                <span className="row__sub">Queda en tu pantalla de inicio</span>
              </span>
              <button className="btn btn--sm btn--primary" onClick={install}>
                Instalar
              </button>
              <button className="icon-btn" onClick={dismiss} aria-label="Ahora no">
                <X size={17} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
