/**
 * La frontera entre la app y donde viven los datos.
 *
 * Ningún componente ni el store hablan con localStorage o Firestore directamente:
 * todo pasa por esta interfaz. Gracias a eso la app se construyó y se probó entera
 * sin Firebase, y conectarlo después no obliga a tocar una sola pantalla.
 *
 * Los métodos son granulares a propósito (upsert/remove por entidad) para no
 * reescribir el snapshot completo en cada cambio, que en Firestore se traduce
 * en lecturas y escrituras de más.
 */

import type {
  Account,
  Category,
  DataSnapshot,
  ID,
  Movement,
  Note,
  Profile,
  Reminder,
  SavingsGoal,
} from './types'

export interface DataProvider {
  /** Carga todo el estado. Se llama una vez al arrancar. */
  load(): Promise<DataSnapshot>

  saveProfile(profile: Profile): Promise<void>

  upsertAccount(account: Account): Promise<void>
  removeAccount(id: ID): Promise<void>

  upsertCategory(category: Category): Promise<void>
  removeCategory(id: ID): Promise<void>

  upsertMovement(movement: Movement): Promise<void>
  removeMovement(id: ID): Promise<void>

  upsertReminder(reminder: Reminder): Promise<void>
  removeReminder(id: ID): Promise<void>

  upsertNote(note: Note): Promise<void>
  removeNote(id: ID): Promise<void>

  upsertGoal(goal: SavingsGoal): Promise<void>
  removeGoal(id: ID): Promise<void>

  /** Borra todo y vuelve al estado inicial. */
  reset(): Promise<void>
}

/**
 * Quita las claves con valor `undefined` antes de escribir.
 *
 * Firestore rechaza `undefined` con un error en tiempo de ejecución, y el modelo
 * está lleno de campos opcionales (`note`, `toAccountId`, `deadline`…). Se aplica
 * también en el proveedor local para que ambos guarden exactamente lo mismo y un
 * bug no aparezca solo en producción.
 */
export function sanitize<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out as T
}
