/**
 * Acceso global a la hoja de registrar/editar un movimiento.
 *
 * Se monta una sola vez en el Layout. Cualquier pantalla puede abrirla sin
 * duplicar estado ni pasar callbacks por media app: el botón + de la barra, el
 * estado vacío del inicio, una fila del historial y el detalle de una cuenta
 * abren exactamente la misma hoja.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ID, Movement, MovementType } from '../data/types'
import { MovementSheet } from './MovementSheet'

interface OpenOptions {
  /** Deja preseleccionado el tipo y se salta el paso de elegirlo. */
  type?: MovementType
  /** Deja preseleccionada la cuenta (por ejemplo, al venir del detalle de una). */
  accountId?: ID
}

interface SheetsValue {
  /** Abre la hoja para crear. */
  openMovement: (opts?: OpenOptions) => void
  /** Abre la hoja para editar uno existente. */
  editMovement: (movement: Movement) => void
}

const SheetsContext = createContext<SheetsValue | null>(null)

export function useSheets(): SheetsValue {
  const ctx = useContext(SheetsContext)
  if (!ctx) throw new Error('useSheets debe usarse dentro de <SheetsProvider>')
  return ctx
}

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Movement | null>(null)
  const [preset, setPreset] = useState<OpenOptions>({})

  const openMovement = useCallback((opts: OpenOptions = {}) => {
    setEditing(null)
    setPreset(opts)
    setOpen(true)
  }, [])

  const editMovement = useCallback((movement: Movement) => {
    setEditing(movement)
    setPreset({})
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ openMovement, editMovement }), [openMovement, editMovement])

  return (
    <SheetsContext.Provider value={value}>
      {children}
      <MovementSheet
        open={open}
        onClose={close}
        editing={editing}
        presetType={preset.type}
        presetAccountId={preset.accountId}
      />
    </SheetsContext.Provider>
  )
}
