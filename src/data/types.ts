/**
 * Modelo de datos de Julian App.
 *
 * Regla de oro: los montos son ENTEROS EN CENTAVOS Y SIEMPRE POSITIVOS.
 * El signo lo determina `Movement['type']`, nunca el número.
 * Ver CLAUDE.md.
 */

export type ID = string

export type ThemePref = 'light' | 'dark' | 'system'

/** `person` = cuenta que representa a alguien que te debe o a quien le debes. */
export type AccountKind = 'normal' | 'person'

export type MovementType = 'income' | 'expense' | 'transfer' | 'adjust'

/** Las categorías están atadas a un tipo (decisión 2.6, difiere de Dahia). */
export type CategoryKind = 'income' | 'expense'

export type NoteColor = 'crimson' | 'gold' | 'olive' | 'steel' | 'plum'

export type ReminderFreq = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'yearly'

/** Configuración del usuario. No hay onboarding: arranca con valores por defecto. */
export interface Profile {
  userName: string
  theme: ThemePref
  /** Oculta los montos tras `••••` en toda la app. */
  hideBalance: boolean
  createdAt: number
}

/** Un lugar donde hay plata. No se borran: se archivan. */
export interface Account {
  id: ID
  name: string
  emoji: string
  color: string
  kind: AccountKind
  /** Archivada: no suma al total ni aparece en los selectores, pero conserva su historial. */
  archived: boolean
  /** Borrada de verdad. Solo se permite si no tiene movimientos. */
  deleted?: boolean
  order: number
  createdAt: number
}

export interface Category {
  id: ID
  name: string
  emoji: string
  color: string
  kind: CategoryKind
  archived?: boolean
  order: number
  createdAt: number
}

/**
 * Un movimiento de dinero.
 *
 * - `income`   → entra a `accountId`, requiere `categoryId` de tipo income.
 * - `expense`  → sale de `accountId`, requiere `categoryId` de tipo expense.
 * - `transfer` → sale de `accountId` y entra a `toAccountId`. No es ingreso ni gasto.
 * - `adjust`   → corrige el saldo de `accountId` según `direction`. No cuenta en estadísticas.
 */
export interface Movement {
  id: ID
  type: MovementType
  /** Centavos, entero, siempre positivo. */
  amount: number
  accountId: ID
  /** Solo en `transfer`: cuenta de destino. */
  toAccountId?: ID
  /** Solo en `income` y `expense`. */
  categoryId?: ID
  note?: string
  /** Solo en `adjust`: si el ajuste sube o baja el saldo. */
  direction?: 'in' | 'out'
  /** Cuándo ocurrió (lo que ve el usuario). */
  date: number
  /** Cuándo se registró (para desempatar el orden). */
  createdAt: number
}

/**
 * Recordatorio de pago.
 *
 * Es SOLO un aviso: no lleva cuenta ni categoría y nunca genera un movimiento.
 * El gasto lo registra Julián a mano desde "Ir a pagar", que abre el formulario
 * con el concepto y el monto ya escritos.
 */
export interface Reminder {
  id: ID
  name: string
  emoji: string
  /** Centavos. Opcional: puede ser un recordatorio sin monto fijo. */
  amount?: number
  /** Si se repite o es de una sola vez. */
  periodic: boolean
  freq?: ReminderFreq
  /** Timestamp del próximo vencimiento. */
  nextDate: number
  note?: string
  active: boolean
  /** Solo para los de una sola vez, ya cumplidos. */
  done?: boolean
  createdAt: number
}

export interface NoteItem {
  id: string
  text: string
  done: boolean
}

export interface Note {
  id: ID
  emoji: string
  title: string
  body?: string
  items?: NoteItem[]
  isChecklist: boolean
  color: NoteColor
  pinned: boolean
  createdAt: number
  updatedAt: number
}

/** Meta de ahorro. El progreso se lleva a mano con abonos, no se ata a una cuenta. */
export interface SavingsGoal {
  id: ID
  name: string
  emoji: string
  color: string
  /** Centavos. */
  target: number
  /** Centavos ahorrados hasta ahora. */
  saved: number
  /** Timestamp de la fecha objetivo. */
  deadline?: number
  note?: string
  done: boolean
  order: number
  createdAt: number
}

/** El estado completo de la app, tal como lo entrega y recibe un DataProvider. */
export interface DataSnapshot {
  profile: Profile
  accounts: Account[]
  categories: Category[]
  movements: Movement[]
  reminders: Reminder[]
  notes: Note[]
  goals: SavingsGoal[]
}

/* ---------------------------------------------------------------------------
   Entradas de creación: lo mínimo que pide la UI para crear cada cosa.
   El store rellena id, order y timestamps.
   --------------------------------------------------------------------------- */

export interface NewAccountInput {
  name: string
  emoji: string
  color: string
  kind?: AccountKind
}

export interface NewCategoryInput {
  name: string
  emoji: string
  color: string
  kind: CategoryKind
}

export interface NewMovementInput {
  type: MovementType
  amount: number
  accountId: ID
  toAccountId?: ID
  categoryId?: ID
  note?: string
  direction?: 'in' | 'out'
  date?: number
}

export interface NewReminderInput {
  name: string
  emoji: string
  amount?: number
  periodic: boolean
  freq?: ReminderFreq
  nextDate: number
  note?: string
}

export interface NewNoteInput {
  emoji?: string
  title?: string
  body?: string
  items?: NoteItem[]
  isChecklist?: boolean
  color?: NoteColor
}

export interface NewGoalInput {
  name: string
  emoji: string
  color: string
  target: number
  saved?: number
  deadline?: number
  note?: string
}
