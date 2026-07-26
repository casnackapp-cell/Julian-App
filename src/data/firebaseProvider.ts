/**
 * Proveedor de Firestore.
 *
 * Estructura en la base:
 *
 *   users/{uid}                    → documento con el perfil
 *   users/{uid}/accounts/{id}
 *   users/{uid}/categories/{id}
 *   users/{uid}/movements/{id}
 *   users/{uid}/reminders/{id}
 *   users/{uid}/notes/{id}
 *   users/{uid}/goals/{id}
 *
 * Todo cuelga de `users/{uid}` para que las reglas de seguridad sean una sola
 * línea: solo el dueño entra a lo suyo.
 *
 * Los ids los genera el cliente (`lib/id.ts`), no Firestore, porque la app tiene
 * que poder crear registros sin señal y sincronizarlos después.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

import { sanitize, type DataProvider } from './provider'
import { defaultProfile, mergeSnapshot, seedCategories } from './seed'
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

const COLLECTIONS = ['accounts', 'categories', 'movements', 'reminders', 'notes', 'goals'] as const

export function createFirebaseProvider(db: Firestore, uid: string): DataProvider {
  const userRef = () => doc(db, 'users', uid)
  const colRef = (name: string) => collection(db, 'users', uid, name)
  const itemRef = (name: string, id: ID) => doc(db, 'users', uid, name, id)

  /** Escritura genérica: mismo camino para todas las entidades. */
  const put = <T extends { id: ID }>(name: string, item: T) =>
    setDoc(itemRef(name, item.id), sanitize(item))

  const drop = (name: string, id: ID) => deleteDoc(itemRef(name, id))

  return {
    async load(): Promise<DataSnapshot> {
      const profileSnap = await getDoc(userRef())

      // Primera vez: se siembra el perfil y las categorías base de una sola vez.
      // Sin esto, Julián entraría a una app sin ninguna categoría y no podría
      // ni registrar un gasto.
      if (!profileSnap.exists()) {
        const profile = defaultProfile()
        const categories = seedCategories()

        const batch = writeBatch(db)
        batch.set(userRef(), sanitize(profile))
        for (const c of categories) batch.set(itemRef('categories', c.id), sanitize(c))
        await batch.commit()

        return { ...mergeSnapshot(null), profile, categories }
      }

      // Las seis colecciones se piden en paralelo: en serie serían seis viajes
      // encadenados y la app tardaría en abrir.
      const [accounts, categories, movements, reminders, notes, goals] = await Promise.all(
        COLLECTIONS.map((name) => getDocs(colRef(name))),
      )

      return mergeSnapshot({
        profile: profileSnap.data() as Profile,
        accounts: accounts.docs.map((d) => d.data() as Account),
        categories: categories.docs.map((d) => d.data() as Category),
        movements: movements.docs.map((d) => d.data() as Movement),
        reminders: reminders.docs.map((d) => d.data() as Reminder),
        notes: notes.docs.map((d) => d.data() as Note),
        goals: goals.docs.map((d) => d.data() as SavingsGoal),
      })
    },

    saveProfile: (profile: Profile) => setDoc(userRef(), sanitize(profile)),

    upsertAccount: (account: Account) => put('accounts', account),
    removeAccount: (id: ID) => drop('accounts', id),

    upsertCategory: (category: Category) => put('categories', category),
    removeCategory: (id: ID) => drop('categories', id),

    upsertMovement: (movement: Movement) => put('movements', movement),
    removeMovement: (id: ID) => drop('movements', id),

    upsertReminder: (reminder: Reminder) => put('reminders', reminder),
    removeReminder: (id: ID) => drop('reminders', id),

    upsertNote: (note: Note) => put('notes', note),
    removeNote: (id: ID) => drop('notes', id),

    upsertGoal: (goal: SavingsGoal) => put('goals', goal),
    removeGoal: (id: ID) => drop('goals', id),

    /**
     * Borrado total.
     *
     * Firestore no borra subcolecciones al borrar el documento padre: hay que
     * recorrerlas. Se van mandando en lotes porque un batch admite 500
     * operaciones como máximo.
     */
    async reset(): Promise<void> {
      for (const name of COLLECTIONS) {
        const snap = await getDocs(colRef(name))
        let batch = writeBatch(db)
        let count = 0

        for (const d of snap.docs) {
          batch.delete(d.ref)
          count++
          if (count === 450) {
            await batch.commit()
            batch = writeBatch(db)
            count = 0
          }
        }

        if (count > 0) await batch.commit()
      }

      await setDoc(userRef(), sanitize(defaultProfile()))
    },
  }
}
