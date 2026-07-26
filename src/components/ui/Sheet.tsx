/**
 * Hoja inferior. Es el patrón de interacción principal de la app: todo lo que se
 * crea o edita pasa por aquí, para no sacar a Julián de la pantalla donde está.
 *
 * Detalles que importan en un celular:
 *  - se cierra arrastrando hacia abajo, no solo con la X;
 *  - se cierra con Escape y tocando el fondo;
 *  - bloquea el scroll de atrás mientras está abierta;
 *  - atrapa el foco del teclado dentro.
 */

import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Acción a la derecha del título (por ejemplo, borrar). */
  headerAction?: ReactNode
  /** Botones fijos al pie, siempre visibles aunque el cuerpo tenga scroll. */
  footer?: ReactNode
  children: ReactNode
}

export function Sheet({ open, onClose, title, headerAction, footer, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape cierra, y el scroll de la página de atrás se congela.
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Al abrir, el foco entra a la hoja para que el teclado no se quede atrás.
  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
      )
      first?.focus({ preventScroll: true })
    }, 120)
    return () => window.clearTimeout(id)
  }, [open])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Cierra si el gesto fue largo o rápido hacia abajo.
    if (info.offset.y > 110 || info.velocity.y > 620) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sheet-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={panelRef}
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 340, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={onDragEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet__grip" aria-hidden="true" />

            {title && (
              <div className="sheet__head">
                <h2 className="sheet__title">{title}</h2>
                {headerAction}
                <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
                  <X size={19} />
                </button>
              </div>
            )}

            <div className="sheet__body">{children}</div>

            {footer && <div className="sheet__foot">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
