/**
 * Proveedor local: todo en `localStorage`, sin cuenta y sin conexión.
 *
 * Es el que usa la app mientras no haya sesión iniciada, y el que permite que
 * funcione sin señal (respuesta 7.2). Guarda el snapshot completo en cada
 * escritura: para el volumen de una app de finanzas personales (miles de
 * registros como mucho) es instantáneo y evita estados a medias.
 */

import { mergeSnapshot } from './seed'
import { sanitize, type DataProvider } from './provider'
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

const KEY = 'julian.snapshot.v1'

function read(): DataSnapshot {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return mergeSnapshot(null)
    return mergeSnapshot(JSON.parse(raw))
  } catch {
    // Si el JSON está corrupto se arranca limpio en vez de dejar la app muerta.
    // No se borra la clave: si el usuario reporta el problema, el dato sigue ahí.
    return mergeSnapshot(null)
  }
}

function write(snap: DataSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(snap))
  } catch (err) {
    // Cuota llena o modo privado de Safari. Se avisa por consola y la app sigue
    // funcionando en memoria hasta que se recargue.
    console.error('No se pudo guardar en el dispositivo:', err)
  }
}

/** Inserta o reemplaza por id, conservando el orden de llegada. */
function upsertBy<T extends { id: ID }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id)
  if (idx === -1) return [...list, item]
  const copy = [...list]
  copy[idx] = item
  return copy
}

function mutate(fn: (snap: DataSnapshot) => DataSnapshot): Promise<void> {
  write(fn(read()))
  return Promise.resolve()
}

export function createLocalProvider(): DataProvider {
  return {
    load() {
      return Promise.resolve(read())
    },

    saveProfile(profile: Profile) {
      return mutate((s) => ({ ...s, profile: sanitize(profile) }))
    },

    upsertAccount(account: Account) {
      return mutate((s) => ({ ...s, accounts: upsertBy(s.accounts, sanitize(account)) }))
    },
    removeAccount(id: ID) {
      return mutate((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }))
    },

    upsertCategory(category: Category) {
      return mutate((s) => ({ ...s, categories: upsertBy(s.categories, sanitize(category)) }))
    },
    removeCategory(id: ID) {
      return mutate((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }))
    },

    upsertMovement(movement: Movement) {
      return mutate((s) => ({ ...s, movements: upsertBy(s.movements, sanitize(movement)) }))
    },
    removeMovement(id: ID) {
      return mutate((s) => ({ ...s, movements: s.movements.filter((m) => m.id !== id) }))
    },

    upsertReminder(reminder: Reminder) {
      return mutate((s) => ({ ...s, reminders: upsertBy(s.reminders, sanitize(reminder)) }))
    },
    removeReminder(id: ID) {
      return mutate((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }))
    },

    upsertNote(note: Note) {
      return mutate((s) => ({ ...s, notes: upsertBy(s.notes, sanitize(note)) }))
    },
    removeNote(id: ID) {
      return mutate((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }))
    },

    upsertGoal(goal: SavingsGoal) {
      return mutate((s) => ({ ...s, goals: upsertBy(s.goals, sanitize(goal)) }))
    },
    removeGoal(id: ID) {
      return mutate((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }))
    },

    reset() {
      try {
        localStorage.removeItem(KEY)
      } catch (err) {
        console.error('No se pudo borrar el almacenamiento:', err)
      }
      return Promise.resolve()
    },
  }
}
