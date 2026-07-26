/**
 * Todo cálculo derivado de los datos vive aquí. Ningún componente calcula saldos.
 *
 * Funciones puras, sin estado y sin efectos: son las que cubren los tests.
 * Los montos entran y salen en centavos enteros.
 */

import type { Account, Category, ID, Movement, Reminder, SavingsGoal } from './types'
import {
  DAY_MS,
  addDays,
  addMonths,
  dayKey,
  daysBetween,
  daysInMonth,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
} from '../lib/date'

/* ---------------------------------------------------------------------------
   Orden
   --------------------------------------------------------------------------- */

/** Del más nuevo al más viejo. `createdAt` desempata cuando dos caen el mismo instante. */
export function sortedDesc(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => b.date - a.date || b.createdAt - a.createdAt)
}

/** Del más viejo al más nuevo. Necesario para acumular saldos en el tiempo. */
export function sortedAsc(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => a.date - b.date || a.createdAt - b.createdAt)
}

/* ---------------------------------------------------------------------------
   Efecto de un movimiento sobre las cuentas
   --------------------------------------------------------------------------- */

/**
 * Cuánto cambia el saldo de `accountId` por culpa de `m`.
 *
 * Es la única función que decide signos. Si algo de la app suma mal, empieza aquí.
 */
export function effectOn(m: Movement, accountId: ID): number {
  switch (m.type) {
    case 'income':
      return m.accountId === accountId ? m.amount : 0

    case 'expense':
      return m.accountId === accountId ? -m.amount : 0

    case 'transfer': {
      // Una transferencia toca dos cuentas. Si origen y destino fueran la misma
      // (dato corrupto), los efectos se cancelan y el saldo no se mueve.
      let delta = 0
      if (m.accountId === accountId) delta -= m.amount
      if (m.toAccountId === accountId) delta += m.amount
      return delta
    }

    case 'adjust':
      if (m.accountId !== accountId) return 0
      return m.direction === 'out' ? -m.amount : m.amount

    default:
      return 0
  }
}

/** Saldo actual de una cuenta. */
export function accountBalance(movements: Movement[], accountId: ID): number {
  let total = 0
  for (const m of movements) total += effectOn(m, accountId)
  return total
}

/**
 * Saldos de todas las cuentas de una sola pasada.
 * Recorrer los movimientos una vez por cuenta es O(cuentas × movimientos) sin motivo.
 */
export function allBalances(movements: Movement[]): Record<ID, number> {
  const out: Record<ID, number> = {}

  const bump = (id: ID | undefined, delta: number) => {
    if (!id) return
    out[id] = (out[id] ?? 0) + delta
  }

  for (const m of movements) {
    switch (m.type) {
      case 'income':
        bump(m.accountId, m.amount)
        break
      case 'expense':
        bump(m.accountId, -m.amount)
        break
      case 'transfer':
        bump(m.accountId, -m.amount)
        bump(m.toAccountId, m.amount)
        break
      case 'adjust':
        bump(m.accountId, m.direction === 'out' ? -m.amount : m.amount)
        break
    }
  }

  return out
}

/** Cuentas que se muestran y que suman: ni borradas ni archivadas. */
export function visibleAccounts(accounts: Account[]): Account[] {
  return accounts
    .filter((a) => !a.deleted && !a.archived)
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)
}

/**
 * El saldo grande de la pantalla de inicio.
 *
 * Solo cuentas `normal`: las de tipo `person` son deudas, no plata que Julián tenga
 * en el bolsillo. Mezclarlas inflaría el total con dinero que no existe.
 */
export function totalBalance(accounts: Account[], movements: Movement[]): number {
  const balances = allBalances(movements)
  return visibleAccounts(accounts)
    .filter((a) => a.kind !== 'person')
    .reduce((sum, a) => sum + (balances[a.id] ?? 0), 0)
}

/** Resumen de deudas a partir de las cuentas de tipo `person`. */
export function debtSummary(
  accounts: Account[],
  movements: Movement[],
): { theyOweMe: number; iOwe: number; net: number } {
  const balances = allBalances(movements)
  let theyOweMe = 0
  let iOwe = 0

  for (const a of accounts) {
    if (a.deleted || a.archived || a.kind !== 'person') continue
    const bal = balances[a.id] ?? 0
    // Saldo positivo = le presté y me lo deben. Negativo = me prestaron.
    if (bal > 0) theyOweMe += bal
    else if (bal < 0) iOwe += -bal
  }

  return { theyOweMe, iOwe, net: theyOweMe - iOwe }
}

/**
 * Saldo de cada cuenta justo después de cada movimiento.
 * Sirve para mostrar "quedaste en X" en el historial y rastrear un descuadre.
 */
export function balancesAfter(movements: Movement[]): Record<ID, { from: number; to?: number }> {
  const running: Record<ID, number> = {}
  const out: Record<ID, { from: number; to?: number }> = {}

  for (const m of sortedAsc(movements)) {
    running[m.accountId] = (running[m.accountId] ?? 0) + effectOn(m, m.accountId)
    const entry: { from: number; to?: number } = { from: running[m.accountId] }

    if (m.type === 'transfer' && m.toAccountId) {
      running[m.toAccountId] = (running[m.toAccountId] ?? 0) + effectOn(m, m.toAccountId)
      entry.to = running[m.toAccountId]
    }

    out[m.id] = entry
  }

  return out
}

/* ---------------------------------------------------------------------------
   Periodos
   --------------------------------------------------------------------------- */

export function inRange(m: Movement, from: number, to: number): boolean {
  return m.date >= from && m.date <= to
}

export function movementsInRange(movements: Movement[], from: number, to: number): Movement[] {
  return movements.filter((m) => inRange(m, from, to))
}

export interface PeriodTotals {
  income: number
  expense: number
  net: number
  count: number
}

/**
 * Ingresos y gastos de un periodo.
 *
 * Las transferencias no cuentan (mover plata de un bolsillo a otro no es ganar
 * ni gastar) y los ajustes tampoco (son correcciones de saldo, no operaciones
 * reales). Esta es la razón de existir del tipo `adjust`.
 */
export function periodTotals(movements: Movement[], from: number, to: number): PeriodTotals {
  let income = 0
  let expense = 0
  let count = 0

  for (const m of movements) {
    if (!inRange(m, from, to)) continue
    if (m.type === 'income') {
      income += m.amount
      count++
    } else if (m.type === 'expense') {
      expense += m.amount
      count++
    }
  }

  return { income, expense, net: income - expense, count }
}

export interface CategoryStat {
  categoryId: ID
  category?: Category
  total: number
  count: number
  /** Porcentaje entero del total del periodo. La suma de todos da exactamente 100. */
  percent: number
}

/** Gasto (o ingreso) agrupado por categoría, de mayor a menor. */
export function categoryStats(
  movements: Movement[],
  categories: Category[],
  from: number,
  to: number,
  kind: 'income' | 'expense',
): CategoryStat[] {
  const byId = new Map<ID, Category>(categories.map((c) => [c.id, c]))
  const totals = new Map<ID, { total: number; count: number }>()

  for (const m of movements) {
    if (m.type !== kind || !inRange(m, from, to)) continue
    const key = m.categoryId ?? '__sin__'
    const cur = totals.get(key) ?? { total: 0, count: 0 }
    cur.total += m.amount
    cur.count += 1
    totals.set(key, cur)
  }

  const rows = [...totals.entries()]
    .map(([categoryId, v]) => ({
      categoryId,
      category: byId.get(categoryId),
      total: v.total,
      count: v.count,
      percent: 0,
    }))
    .sort((a, b) => b.total - a.total)

  const grand = rows.reduce((sum, r) => sum + r.total, 0)
  if (grand > 0) {
    // Porcentajes enteros que suman 100 exacto (restos mayores), para que la
    // leyenda del vinilo nunca muestre 99 % ni 101 %.
    const exact = rows.map((r) => (r.total / grand) * 100)
    const floored = exact.map(Math.floor)
    let left = 100 - floored.reduce((s, v) => s + v, 0)
    const order = exact
      .map((v, i) => ({ i, frac: v - Math.floor(v) }))
      .sort((a, b) => b.frac - a.frac)
    for (const { i } of order) {
      if (left <= 0) break
      floored[i] += 1
      left -= 1
    }
    rows.forEach((r, i) => {
      r.percent = floored[i]
    })
  }

  return rows
}

/** Gasto total por día dentro de un rango. Alimenta la gráfica de ecualizador. */
export function dailyTotals(
  movements: Movement[],
  from: number,
  to: number,
  kind: 'income' | 'expense',
): Array<{ day: string; ts: number; total: number }> {
  const buckets = new Map<string, number>()

  for (let ts = startOfDay(from); ts <= to; ts = addDays(ts, 1)) {
    buckets.set(dayKey(ts), 0)
  }

  for (const m of movements) {
    if (m.type !== kind || !inRange(m, from, to)) continue
    const key = dayKey(m.date)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + m.amount)
  }

  return [...buckets.entries()].map(([day, total]) => {
    const [y, mo, d] = day.split('-').map(Number)
    return { day, ts: new Date(y, mo - 1, d).getTime(), total }
  })
}

/** Saldo total acumulado día a día. Alimenta la gráfica de evolución. */
export function balanceEvolution(
  accounts: Account[],
  movements: Movement[],
  from: number,
  to: number,
): Array<{ ts: number; balance: number }> {
  const realIds = new Set(
    accounts.filter((a) => !a.deleted && a.kind !== 'person').map((a) => a.id),
  )

  // Punto de partida: todo lo que pasó antes del rango.
  let running = 0
  for (const m of movements) {
    if (m.date >= from) continue
    for (const id of realIds) running += effectOn(m, id)
  }

  const byDay = new Map<string, number>()
  for (const m of movements) {
    if (!inRange(m, from, to)) continue
    let delta = 0
    for (const id of realIds) delta += effectOn(m, id)
    const key = dayKey(m.date)
    byDay.set(key, (byDay.get(key) ?? 0) + delta)
  }

  const out: Array<{ ts: number; balance: number }> = []
  for (let ts = startOfDay(from); ts <= to; ts = addDays(ts, 1)) {
    running += byDay.get(dayKey(ts)) ?? 0
    out.push({ ts, balance: running })
  }
  return out
}

/* ---------------------------------------------------------------------------
   Resumen inteligente (sin IA — decisión D9)
   --------------------------------------------------------------------------- */

export interface MonthInsight {
  /** Rango del mes analizado. */
  from: number
  to: number
  income: number
  expense: number
  net: number
  /** Los mismos números del mes anterior, para comparar. */
  prevIncome: number
  prevExpense: number
  /** Variación del gasto contra el mes anterior. `null` si el anterior fue cero. */
  expenseChange: number | null
  /** Categoría donde más gastó. */
  topCategory?: CategoryStat
  /** El día más caro del mes. */
  worstDay?: { ts: number; total: number }
  /** Promedio de gasto por día transcurrido. */
  dailyAverage: number
  /** Proyección del gasto al cierre del mes, al ritmo actual. */
  projected: number
  /** Días del mes ya transcurridos (mínimo 1, para no dividir por cero). */
  elapsedDays: number
  totalDays: number
  /** `true` si el mes analizado es el mes en curso: solo entonces la proyección tiene sentido. */
  isCurrentMonth: boolean
}

/**
 * El corazón del "Resumen inteligente". Todo calculado, nada adivinado.
 *
 * La proyección no depende de un presupuesto (Julián no quiso presupuestos):
 * se saca del ritmo de gasto de los días ya transcurridos del mes.
 */
export function monthInsight(
  movements: Movement[],
  categories: Category[],
  anchor: number = Date.now(),
  now: number = Date.now(),
): MonthInsight {
  const from = startOfMonth(anchor)
  const to = endOfMonth(anchor)

  const prevAnchor = addMonths(from, -1)
  const prevFrom = startOfMonth(prevAnchor)
  const prevTo = endOfMonth(prevAnchor)

  const cur = periodTotals(movements, from, to)
  const prev = periodTotals(movements, prevFrom, prevTo)

  const cats = categoryStats(movements, categories, from, to, 'expense')

  const days = dailyTotals(movements, from, to, 'expense')
  const worst = days.reduce<{ ts: number; total: number } | undefined>(
    (best, d) => (d.total > 0 && (!best || d.total > best.total) ? { ts: d.ts, total: d.total } : best),
    undefined,
  )

  const totalDays = daysInMonth(from)
  const isCurrentMonth = startOfMonth(now) === from
  // En el mes en curso solo cuentan los días vividos; en un mes pasado, todos.
  const elapsedDays = isCurrentMonth
    ? Math.min(totalDays, Math.max(1, daysBetween(from, now) + 1))
    : totalDays

  const dailyAverage = Math.round(cur.expense / elapsedDays)
  const projected = isCurrentMonth ? dailyAverage * totalDays : cur.expense

  const expenseChange =
    prev.expense === 0 ? null : ((cur.expense - prev.expense) / prev.expense) * 100

  return {
    from,
    to,
    income: cur.income,
    expense: cur.expense,
    net: cur.net,
    prevIncome: prev.income,
    prevExpense: prev.expense,
    expenseChange,
    topCategory: cats[0],
    worstDay: worst,
    dailyAverage,
    projected,
    elapsedDays,
    totalDays,
    isCurrentMonth,
  }
}

/* ---------------------------------------------------------------------------
   Recordatorios de pago
   --------------------------------------------------------------------------- */

export type ReminderUrgency = 'overdue' | 'today' | 'soon' | 'later'

export function reminderUrgency(r: Reminder, now: number = Date.now()): ReminderUrgency {
  const diff = daysBetween(now, r.nextDate)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 3) return 'soon'
  return 'later'
}

/** Recordatorios vivos, ordenados por cercanía. */
export function activeReminders(reminders: Reminder[]): Reminder[] {
  return reminders
    .filter((r) => r.active && !r.done)
    .sort((a, b) => a.nextDate - b.nextDate)
}

/**
 * Los que disparan el aviso al abrir la app: vencidos, de hoy o de mañana.
 * Sin racha ni mascota, este aviso es la única razón para volver (decisión D10).
 */
export function dueReminders(reminders: Reminder[], now: number = Date.now()): Reminder[] {
  const limit = endOfDay(addDays(now, 1))
  return activeReminders(reminders).filter((r) => r.nextDate <= limit)
}

/** Recordatorios que caen dentro de un mes, agrupados por día. Alimenta el calendario. */
export function remindersByDay(
  reminders: Reminder[],
  from: number,
  to: number,
): Map<string, Reminder[]> {
  const out = new Map<string, Reminder[]>()
  for (const r of activeReminders(reminders)) {
    if (r.nextDate < from || r.nextDate > to) continue
    const key = dayKey(r.nextDate)
    const list = out.get(key) ?? []
    list.push(r)
    out.set(key, list)
  }
  return out
}

/** Cuándo toca el siguiente pago después de marcar este como hecho. */
export function nextReminderDate(r: Reminder): number {
  switch (r.freq) {
    case 'weekly':
      return addDays(r.nextDate, 7)
    case 'biweekly':
      return addDays(r.nextDate, 14)
    case 'monthly':
      return addMonths(r.nextDate, 1)
    case 'bimonthly':
      return addMonths(r.nextDate, 2)
    case 'yearly':
      return addMonths(r.nextDate, 12)
    default:
      return addMonths(r.nextDate, 1)
  }
}

/** Total comprometido en pagos de un mes. */
export function remindersTotal(reminders: Reminder[], from: number, to: number): number {
  return activeReminders(reminders)
    .filter((r) => r.nextDate >= from && r.nextDate <= to)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0)
}

/* ---------------------------------------------------------------------------
   Metas de ahorro
   --------------------------------------------------------------------------- */

export interface GoalProgress {
  /** Fracción 0–1 de lo ahorrado sobre lo que falta. */
  ratio: number
  percent: number
  remaining: number
  daysLeft: number | null
  /** Cuánto tocaría guardar por mes para llegar a tiempo. `null` si no hay fecha. */
  perMonth: number | null
  /** `true` si la fecha ya pasó y no se completó. */
  late: boolean
}

export function goalProgress(goal: SavingsGoal, now: number = Date.now()): GoalProgress {
  const ratio = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0
  const remaining = Math.max(0, goal.target - goal.saved)
  const daysLeft = goal.deadline ? daysBetween(now, goal.deadline) : null

  let perMonth: number | null = null
  if (goal.deadline && remaining > 0 && daysLeft !== null && daysLeft > 0) {
    const months = Math.max(1, daysLeft / 30)
    perMonth = Math.round(remaining / months)
  }

  return {
    ratio,
    percent: Math.round(ratio * 100),
    remaining,
    daysLeft,
    perMonth,
    late: !goal.done && daysLeft !== null && daysLeft < 0,
  }
}

/* ---------------------------------------------------------------------------
   Utilidades varias
   --------------------------------------------------------------------------- */

/** Agrupa movimientos por día para el historial, ya ordenados. */
export function groupByDay(
  movements: Movement[],
): Array<{ day: string; ts: number; items: Movement[] }> {
  const groups = new Map<string, Movement[]>()

  for (const m of sortedDesc(movements)) {
    const key = dayKey(m.date)
    const list = groups.get(key) ?? []
    list.push(m)
    groups.set(key, list)
  }

  return [...groups.entries()].map(([day, items]) => {
    const [y, mo, d] = day.split('-').map(Number)
    return { day, ts: new Date(y, mo - 1, d).getTime(), items }
  })
}

/** Categorías del tipo pedido, sin archivar y ordenadas. */
export function categoriesOf(categories: Category[], kind: 'income' | 'expense'): Category[] {
  return categories
    .filter((c) => c.kind === kind && !c.archived)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es'))
}

/** Categorías que Julián usa de verdad, primero las más frecuentes del último mes. */
export function frequentCategories(
  movements: Movement[],
  categories: Category[],
  kind: 'income' | 'expense',
  now: number = Date.now(),
): Category[] {
  const since = now - 60 * DAY_MS
  const uses = new Map<ID, number>()

  for (const m of movements) {
    if (m.type !== kind || !m.categoryId || m.date < since) continue
    uses.set(m.categoryId, (uses.get(m.categoryId) ?? 0) + 1)
  }

  return categoriesOf(categories, kind).sort((a, b) => {
    const diff = (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0)
    return diff !== 0 ? diff : a.name.localeCompare(b.name, 'es')
  })
}

/** `true` si la cuenta no tiene ni un movimiento: solo entonces se puede borrar de verdad. */
export function accountIsEmpty(movements: Movement[], accountId: ID): boolean {
  return !movements.some((m) => m.accountId === accountId || m.toAccountId === accountId)
}

export function categoryIsUsed(movements: Movement[], categoryId: ID): boolean {
  return movements.some((m) => m.categoryId === categoryId)
}
