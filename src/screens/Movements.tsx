/**
 * Historial completo, agrupado por día y con filtros.
 *
 * Cada fila abre la misma hoja de edición: si Julián se equivocó en un monto,
 * lo corrige donde lo ve, sin buscar un menú escondido.
 */

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

import { Money } from '../components/Money'
import { MovementRow } from '../components/MovementRow'
import { useApp } from '../store/store'
import { useSheets } from '../components/SheetsContext'
import { relativeDay } from '../lib/date'
import { groupByDay, visibleAccounts } from '../data/selectors'
import type { MovementType } from '../data/types'

const TYPE_FILTERS: Array<{ value: MovementType | 'all'; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'transfer', label: 'Transferencias' },
  { value: 'adjust', label: 'Ajustes' },
]

export function Movements() {
  const { accounts, categories, movements } = useApp()
  const { editMovement } = useSheets()

  const [type, setType] = useState<MovementType | 'all'>('all')
  const [accountId, setAccountId] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const open = useMemo(() => visibleAccounts(accounts), [accounts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return movements.filter((m) => {
      if (type !== 'all' && m.type !== type) return false
      if (accountId !== 'all' && m.accountId !== accountId && m.toAccountId !== accountId) {
        return false
      }
      if (!q) return true

      // Se busca por nota, categoría y cuenta: los tres sitios donde Julián
      // recordaría haber escrito algo.
      const category = m.categoryId ? categoryMap.get(m.categoryId)?.name : ''
      const account = accountMap.get(m.accountId)?.name ?? ''
      return `${m.note ?? ''} ${category ?? ''} ${account}`.toLowerCase().includes(q)
    })
  }, [movements, type, accountId, query, categoryMap, accountMap])

  const groups = useMemo(() => groupByDay(filtered), [filtered])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const m of filtered) {
      if (m.type === 'income') income += m.amount
      else if (m.type === 'expense') expense += m.amount
    }
    return { income, expense }
  }, [filtered])

  const hasActiveFilter = type !== 'all' || accountId !== 'all' || query.trim() !== ''

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="screen-head__title">Movimientos</h1>
        <button
          className={`icon-btn icon-btn--solid${hasActiveFilter ? ' nav__item--active' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Filtros"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={17} />
        </button>
      </header>

      {showFilters && (
        <div className="card stack--sm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <span className="field__label">Buscar</span>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-faint)',
                  pointerEvents: 'none',
                }}
              />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nota, categoría o cuenta"
              />
            </div>
          </div>

          <div className="field">
            <span className="field__label">Tipo</span>
            <div className="chip-row" style={{ flexWrap: 'wrap' }}>
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`chip${type === f.value ? ' chip--active' : ''}`}
                  onClick={() => setType(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {open.length > 1 && (
            <div className="field">
              <span className="field__label">Cuenta</span>
              <select
                className="select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="all">Todas las cuentas</option>
                {open.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasActiveFilter && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setType('all')
                setAccountId('all')
                setQuery('')
              }}
            >
              <X size={15} />
              Quitar filtros
            </button>
          )}
        </div>
      )}

      {/* Totales de lo que se está viendo, no del mes: si hay filtro, cuadra con la lista. */}
      {filtered.length > 0 && (
        <div className="card card--tight card--quiet">
          <div className="hstack small">
            <span className="muted">
              {filtered.length} {filtered.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
            <span className="spacer" />
            <Money value={totals.income} kind="income" sign size="sm" />
            <Money value={-totals.expense} kind="expense" size="sm" />
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="card">
          <div className="empty">
            <h2 className="empty__title">
              {hasActiveFilter ? 'Nada con esos filtros' : 'Sin movimientos todavía'}
            </h2>
            <p className="empty__text">
              {hasActiveFilter
                ? 'Prueba quitando algún filtro.'
                : 'Toca el + de abajo para registrar el primero.'}
            </p>
          </div>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.day}>
            <div className="day-sep">
              <span>{relativeDay(g.ts)}</span>
              <DayTotal items={g.items} />
            </div>
            <div className="list">
              {g.items.map((m) => (
                <MovementRow
                  key={m.id}
                  movement={m}
                  accounts={accountMap}
                  categories={categoryMap}
                  onClick={() => editMovement(m)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

/** Neto del día en la cabecera. Solo aparece si ese día hubo gasto o ingreso. */
function DayTotal({ items }: { items: Array<{ type: string; amount: number }> }) {
  let net = 0
  let counted = false

  for (const m of items) {
    if (m.type === 'income') {
      net += m.amount
      counted = true
    } else if (m.type === 'expense') {
      net -= m.amount
      counted = true
    }
  }

  if (!counted) return null
  return <Money value={net} kind="auto" sign size="sm" />
}
