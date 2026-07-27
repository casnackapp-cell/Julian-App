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

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRightLeft,
  Check,
  ChevronRight,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Sheet } from './ui/Sheet'
import { Money } from './Money'
import { useApp } from '../store/store'
import { palette } from '../config/brand'
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
  presetAmount?: number
  presetNote?: string
}

export function MovementSheet({
  open,
  onClose,
  editing,
  presetType,
  presetAccountId,
  presetAmount,
  presetNote,
}: MovementSheetProps) {
  const {
    accounts,
    categories,
    movements,
    addAccount,
    addCategory,
    addMovement,
    updateMovement,
    deleteMovement,
  } = useApp()
  const navigate = useNavigate()

  const [type, setType] = useState<MovementType | null>(null)
  const [raw, setRaw] = useState('')
  const [accountId, setAccountId] = useState<ID>('')
  const [toAccountId, setToAccountId] = useState<ID>('')
  const [categoryId, setCategoryId] = useState<ID>('')
  const [note, setNote] = useState('')
  const [when, setWhen] = useState<number>(() => Date.now())
  const [error, setError] = useState('')

  /** Qué se está creando al vuelo, sin salir de esta hoja. */
  const [creating, setCreating] = useState<'account' | 'toAccount' | 'category' | null>(null)
  const [draft, setDraft] = useState('')

  /** `true` mientras la hoja lleva abierta esta sesión: evita rearmar el formulario. */
  const armed = useRef(false)

  const openAccounts = useMemo(() => visibleAccounts(accounts), [accounts])
  const balances = useMemo(() => allBalances(movements), [movements])

  /**
   * El formulario se rearma SOLO al abrir la hoja, no cada vez que cambian las
   * cuentas o las categorías.
   *
   * Sin este control, crear una cuenta al vuelo desde aquí cambiaba la lista de
   * cuentas, el efecto se volvía a disparar y borraba todo lo que se llevaba
   * escrito, devolviendo al paso de "¿qué vas a registrar?".
   */
  useEffect(() => {
    if (!open) {
      armed.current = false
      return
    }
    if (armed.current) return
    armed.current = true

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
    // Al venir de un recordatorio de pago, el monto y el concepto llegan puestos.
    setRaw(presetAmount ? formatAmountInput(String(presetAmount / 100).replace('.', ',')) : '')
    setAccountId(presetAccountId ?? openAccounts[0]?.id ?? '')
    setToAccountId('')
    setCategoryId('')
    setNote(presetNote ?? '')
    setWhen(Date.now())
  }, [open, editing, presetType, presetAccountId, presetAmount, presetNote, openAccounts])

  const amount = parseAmount(raw)

  const catKind: 'income' | 'expense' | null =
    type === 'income' ? 'income' : type === 'expense' ? 'expense' : null

  const availableCategories = useMemo(
    () => (catKind ? frequentCategories(movements, categories, catKind) : []),
    [catKind, movements, categories],
  )

  const currentBalance = accountId ? (balances[accountId] ?? 0) : 0

  /* ---------------------------------------------------------------------------
     Crear cuenta o categoría sin salir del registro.
     Se crean con lo mínimo (nombre + un color al azar) porque el objetivo aquí
     es no interrumpir: el emoji, el color y el saldo se ajustan después desde
     Cuentas o Categorías, si es que hace falta.
     --------------------------------------------------------------------------- */

  function startCreate(what: 'account' | 'toAccount' | 'category') {
    setCreating(what)
    setDraft('')
    setError('')
  }

  function cancelCreate() {
    setCreating(null)
    setDraft('')
  }

  function confirmCreate() {
    const name = draft.trim()
    if (!name) return

    const color = palette[Math.floor(Math.random() * palette.length)]

    if (creating === 'category') {
      if (!catKind) return
      const created = addCategory({ name, emoji: '📌', color, kind: catKind })
      setCategoryId(created.id)
    } else {
      const created = addAccount({ name, emoji: '💵', color })
      if (creating === 'toAccount') setToAccountId(created.id)
      else setAccountId(created.id)
    }

    cancelCreate()
  }

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

      {/* Cuenta. Fichas y no un desplegable: el menú nativo se abre donde quiere
          y además así se crea una cuenta nueva sin salir de aquí. */}
      <div className="field">
        <span className="field__label">{type === 'transfer' ? 'Sale de' : 'Cuenta'}</span>
        <PickerRow
          options={openAccounts.map((a) => ({ id: a.id, emoji: a.emoji, name: a.name }))}
          selected={accountId}
          onSelect={(id) => {
            setAccountId(id)
            setError('')
          }}
          creating={creating === 'account'}
          onStartCreate={() => startCreate('account')}
          onCancelCreate={cancelCreate}
          onConfirmCreate={confirmCreate}
          draft={draft}
          onDraft={setDraft}
          newLabel="Nueva cuenta"
          placeholder="Efectivo, Nequi, Bancolombia…"
        />
      </div>

      {/* Cuenta destino */}
      {type === 'transfer' && (
        <div className="field">
          <span className="field__label">Entra a</span>
          <PickerRow
            options={openAccounts
              .filter((a) => a.id !== accountId)
              .map((a) => ({ id: a.id, emoji: a.emoji, name: a.name }))}
            selected={toAccountId}
            onSelect={(id) => {
              setToAccountId(id)
              setError('')
            }}
            creating={creating === 'toAccount'}
            onStartCreate={() => startCreate('toAccount')}
            onCancelCreate={cancelCreate}
            onConfirmCreate={confirmCreate}
            draft={draft}
            onDraft={setDraft}
            newLabel="Nueva cuenta"
            placeholder="Nombre de la cuenta"
          />
        </div>
      )}

      {/* Categoría: solo las del tipo que toca */}
      {catKind && (
        <div className="field">
          <span className="field__label">Categoría</span>
          <PickerRow
            options={availableCategories.map((c) => ({ id: c.id, emoji: c.emoji, name: c.name }))}
            selected={categoryId}
            onSelect={(id) => {
              setCategoryId(id)
              setError('')
            }}
            creating={creating === 'category'}
            onStartCreate={() => startCreate('category')}
            onCancelCreate={cancelCreate}
            onConfirmCreate={confirmCreate}
            draft={draft}
            onDraft={setDraft}
            newLabel={`Nueva categoría de ${catKind === 'income' ? 'ingreso' : 'gasto'}`}
            placeholder={catKind === 'income' ? 'Sueldo, Extras…' : 'Mercado, Gasolina…'}
          />
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

/**
 * Fila de fichas para elegir cuenta o categoría, con una ficha final para crear
 * una nueva sin salir del registro.
 *
 * Es lo que hace que registrar un gasto en un sitio nuevo no obligue a
 * abandonar lo que se estaba escribiendo, ir a otra pantalla, crear la cuenta y
 * volver a empezar.
 */
function PickerRow({
  options,
  selected,
  onSelect,
  creating,
  onStartCreate,
  onCancelCreate,
  onConfirmCreate,
  draft,
  onDraft,
  newLabel,
  placeholder,
}: {
  options: Array<{ id: string; emoji: string; name: string }>
  selected: string
  onSelect: (id: string) => void
  creating: boolean
  onStartCreate: () => void
  onCancelCreate: () => void
  onConfirmCreate: () => void
  draft: string
  onDraft: (v: string) => void
  newLabel: string
  placeholder: string
}) {
  if (creating) {
    return (
      <div className="hstack">
        <input
          className="input"
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter confirma y Escape cancela: se crea sin levantar el pulgar
            // del teclado, que es de lo que se trata.
            if (e.key === 'Enter') {
              e.preventDefault()
              onConfirmCreate()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              onCancelCreate()
            }
          }}
          placeholder={placeholder}
          maxLength={40}
          autoFocus
        />
        <button
          className="icon-btn icon-btn--solid"
          onClick={onConfirmCreate}
          disabled={!draft.trim()}
          aria-label="Crear"
          style={!draft.trim() ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
        >
          <Check size={17} />
        </button>
        <button className="icon-btn" onClick={onCancelCreate} aria-label="Cancelar">
          <X size={17} />
        </button>
      </div>
    )
  }

  return (
    <div className="chip-row" style={{ flexWrap: 'wrap', overflowX: 'visible' }}>
      {options.map((o) => (
        <button
          key={o.id}
          className={`chip${selected === o.id ? ' chip--active' : ''}`}
          onClick={() => onSelect(o.id)}
          aria-pressed={selected === o.id}
        >
          <span aria-hidden="true">{o.emoji}</span>
          {o.name}
        </button>
      ))}

      <button
        className="chip"
        onClick={onStartCreate}
        style={{ borderStyle: 'dashed', color: 'var(--primary)' }}
      >
        <Plus size={14} />
        {options.length === 0 ? newLabel : 'Nueva'}
      </button>
    </div>
  )
}
