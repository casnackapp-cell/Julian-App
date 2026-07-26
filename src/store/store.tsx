/**
 * Estado global de la app.
 *
 * Patrón: el estado vive en React y se refleja en el `DataProvider` de forma
 * optimista — la UI se actualiza al instante y la escritura ocurre en segundo
 * plano. Es lo correcto para una app offline-first: en el bus, sin señal,
 * registrar un gasto tiene que sentirse inmediato.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { DataProvider } from '../data/provider'
import { emptySnapshot } from '../data/seed'
import { accountBalance } from '../data/selectors'
import { newId } from '../lib/id'
import type {
  Account,
  Category,
  DataSnapshot,
  ID,
  Movement,
  NewAccountInput,
  NewCategoryInput,
  NewGoalInput,
  NewMovementInput,
  NewNoteInput,
  NewReminderInput,
  Note,
  Profile,
  Reminder,
  SavingsGoal,
  ThemePref,
} from '../data/types'
import { nextReminderDate } from '../data/selectors'

interface AppContextValue extends DataSnapshot {
  loading: boolean
  /** Tema realmente aplicado, ya resuelto si la preferencia es `system`. */
  resolvedTheme: 'light' | 'dark'

  updateProfile: (patch: Partial<Profile>) => void
  setTheme: (theme: ThemePref) => void
  toggleHideBalance: () => void

  addAccount: (input: NewAccountInput) => Account
  updateAccount: (account: Account) => void
  archiveAccount: (id: ID, archived: boolean) => void
  deleteAccount: (id: ID) => void

  addCategory: (input: NewCategoryInput) => Category
  updateCategory: (category: Category) => void
  deleteCategory: (id: ID) => void

  addMovement: (input: NewMovementInput) => Movement
  updateMovement: (movement: Movement) => void
  deleteMovement: (id: ID) => void

  addReminder: (input: NewReminderInput) => Reminder
  updateReminder: (reminder: Reminder) => void
  deleteReminder: (id: ID) => void
  /** Marca un pago como hecho: avanza la fecha si es periódico, lo cierra si no. */
  markReminderPaid: (id: ID, alsoRegister?: boolean) => void
  snoozeReminder: (id: ID, days: number) => void

  addNote: (input: NewNoteInput) => Note
  updateNote: (note: Note) => void
  deleteNote: (id: ID) => void

  addGoal: (input: NewGoalInput) => SavingsGoal
  updateGoal: (goal: SavingsGoal) => void
  deleteGoal: (id: ID) => void
  /** Suma (o resta, si es negativo) a lo ahorrado de una meta. */
  contributeToGoal: (id: ID, amount: number) => void

  resetAll: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}

export function AppProvider({
  dataProvider,
  children,
}: {
  dataProvider: DataProvider
  children: ReactNode
}) {
  const [snap, setSnap] = useState<DataSnapshot>(() => emptySnapshot())
  const [loading, setLoading] = useState(true)
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
  )

  /**
   * El provider se guarda en una ref para que los callbacks no dependan de él.
   * Si dependieran, cambiar de proveedor (entrar con Google) recrearía todas las
   * funciones y remontaría media app.
   */
  const providerRef = useRef(dataProvider)
  providerRef.current = dataProvider

  /** Escritura en segundo plano. Un fallo no debe tumbar la interfaz. */
  const persist = useCallback((op: (p: DataProvider) => Promise<void>) => {
    op(providerRef.current).catch((err) => {
      console.error('No se pudo guardar el cambio:', err)
    })
  }, [])

  /* --- Carga inicial --- */
  useEffect(() => {
    let alive = true
    setLoading(true)

    dataProvider
      .load()
      .then((loaded) => {
        if (alive) setSnap(loaded)
      })
      .catch((err) => {
        console.error('No se pudieron cargar los datos:', err)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [dataProvider])

  /* --- Tema --- */
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    snap.profile.theme === 'system' ? (systemDark ? 'dark' : 'light') : snap.profile.theme

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    // La barra del navegador de Android debe seguir el tema, o se ve un corte feo.
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', resolvedTheme === 'dark' ? '#1e1714' : '#f4ebda')
  }, [resolvedTheme])

  /* ---------------------------------------------------------------------------
     Perfil
     --------------------------------------------------------------------------- */

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setSnap((s) => {
        const profile = { ...s.profile, ...patch }
        persist((p) => p.saveProfile(profile))
        return { ...s, profile }
      })
    },
    [persist],
  )

  const setTheme = useCallback((theme: ThemePref) => updateProfile({ theme }), [updateProfile])

  const toggleHideBalance = useCallback(() => {
    setSnap((s) => {
      const profile = { ...s.profile, hideBalance: !s.profile.hideBalance }
      persist((p) => p.saveProfile(profile))
      return { ...s, profile }
    })
  }, [persist])

  /* ---------------------------------------------------------------------------
     Cuentas
     --------------------------------------------------------------------------- */

  const addAccount = useCallback(
    (input: NewAccountInput): Account => {
      const now = Date.now()
      const account: Account = {
        id: newId(),
        name: input.name.trim(),
        emoji: input.emoji || '💵',
        color: input.color,
        kind: input.kind ?? 'normal',
        archived: false,
        order: now,
        createdAt: now,
      }
      setSnap((s) => ({ ...s, accounts: [...s.accounts, account] }))
      persist((p) => p.upsertAccount(account))
      return account
    },
    [persist],
  )

  const updateAccount = useCallback(
    (account: Account) => {
      setSnap((s) => ({
        ...s,
        accounts: s.accounts.map((a) => (a.id === account.id ? account : a)),
      }))
      persist((p) => p.upsertAccount(account))
    },
    [persist],
  )

  const archiveAccount = useCallback(
    (id: ID, archived: boolean) => {
      setSnap((s) => {
        const next = s.accounts.map((a) => (a.id === id ? { ...a, archived } : a))
        const changed = next.find((a) => a.id === id)
        if (changed) persist((p) => p.upsertAccount(changed))
        return { ...s, accounts: next }
      })
    },
    [persist],
  )

  /**
   * Borrado real. Solo se permite si la cuenta no tiene movimientos: si los
   * tuviera, borrarla dejaría el historial apuntando a una cuenta fantasma y los
   * saldos dejarían de cuadrar. En ese caso la UI ofrece archivar.
   */
  const deleteAccount = useCallback(
    (id: ID) => {
      setSnap((s) => {
        const used = s.movements.some((m) => m.accountId === id || m.toAccountId === id)
        if (used) {
          const next = s.accounts.map((a) => (a.id === id ? { ...a, archived: true } : a))
          const changed = next.find((a) => a.id === id)
          if (changed) persist((p) => p.upsertAccount(changed))
          return { ...s, accounts: next }
        }
        persist((p) => p.removeAccount(id))
        return { ...s, accounts: s.accounts.filter((a) => a.id !== id) }
      })
    },
    [persist],
  )

  /* ---------------------------------------------------------------------------
     Categorías
     --------------------------------------------------------------------------- */

  const addCategory = useCallback(
    (input: NewCategoryInput): Category => {
      const now = Date.now()
      const category: Category = {
        id: newId(),
        name: input.name.trim(),
        emoji: input.emoji || '📌',
        color: input.color,
        kind: input.kind,
        order: now,
        createdAt: now,
      }
      setSnap((s) => ({ ...s, categories: [...s.categories, category] }))
      persist((p) => p.upsertCategory(category))
      return category
    },
    [persist],
  )

  const updateCategory = useCallback(
    (category: Category) => {
      setSnap((s) => ({
        ...s,
        categories: s.categories.map((c) => (c.id === category.id ? category : c)),
      }))
      persist((p) => p.upsertCategory(category))
    },
    [persist],
  )

  /** Igual que las cuentas: si ya se usó, se archiva en vez de borrarse. */
  const deleteCategory = useCallback(
    (id: ID) => {
      setSnap((s) => {
        const used = s.movements.some((m) => m.categoryId === id)
        if (used) {
          const next = s.categories.map((c) => (c.id === id ? { ...c, archived: true } : c))
          const changed = next.find((c) => c.id === id)
          if (changed) persist((p) => p.upsertCategory(changed))
          return { ...s, categories: next }
        }
        persist((p) => p.removeCategory(id))
        return { ...s, categories: s.categories.filter((c) => c.id !== id) }
      })
    },
    [persist],
  )

  /* ---------------------------------------------------------------------------
     Movimientos
     --------------------------------------------------------------------------- */

  /**
   * Archiva sola una cuenta de persona cuando su saldo llega a cero: la deuda
   * quedó saldada y no tiene por qué seguir estorbando en la lista.
   */
  const reconcilePersons = useCallback(
    (s: DataSnapshot): DataSnapshot => {
      let touched = false
      const accounts = s.accounts.map((a) => {
        if (a.kind !== 'person' || a.archived || a.deleted) return a
        if (accountBalance(s.movements, a.id) !== 0) return a
        touched = true
        const next = { ...a, archived: true }
        persist((p) => p.upsertAccount(next))
        return next
      })
      return touched ? { ...s, accounts } : s
    },
    [persist],
  )

  const addMovement = useCallback(
    (input: NewMovementInput): Movement => {
      const now = Date.now()
      const movement: Movement = {
        id: newId(),
        type: input.type,
        // Blindaje: por más que la UI valide, aquí nunca entra un monto negativo
        // ni un decimal suelto. El signo es cosa del tipo, no del número.
        amount: Math.abs(Math.round(input.amount)),
        accountId: input.accountId,
        toAccountId: input.type === 'transfer' ? input.toAccountId : undefined,
        categoryId:
          input.type === 'income' || input.type === 'expense' ? input.categoryId : undefined,
        note: input.note?.trim() || undefined,
        direction: input.type === 'adjust' ? (input.direction ?? 'in') : undefined,
        date: input.date ?? now,
        createdAt: now,
      }

      setSnap((s) => reconcilePersons({ ...s, movements: [...s.movements, movement] }))
      persist((p) => p.upsertMovement(movement))
      return movement
    },
    [persist, reconcilePersons],
  )

  const updateMovement = useCallback(
    (movement: Movement) => {
      const clean: Movement = { ...movement, amount: Math.abs(Math.round(movement.amount)) }
      setSnap((s) =>
        reconcilePersons({
          ...s,
          movements: s.movements.map((m) => (m.id === clean.id ? clean : m)),
        }),
      )
      persist((p) => p.upsertMovement(clean))
    },
    [persist, reconcilePersons],
  )

  const deleteMovement = useCallback(
    (id: ID) => {
      setSnap((s) => reconcilePersons({ ...s, movements: s.movements.filter((m) => m.id !== id) }))
      persist((p) => p.removeMovement(id))
    },
    [persist, reconcilePersons],
  )

  /* ---------------------------------------------------------------------------
     Recordatorios
     --------------------------------------------------------------------------- */

  const addReminder = useCallback(
    (input: NewReminderInput): Reminder => {
      const reminder: Reminder = {
        id: newId(),
        name: input.name.trim(),
        emoji: input.emoji || '🔔',
        amount: input.amount,
        accountId: input.accountId,
        categoryId: input.categoryId,
        periodic: input.periodic,
        freq: input.periodic ? (input.freq ?? 'monthly') : undefined,
        nextDate: input.nextDate,
        note: input.note?.trim() || undefined,
        active: true,
        createdAt: Date.now(),
      }
      setSnap((s) => ({ ...s, reminders: [...s.reminders, reminder] }))
      persist((p) => p.upsertReminder(reminder))
      return reminder
    },
    [persist],
  )

  const updateReminder = useCallback(
    (reminder: Reminder) => {
      setSnap((s) => ({
        ...s,
        reminders: s.reminders.map((r) => (r.id === reminder.id ? reminder : r)),
      }))
      persist((p) => p.upsertReminder(reminder))
    },
    [persist],
  )

  const deleteReminder = useCallback(
    (id: ID) => {
      setSnap((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }))
      persist((p) => p.removeReminder(id))
    },
    [persist],
  )

  /**
   * Confirmar un pago.
   *
   * `alsoRegister` crea además el gasto correspondiente. Es opcional a propósito:
   * a veces Julián ya registró el gasto a mano y duplicarlo le descuadraría el mes.
   */
  const markReminderPaid = useCallback(
    (id: ID, alsoRegister = false) => {
      setSnap((s) => {
        const r = s.reminders.find((x) => x.id === id)
        if (!r) return s

        let movements = s.movements
        if (alsoRegister && r.amount && r.amount > 0 && r.accountId) {
          const now = Date.now()
          const movement: Movement = {
            id: newId(),
            type: 'expense',
            amount: r.amount,
            accountId: r.accountId,
            categoryId: r.categoryId,
            note: r.name,
            date: now,
            createdAt: now,
          }
          movements = [...movements, movement]
          persist((p) => p.upsertMovement(movement))
        }

        const next: Reminder = r.periodic
          ? { ...r, nextDate: nextReminderDate(r) }
          : { ...r, done: true, active: false }

        persist((p) => p.upsertReminder(next))
        return {
          ...s,
          movements,
          reminders: s.reminders.map((x) => (x.id === id ? next : x)),
        }
      })
    },
    [persist],
  )

  const snoozeReminder = useCallback(
    (id: ID, days: number) => {
      setSnap((s) => {
        const r = s.reminders.find((x) => x.id === id)
        if (!r) return s
        const next = { ...r, nextDate: r.nextDate + days * 86_400_000 }
        persist((p) => p.upsertReminder(next))
        return { ...s, reminders: s.reminders.map((x) => (x.id === id ? next : x)) }
      })
    },
    [persist],
  )

  /* ---------------------------------------------------------------------------
     Notas
     --------------------------------------------------------------------------- */

  const addNote = useCallback(
    (input: NewNoteInput): Note => {
      const now = Date.now()
      const note: Note = {
        id: newId(),
        emoji: input.emoji || '📝',
        title: input.title?.trim() ?? '',
        body: input.body,
        items: input.items,
        isChecklist: input.isChecklist ?? false,
        color: input.color ?? 'gold',
        pinned: false,
        createdAt: now,
        updatedAt: now,
      }
      setSnap((s) => ({ ...s, notes: [...s.notes, note] }))
      persist((p) => p.upsertNote(note))
      return note
    },
    [persist],
  )

  const updateNote = useCallback(
    (note: Note) => {
      const next = { ...note, updatedAt: Date.now() }
      setSnap((s) => ({ ...s, notes: s.notes.map((n) => (n.id === next.id ? next : n)) }))
      persist((p) => p.upsertNote(next))
    },
    [persist],
  )

  const deleteNote = useCallback(
    (id: ID) => {
      setSnap((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }))
      persist((p) => p.removeNote(id))
    },
    [persist],
  )

  /* ---------------------------------------------------------------------------
     Metas de ahorro
     --------------------------------------------------------------------------- */

  const addGoal = useCallback(
    (input: NewGoalInput): SavingsGoal => {
      const now = Date.now()
      const goal: SavingsGoal = {
        id: newId(),
        name: input.name.trim(),
        emoji: input.emoji || '🎯',
        color: input.color,
        target: Math.abs(Math.round(input.target)),
        saved: Math.abs(Math.round(input.saved ?? 0)),
        deadline: input.deadline,
        note: input.note?.trim() || undefined,
        done: false,
        order: now,
        createdAt: now,
      }
      setSnap((s) => ({ ...s, goals: [...s.goals, goal] }))
      persist((p) => p.upsertGoal(goal))
      return goal
    },
    [persist],
  )

  const updateGoal = useCallback(
    (goal: SavingsGoal) => {
      const next: SavingsGoal = {
        ...goal,
        target: Math.abs(Math.round(goal.target)),
        saved: Math.abs(Math.round(goal.saved)),
      }
      setSnap((s) => ({ ...s, goals: s.goals.map((g) => (g.id === next.id ? next : g)) }))
      persist((p) => p.upsertGoal(next))
    },
    [persist],
  )

  const deleteGoal = useCallback(
    (id: ID) => {
      setSnap((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }))
      persist((p) => p.removeGoal(id))
    },
    [persist],
  )

  const contributeToGoal = useCallback(
    (id: ID, amount: number) => {
      setSnap((s) => {
        const g = s.goals.find((x) => x.id === id)
        if (!g) return s
        const saved = Math.max(0, g.saved + Math.round(amount))
        const next: SavingsGoal = { ...g, saved, done: saved >= g.target }
        persist((p) => p.upsertGoal(next))
        return { ...s, goals: s.goals.map((x) => (x.id === id ? next : x)) }
      })
    },
    [persist],
  )

  /* --------------------------------------------------------------------------- */

  const resetAll = useCallback(() => {
    const fresh = emptySnapshot()
    setSnap(fresh)
    providerRef.current
      .reset()
      .then(() => {
        // Tras el reset hay que volver a sembrar las categorías base, o Julián
        // se queda sin ninguna y no podría ni registrar un gasto.
        for (const c of fresh.categories) providerRef.current.upsertCategory(c)
        return providerRef.current.saveProfile(fresh.profile)
      })
      .catch((err) => console.error('No se pudo reiniciar:', err))
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      ...snap,
      loading,
      resolvedTheme,
      updateProfile,
      setTheme,
      toggleHideBalance,
      addAccount,
      updateAccount,
      archiveAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      addMovement,
      updateMovement,
      deleteMovement,
      addReminder,
      updateReminder,
      deleteReminder,
      markReminderPaid,
      snoozeReminder,
      addNote,
      updateNote,
      deleteNote,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      resetAll,
    }),
    [
      snap,
      loading,
      resolvedTheme,
      updateProfile,
      setTheme,
      toggleHideBalance,
      addAccount,
      updateAccount,
      archiveAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      addMovement,
      updateMovement,
      deleteMovement,
      addReminder,
      updateReminder,
      deleteReminder,
      markReminderPaid,
      snoozeReminder,
      addNote,
      updateNote,
      deleteNote,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      resetAll,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
