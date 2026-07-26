/**
 * Registrar o editar un movimiento. La pantalla más usada de la app.
 *
 * Va en dos pasos, como pidió el cliente: primero qué tipo es, después el
 * formulario. El paso 1 se salta cuando se entra con un tipo ya elegido.
 *
 * Detalle importante en el ajuste de saldo: al crear no se pregunta "cuánto
 * ajusto" (que obliga a hacer una resta mental) sino "cuánto tienes de verdad".
 * La app calcula la diferencia. Es la forma de poner el saldo inicial sin que
 * Julián sepa que existe el concepto de "movimiento de ajuste".
 */

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRightLeft,
  ChevronRight,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Sheet } from './ui/Sheet'
import { Money } from './Money'
import { useApp } from '../store/store'
import { formatAmountInput, parseAmount } from '../lib/money'
import { fromDateInput, toDateTimeInput } from '../lib/date'
import { allBalances, frequentCategories, visibleAccounts } from '../data/selectors'
import type { ID, Movement, MovementType } from '../data/types'

const TYPES: Array<{
  type: MovementType
  label: string
  hint: string
  icon: typeof TrendingDown
  /** Color del icono en el selector. */
  tint: string
  /** Clase del botón de guardar, para que el color acompañe al tipo elegido. */
  className: string
}> = [
  {
    type: 'expense',
    label: 'Gasto',
    hint: 'Plata que salió',
    icon: TrendingDown,
    tint: 'var(--expense)',
    className: 'btn--expense',
  },
  {
    type: 'income',
    label: 'Ingreso',
    hint: 'Plata que entró',
    icon: TrendingUp,
    tint: 'var(--income)',
    className: 'btn--income',
  },
  {
    type: 'transfer',
    label: 'Transferencia',
    hint: 'De una cuenta a otra',
    icon: ArrowRightLeft,
    tint: 'var(--transfer)',
    className: 'btn--transfer',
  },
  {
    type: 'adjust',
    label: 'Corregir saldo',
    hint: 'Cuadrar una cuenta',
    icon: Scale,
    tint: 'var(--adjust)',
    className: '',
  },
]

interface MovementSheetProps {
  open: boolean
  onClose: () => void
  editing: Movement | null
  presetType?: MovementType
  presetAccountId?: ID
}

export function MovementSheet({
  open,
  onClose,
  editing,
  presetType,
  presetAccountId,
}: MovementSheetProps) {
  const { accounts, categories, movements, addMovement, updateMovement, deleteMovement } = useApp()
  const navigate = useNavigate()

  const [type, setType] = useState<MovementType | null>(null)
  const [raw, setRaw] = useState('')
  const [accountId, setAccountId] = useState<ID>('')
  const [toAccountId, setToAccountId] = useState<ID>('')
  const [categoryId, setCategoryId] = useState<ID>('')
  const [note, setNote] = useState('')
  const [when, setWhen] = useState<number>(() => Date.now())
  const [error, setError] = useState('')

  const openAccounts = useMemo(() => visibleAccounts(accounts), [accounts])
  const balances = useMemo(() => allBalances(movements), [movements])

  /* Cada vez que se abre, el formulario se rearma desde cero. */
  useEffect(() => {
    if (!open) return
    setError('')

    if (editing) {
      setType(editing.type)
      // Al editar sí se muestra el monto crudo: el usuario ve el número que guardó.
      setRaw(formatAmountInput(String(editing.amount / 100).replace('.', ',')))
      setAccountId(editing.accountId)
      setToAccountId(editing.toAccountId ?? '')
      setCategoryId(editing.categoryId ?? '')
      setNote(editing.note ?? '')
      setWhen(editing.date)
      return
    }

    setType(presetType ?? null)
    setRaw('')
    setAccountId(presetAccountId ?? openAccounts[0]?.id ?? '')
    setToAccountId('')
    setCategoryId('')
    setNote('')
    setWhen(Date.now())
  }, [open, editing, presetType, presetAccountId, openAccounts])

  const amount = parseAmount(raw)

  const catKind: 'income' | 'expense' | null =
    type === 'income' ? 'income' : type === 'expense' ? 'expense' : null

  const availableCategories = useMemo(
    () => (catKind ? frequentCategories(movements, categories, catKind) : []),
    [catKind, movements, categories],
  )

  const currentBalance = accountId ? (balances[accountId] ?? 0) : 0

  /** Para el ajuste: el monto tecleado es el saldo real, no la diferencia. */
  const adjustDelta = amount - currentBalance

  /* --- Sin cuentas no se puede registrar nada --- */
  if (open && openAccounts.length === 0) {
    return (
      <Sheet open={open} onClose={onClose} title="Primero, una cuenta">
        <div className="empty">
          <p className="empty__text">
            Para registrar un movimiento necesitas al menos una cuenta: el lugar donde tienes la
            plata (efectivo, Nequi, el banco…).
          </p>
          <button
            className="btn btn--primary"
            onClick={() => {
              onClose()
              navigate('/cuentas')
            }}
          >
            <Plus size={17} />
            Crear una cuenta
          </button>
        </div>
      </Sheet>
    )
  }

  /* --- Paso 1: qué tipo de movimiento --- */
  if (open && !type) {
    return (
      <Sheet open={open} onClose={onClose} title="¿Qué vas a registrar?">
        <div className="stack--sm" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TYPES.map(({ type: t, label, hint, icon: Icon, tint }) => (
            <button key={t} className="row" onClick={() => setType(t)}>
              <span className="row__icon" style={{ color: tint }}>
                <Icon size={19} />
              </span>
              <span className="row__main">
                <span className="row__title">{label}</span>
                <span className="row__sub">{hint}</span>
              </span>
              <ChevronRight size={17} className="faint" />
            </button>
          ))}
        </div>
      </Sheet>
    )
  }

  const meta = TYPES.find((t) => t.type === type)

  function validate(): string {
    if (!accountId) return 'Elige una cuenta.'

    if (type === 'adjust') {
      if (!raw.trim()) return 'Escribe cuánto tienes de verdad en la cuenta.'
      if (adjustDelta === 0) return 'Ese ya es el saldo de la cuenta. No hay nada que corregir.'
      return ''
    }

    if (amount <= 0) return 'El monto tiene que ser mayor que cero.'

    if (type === 'transfer') {
      if (!toAccountId) return 'Elige la cuenta de destino.'
      if (toAccountId === accountId) return 'La cuenta de origen y la de destino no pueden ser la misma.'
    }

    if ((type === 'income' || type === 'expense') && !categoryId) {
      return 'Elige una categoría.'
    }

    return ''
  }

  function save() {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    if (!type) return

    if (editing) {
      updateMovement({
        ...editing,
        type,
        amount: type === 'adjust' ? Math.abs(amount) : amount,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        categoryId: type === 'income' || type === 'expense' ? categoryId : undefined,
        note: note.trim() || undefined,
        direction: type === 'adjust' ? editing.direction : undefined,
        date: when,
      })
    } else {
      addMovement({
        type,
        // En un ajuste nuevo se guarda la diferencia, no el saldo tecleado.
        amount: type === 'adjust' ? Math.abs(adjustDelta) : amount,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        categoryId: type === 'income' || type === 'expense' ? categoryId : undefined,
        note: note.trim() || undefined,
        direction: type === 'adjust' ? (adjustDelta > 0 ? 'in' : 'out') : undefined,
        date: when,
      })
    }

    onClose()
  }

  function remove() {
    if (!editing) return
    deleteMovement(editing.id)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? `Editar ${meta?.label.toLowerCase()}` : meta?.label}
      headerAction={
        editing ? (
          <button className="icon-btn" onClick={remove} aria-label="Borrar movimiento">
            <Trash2 size={18} color="var(--expense)" />
          </button>
        ) : undefined
      }
      footer={
        <>
          {!editing && !presetType && (
            <button className="btn btn--ghost" onClick={() => setType(null)}>
              Atrás
            </button>
          )}
          <button className={`btn btn--primary btn--block ${meta?.className ?? ''}`} onClick={save}>
            {editing ? 'Guardar cambios' : 'Registrar'}
          </button>
        </>
      }
    >
      {/* Monto */}
      <div className="field">
        <span className="field__label">
          {type === 'adjust' ? '¿Cuánto tienes de verdad?' : 'Monto'}
        </span>
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0"
          value={raw}
          onChange={(e) => {
            setRaw(formatAmountInput(e.target.value))
            setError('')
          }}
          aria-label="Monto"
        />
      </div>

      {/* En un ajuste se muestra la cuenta antes y después: nada de magia invisible. */}
      {type === 'adjust' && accountId && (
        <div className="card card--tight card--quiet">
          <div className="hstack small">
            <span className="muted">Saldo guardado</span>
            <span className="spacer" />
            <Money value={currentBalance} kind="muted" hidden={false} />
          </div>
          {raw.trim() !== '' && adjustDelta !== 0 && (
            <div className="hstack small" style={{ marginTop: 6 }}>
              <span className="muted">Se {adjustDelta > 0 ? 'suma' : 'resta'}</span>
              <span className="spacer" />
              <Money
                value={adjustDelta}
                kind={adjustDelta > 0 ? 'income' : 'expense'}
                sign
                hidden={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Cuenta */}
      <div className="field">
        <span className="field__label">{type === 'transfer' ? 'Sale de' : 'Cuenta'}</span>
        <select
          className="select"
          value={accountId}
          onChange={(e) => {
            setAccountId(e.target.value)
            setError('')
          }}
        >
          {openAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.emoji} {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cuenta destino */}
      {type === 'transfer' && (
        <div className="field">
          <span className="field__label">Entra a</span>
          <select
            className="select"
            value={toAccountId}
            onChange={(e) => {
              setToAccountId(e.target.value)
              setError('')
            }}
          >
            <option value="">Elige una cuenta…</option>
            {openAccounts
              .filter((a) => a.id !== accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Categoría: solo las del tipo que toca */}
      {catKind && (
        <div className="field">
          <span className="field__label">Categoría</span>
          {availableCategories.length === 0 ? (
            <button
              className="btn btn--ghost btn--block"
              onClick={() => {
                onClose()
                navigate('/categorias')
              }}
            >
              <Plus size={16} />
              No tienes categorías de {catKind === 'income' ? 'ingreso' : 'gasto'}. Crear una
            </button>
          ) : (
            <div className="chip-row" style={{ flexWrap: 'wrap', overflowX: 'visible' }}>
              {availableCategories.map((c) => (
                <button
                  key={c.id}
                  className={`chip${categoryId === c.id ? ' chip--active' : ''}`}
                  onClick={() => {
                    setCategoryId(c.id)
                    setError('')
                  }}
                  aria-pressed={categoryId === c.id}
                >
                  <span aria-hidden="true">{c.emoji}</span>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nota */}
      <div className="field">
        <span className="field__label">Nota (opcional)</span>
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="¿En qué fue?"
          maxLength={120}
        />
      </div>

      {/* Fecha */}
      <div className="field">
        <span className="field__label">Cuándo</span>
        <input
          className="input"
          type="datetime-local"
          value={toDateTimeInput(when)}
          onChange={(e) => setWhen(fromDateInput(e.target.value, when))}
        />
      </div>

      {error && (
        <p className="small" style={{ color: 'var(--expense)', paddingLeft: 2 }} role="alert">
          {error}
        </p>
      )}
    </Sheet>
  )
}
