import { describe, expect, it } from 'vitest'
import {
  accountBalance,
  allBalances,
  balancesAfter,
  categoryStats,
  dailyTotals,
  debtSummary,
  effectOn,
  monthInsight,
  nextReminderDate,
  periodTotals,
  totalBalance,
} from './selectors'
import type { Account, Category, Movement, Reminder } from './types'

/* --- Ayudas para armar datos de prueba --- */

let seq = 0
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()

function mov(partial: Partial<Movement> & Pick<Movement, 'type' | 'amount' | 'accountId'>): Movement {
  seq += 1
  return {
    id: `m${seq}`,
    date: at(2026, 7, 10),
    createdAt: seq,
    ...partial,
  }
}

function acc(id: string, extra: Partial<Account> = {}): Account {
  return {
    id,
    name: id,
    emoji: '💵',
    color: '#000',
    kind: 'normal',
    archived: false,
    order: 0,
    createdAt: 0,
    ...extra,
  }
}

function cat(id: string, kind: 'income' | 'expense', name = id): Category {
  return { id, name, emoji: '📌', color: '#000', kind, order: 0, createdAt: 0 }
}

/* --------------------------------------------------------------------------- */

describe('effectOn — el origen de todos los signos', () => {
  it('un ingreso suma a su cuenta', () => {
    const m = mov({ type: 'income', amount: 1000, accountId: 'a' })
    expect(effectOn(m, 'a')).toBe(1000)
    expect(effectOn(m, 'b')).toBe(0)
  })

  it('un gasto resta de su cuenta', () => {
    const m = mov({ type: 'expense', amount: 1000, accountId: 'a' })
    expect(effectOn(m, 'a')).toBe(-1000)
  })

  it('una transferencia resta en el origen y suma en el destino', () => {
    const m = mov({ type: 'transfer', amount: 1000, accountId: 'a', toAccountId: 'b' })
    expect(effectOn(m, 'a')).toBe(-1000)
    expect(effectOn(m, 'b')).toBe(1000)
    expect(effectOn(m, 'c')).toBe(0)
  })

  it('una transferencia a la misma cuenta no mueve nada', () => {
    const m = mov({ type: 'transfer', amount: 1000, accountId: 'a', toAccountId: 'a' })
    expect(effectOn(m, 'a')).toBe(0)
  })

  it('un ajuste respeta su dirección', () => {
    expect(effectOn(mov({ type: 'adjust', amount: 500, accountId: 'a', direction: 'in' }), 'a')).toBe(500)
    expect(effectOn(mov({ type: 'adjust', amount: 500, accountId: 'a', direction: 'out' }), 'a')).toBe(-500)
  })
})

describe('saldos', () => {
  const movements = [
    mov({ type: 'adjust', amount: 100_000, accountId: 'a', direction: 'in' }),
    mov({ type: 'income', amount: 50_000, accountId: 'a', categoryId: 'ci' }),
    mov({ type: 'expense', amount: 30_000, accountId: 'a', categoryId: 'ce' }),
    mov({ type: 'transfer', amount: 20_000, accountId: 'a', toAccountId: 'b' }),
  ]

  it('acumula bien una cuenta', () => {
    expect(accountBalance(movements, 'a')).toBe(100_000)
    expect(accountBalance(movements, 'b')).toBe(20_000)
  })

  it('allBalances da lo mismo que accountBalance', () => {
    const bulk = allBalances(movements)
    expect(bulk.a).toBe(accountBalance(movements, 'a'))
    expect(bulk.b).toBe(accountBalance(movements, 'b'))
  })

  it('una cuenta puede quedar en negativo', () => {
    expect(accountBalance([mov({ type: 'expense', amount: 5000, accountId: 'x' })], 'x')).toBe(-5000)
  })

  it('el total ignora archivadas y cuentas de persona', () => {
    const accounts = [
      acc('a'),
      acc('b'),
      acc('vieja', { archived: true }),
      acc('pedro', { kind: 'person' }),
    ]
    const withExtras = [
      ...movements,
      mov({ type: 'adjust', amount: 999_999, accountId: 'vieja', direction: 'in' }),
      mov({ type: 'adjust', amount: 777_777, accountId: 'pedro', direction: 'in' }),
    ]
    // Solo a (100 000) + b (20 000).
    expect(totalBalance(accounts, withExtras)).toBe(120_000)
  })
})

describe('debtSummary', () => {
  it('separa lo que me deben de lo que debo', () => {
    const accounts = [acc('pedro', { kind: 'person' }), acc('ana', { kind: 'person' }), acc('mia')]
    const movements = [
      // Le presté a Pedro: su cuenta queda en positivo.
      mov({ type: 'adjust', amount: 50_000, accountId: 'pedro', direction: 'in' }),
      // Ana me prestó: queda en negativo.
      mov({ type: 'adjust', amount: 30_000, accountId: 'ana', direction: 'out' }),
      mov({ type: 'adjust', amount: 999, accountId: 'mia', direction: 'in' }),
    ]
    expect(debtSummary(accounts, movements)).toEqual({
      theyOweMe: 50_000,
      iOwe: 30_000,
      net: 20_000,
    })
  })
})

describe('periodTotals', () => {
  const from = at(2026, 7, 1, 0)
  const to = at(2026, 7, 31, 23)

  it('suma ingresos y gastos del rango', () => {
    const movements = [
      mov({ type: 'income', amount: 100, accountId: 'a', date: at(2026, 7, 5) }),
      mov({ type: 'expense', amount: 40, accountId: 'a', date: at(2026, 7, 6) }),
      mov({ type: 'expense', amount: 10, accountId: 'a', date: at(2026, 6, 30) }),
    ]
    expect(periodTotals(movements, from, to)).toEqual({ income: 100, expense: 40, net: 60, count: 2 })
  })

  it('las transferencias y los ajustes no cuentan como ingreso ni gasto', () => {
    const movements = [
      mov({ type: 'transfer', amount: 500, accountId: 'a', toAccountId: 'b', date: at(2026, 7, 5) }),
      mov({ type: 'adjust', amount: 900, accountId: 'a', direction: 'in', date: at(2026, 7, 5) }),
    ]
    expect(periodTotals(movements, from, to)).toEqual({ income: 0, expense: 0, net: 0, count: 0 })
  })

  it('incluye los bordes exactos del rango', () => {
    const movements = [
      mov({ type: 'expense', amount: 1, accountId: 'a', date: from }),
      mov({ type: 'expense', amount: 1, accountId: 'a', date: to }),
    ]
    expect(periodTotals(movements, from, to).expense).toBe(2)
  })
})

describe('categoryStats', () => {
  const from = at(2026, 7, 1, 0)
  const to = at(2026, 7, 31, 23)
  const categories = [cat('arriendo', 'expense'), cat('mercado', 'expense'), cat('sueldo', 'income')]

  it('agrupa por categoría y ordena de mayor a menor', () => {
    const movements = [
      mov({ type: 'expense', amount: 300, accountId: 'a', categoryId: 'mercado' }),
      mov({ type: 'expense', amount: 700, accountId: 'a', categoryId: 'arriendo' }),
      mov({ type: 'income', amount: 5000, accountId: 'a', categoryId: 'sueldo' }),
    ]
    const stats = categoryStats(movements, categories, from, to, 'expense')
    expect(stats.map((s) => s.categoryId)).toEqual(['arriendo', 'mercado'])
    expect(stats[0].total).toBe(700)
    expect(stats[0].percent).toBe(70)
    expect(stats[1].percent).toBe(30)
  })

  it('los porcentajes suman 100 aunque no den redondos', () => {
    const movements = [
      mov({ type: 'expense', amount: 1, accountId: 'a', categoryId: 'arriendo' }),
      mov({ type: 'expense', amount: 1, accountId: 'a', categoryId: 'mercado' }),
      mov({ type: 'expense', amount: 1, accountId: 'a', categoryId: 'otra' }),
    ]
    const stats = categoryStats(movements, categories, from, to, 'expense')
    expect(stats.reduce((sum, s) => sum + s.percent, 0)).toBe(100)
  })
})

describe('dailyTotals', () => {
  it('devuelve un dato por día, incluidos los días en cero', () => {
    const from = at(2026, 7, 1, 0)
    const to = at(2026, 7, 5, 23)
    const movements = [mov({ type: 'expense', amount: 100, accountId: 'a', date: at(2026, 7, 3) })]

    const days = dailyTotals(movements, from, to, 'expense')
    expect(days).toHaveLength(5)
    expect(days[2].total).toBe(100)
    expect(days[0].total).toBe(0)
  })
})

describe('balancesAfter', () => {
  it('deja el saldo con que quedó la cuenta tras cada movimiento', () => {
    const m1 = mov({ type: 'adjust', amount: 1000, accountId: 'a', direction: 'in', date: at(2026, 7, 1) })
    const m2 = mov({ type: 'expense', amount: 300, accountId: 'a', date: at(2026, 7, 2) })
    const m3 = mov({ type: 'transfer', amount: 200, accountId: 'a', toAccountId: 'b', date: at(2026, 7, 3) })

    const after = balancesAfter([m3, m1, m2]) // desordenados a propósito
    expect(after[m1.id].from).toBe(1000)
    expect(after[m2.id].from).toBe(700)
    expect(after[m3.id].from).toBe(500)
    expect(after[m3.id].to).toBe(200)
  })
})

describe('monthInsight', () => {
  const categories = [cat('arriendo', 'expense'), cat('mercado', 'expense')]

  it('proyecta el cierre al ritmo de los días transcurridos', () => {
    // 10 de julio: 10 días de 30 gastando 100 000 en total → 10 000/día → 310 000 al cierre.
    const now = at(2026, 7, 10, 18)
    const movements = [
      mov({ type: 'expense', amount: 100_000, accountId: 'a', categoryId: 'arriendo', date: at(2026, 7, 3) }),
    ]
    const ins = monthInsight(movements, categories, now, now)

    expect(ins.elapsedDays).toBe(10)
    expect(ins.totalDays).toBe(31)
    expect(ins.dailyAverage).toBe(10_000)
    expect(ins.projected).toBe(310_000)
    expect(ins.isCurrentMonth).toBe(true)
  })

  it('en un mes ya cerrado la proyección es el gasto real', () => {
    const now = at(2026, 7, 10)
    const movements = [
      mov({ type: 'expense', amount: 80_000, accountId: 'a', categoryId: 'arriendo', date: at(2026, 6, 5) }),
    ]
    const ins = monthInsight(movements, categories, at(2026, 6, 15), now)

    expect(ins.isCurrentMonth).toBe(false)
    expect(ins.projected).toBe(80_000)
    expect(ins.expense).toBe(80_000)
  })

  it('compara contra el mes anterior', () => {
    const now = at(2026, 7, 31, 23)
    const movements = [
      mov({ type: 'expense', amount: 200, accountId: 'a', categoryId: 'mercado', date: at(2026, 7, 5) }),
      mov({ type: 'expense', amount: 100, accountId: 'a', categoryId: 'mercado', date: at(2026, 6, 5) }),
    ]
    const ins = monthInsight(movements, categories, now, now)

    expect(ins.prevExpense).toBe(100)
    expect(ins.expenseChange).toBe(100) // gastó el doble
  })

  it('sin gasto el mes pasado, la variación es null y no infinito', () => {
    const now = at(2026, 7, 10)
    const movements = [
      mov({ type: 'expense', amount: 200, accountId: 'a', categoryId: 'mercado', date: at(2026, 7, 5) }),
    ]
    expect(monthInsight(movements, categories, now, now).expenseChange).toBeNull()
  })

  it('encuentra el día más caro', () => {
    const now = at(2026, 7, 20)
    const movements = [
      mov({ type: 'expense', amount: 100, accountId: 'a', date: at(2026, 7, 5) }),
      mov({ type: 'expense', amount: 400, accountId: 'a', date: at(2026, 7, 9) }),
      mov({ type: 'expense', amount: 300, accountId: 'a', date: at(2026, 7, 9) }),
    ]
    const ins = monthInsight(movements, categories, now, now)
    // El 9 acumula 700, más que el 5.
    expect(ins.worstDay?.total).toBe(700)
    expect(new Date(ins.worstDay!.ts).getDate()).toBe(9)
  })

  it('no divide por cero un mes recién empezado', () => {
    const now = at(2026, 7, 1, 0)
    const ins = monthInsight([], categories, now, now)
    expect(ins.elapsedDays).toBe(1)
    expect(Number.isFinite(ins.dailyAverage)).toBe(true)
    expect(ins.dailyAverage).toBe(0)
  })
})

describe('nextReminderDate', () => {
  const base = (freq: Reminder['freq'], nextDate: number): Reminder => ({
    id: 'r',
    name: 'Arriendo',
    emoji: '🏠',
    periodic: true,
    freq,
    nextDate,
    active: true,
    createdAt: 0,
  })

  it('avanza según la frecuencia', () => {
    expect(nextReminderDate(base('weekly', at(2026, 7, 1)))).toBe(at(2026, 7, 8))
    expect(nextReminderDate(base('biweekly', at(2026, 7, 1)))).toBe(at(2026, 7, 15))
    expect(nextReminderDate(base('monthly', at(2026, 7, 1)))).toBe(at(2026, 8, 1))
    expect(nextReminderDate(base('yearly', at(2026, 7, 1)))).toBe(at(2027, 7, 1))
  })

  it('el 31 mensual cae al último día del mes corto, no se salta a marzo', () => {
    const next = nextReminderDate(base('monthly', at(2026, 1, 31)))
    const d = new Date(next)
    expect(d.getMonth()).toBe(1) // febrero
    expect(d.getDate()).toBe(28)
  })
})
