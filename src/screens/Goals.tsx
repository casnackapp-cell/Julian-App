/**
 * Metas de ahorro, con progreso en VU meter.
 *
 * El progreso se lleva con abonos manuales y no se ata a una cuenta: Julián
 * puede estar juntando en efectivo, en el banco o repartido, y forzarlo a
 * elegir una sola cuenta le complicaría algo que debería ser simple.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Minus, Plus, Target, Trash2 } from 'lucide-react'

import { Money } from '../components/Money'
import { Sheet } from '../components/ui/Sheet'
import { ColorPicker, EmojiPicker } from '../components/ui/Pickers'
import { VuMeter } from '../components/charts/VuMeter'
import { useApp } from '../store/store'
import { palette } from '../config/brand'
import { formatAmountInput, parseAmount } from '../lib/money'
import { fromDateInput, toDateInput } from '../lib/date'
import { goalProgress } from '../data/selectors'
import type { SavingsGoal } from '../data/types'

export function Goals() {
  const navigate = useNavigate()
  const { goals } = useApp()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [contributing, setContributing] = useState<SavingsGoal | null>(null)

  const sorted = useMemo(
    () => [...goals].sort((a, b) => Number(a.done) - Number(b.done) || a.order - b.order),
    [goals],
  )

  return (
    <div className="screen screen--plain">
      <header className="screen-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-head__title">Metas</h1>
        <button
          className="icon-btn icon-btn--solid"
          onClick={() => {
            setEditing(null)
            setSheetOpen(true)
          }}
          aria-label="Nueva meta"
        >
          <Plus size={18} />
        </button>
      </header>

      {sorted.length === 0 ? (
        <div className="card">
          <div className="empty">
            <Target size={36} className="empty__art" />
            <h2 className="empty__title">¿Para qué estás juntando?</h2>
            <p className="empty__text">
              Ponle nombre, cuánto necesitas y para cuándo. Aquí ves cuánto te falta.
            </p>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                setEditing(null)
                setSheetOpen(true)
              }}
            >
              <Plus size={16} />
              Crear una meta
            </button>
          </div>
        </div>
      ) : (
        <div className="stack">
          {sorted.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => {
                setEditing(g)
                setSheetOpen(true)
              }}
              onContribute={() => setContributing(g)}
            />
          ))}
        </div>
      )}

      <GoalSheet open={sheetOpen} onClose={() => setSheetOpen(false)} editing={editing} />
      <ContributeSheet goal={contributing} onClose={() => setContributing(null)} />
    </div>
  )
}

function GoalCard({
  goal,
  onEdit,
  onContribute,
}: {
  goal: SavingsGoal
  onEdit: () => void
  onContribute: () => void
}) {
  const p = goalProgress(goal)

  return (
    <section className="card" style={goal.done ? { opacity: 0.72 } : undefined}>
      <button className="hstack" style={{ width: '100%' }} onClick={onEdit}>
        <span
          className="row__icon"
          style={{ background: `${goal.color}22`, borderColor: 'transparent' }}
          aria-hidden="true"
        >
          {goal.emoji}
        </span>
        <span className="row__main">
          <span className="row__title">{goal.name}</span>
          <span className="row__sub">
            {goal.done
              ? '¡Meta cumplida!'
              : p.daysLeft === null
                ? 'Sin fecha límite'
                : p.late
                  ? `Se pasó ${Math.abs(p.daysLeft)} días de la fecha`
                  : `Faltan ${p.daysLeft} días`}
          </span>
        </span>
        <span className="badge">{p.percent}%</span>
      </button>

      <div style={{ margin: '12px 0 10px' }}>
        <VuMeter ratio={p.ratio} color={goal.color} />
      </div>

      <div className="hstack small">
        <Money value={goal.saved} kind="income" size="sm" />
        <span className="faint">de</span>
        <Money value={goal.target} kind="muted" size="sm" />
        <span className="spacer" />
        {!goal.done && (
          <span className="faint">
            faltan <Money value={p.remaining} kind="muted" size="sm" />
          </span>
        )}
      </div>

      {!goal.done && p.perMonth !== null && (
        <p className="small faint" style={{ marginTop: 8 }}>
          Para llegar a tiempo tendrías que guardar{' '}
          <Money value={p.perMonth} kind="adjust" size="sm" /> al mes.
        </p>
      )}

      {!goal.done && (
        <button className="btn btn--sm btn--block btn--primary" style={{ marginTop: 12 }} onClick={onContribute}>
          <Plus size={15} />
          Abonar
        </button>
      )}
    </section>
  )
}

function GoalSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: SavingsGoal | null
}) {
  const { addGoal, updateGoal, deleteGoal } = useApp()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [color, setColor] = useState<string>(palette[0])
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setEmoji(editing.emoji)
      setColor(editing.color)
      setTarget(formatAmountInput(String(editing.target / 100).replace('.', ',')))
      setDeadline(editing.deadline ? toDateInput(editing.deadline) : '')
    } else {
      setName('')
      setEmoji('🎯')
      setColor(palette[Math.floor(Math.random() * palette.length)])
      setTarget('')
      setDeadline('')
    }
  }, [open, editing])

  function save() {
    const amount = parseAmount(target)
    if (!name.trim()) {
      setError('Ponle un nombre a la meta.')
      return
    }
    if (amount <= 0) {
      setError('¿Cuánto necesitas juntar?')
      return
    }

    const when = deadline ? fromDateInput(deadline) : undefined

    if (editing) {
      updateGoal({ ...editing, name: name.trim(), emoji, color, target: amount, deadline: when })
    } else {
      addGoal({ name, emoji, color, target: amount, deadline: when })
    }
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar meta' : 'Nueva meta'}
      footer={
        <button className="btn btn--primary btn--block" onClick={save}>
          {editing ? 'Guardar' : 'Crear meta'}
        </button>
      }
    >
      <div className="field">
        <span className="field__label">¿Para qué?</span>
        <input
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          placeholder="Moto, viaje, computador…"
          maxLength={40}
        />
      </div>

      <div className="field">
        <span className="field__label">¿Cuánto necesitas?</span>
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0"
          value={target}
          onChange={(e) => {
            setTarget(formatAmountInput(e.target.value))
            setError('')
          }}
        />
      </div>

      <div className="field">
        <span className="field__label">¿Para cuándo? (opcional)</span>
        <input
          className="input"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      <EmojiPicker value={emoji} onChange={setEmoji} />
      <ColorPicker value={color} onChange={setColor} />

      {error && (
        <p className="small" style={{ color: 'var(--expense)' }} role="alert">
          {error}
        </p>
      )}

      {editing && (
        <>
          <hr className="divider" />
          <button
            className="btn btn--danger btn--block"
            onClick={() => {
              deleteGoal(editing.id)
              onClose()
            }}
          >
            <Trash2 size={16} />
            Borrar meta
          </button>
        </>
      )}
    </Sheet>
  )
}

/** Abonar (o quitar) de una meta. */
function ContributeSheet({ goal, onClose }: { goal: SavingsGoal | null; onClose: () => void }) {
  const { contributeToGoal, updateGoal } = useApp()
  const [raw, setRaw] = useState('')
  const [sign, setSign] = useState<1 | -1>(1)

  useEffect(() => {
    if (goal) {
      setRaw('')
      setSign(1)
    }
  }, [goal])

  if (!goal) return null

  const amount = parseAmount(raw)
  const p = goalProgress(goal)

  return (
    <Sheet
      open={Boolean(goal)}
      onClose={onClose}
      title={goal.name}
      footer={
        <button
          className="btn btn--primary btn--block"
          disabled={amount <= 0}
          onClick={() => {
            contributeToGoal(goal.id, amount * sign)
            onClose()
          }}
        >
          {sign === 1 ? 'Abonar' : 'Quitar'}
        </button>
      }
    >
      <div className="segmented">
        <button
          className={`segmented__item${sign === 1 ? ' segmented__item--active' : ''}`}
          onClick={() => setSign(1)}
        >
          <Plus size={14} style={{ verticalAlign: -2 }} /> Abonar
        </button>
        <button
          className={`segmented__item${sign === -1 ? ' segmented__item--active' : ''}`}
          onClick={() => setSign(-1)}
        >
          <Minus size={14} style={{ verticalAlign: -2 }} /> Quitar
        </button>
      </div>

      <div className="field">
        <span className="field__label">Monto</span>
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0"
          value={raw}
          onChange={(e) => setRaw(formatAmountInput(e.target.value))}
        />
      </div>

      <div className="card card--tight card--quiet">
        <div className="hstack small">
          <span className="muted">Llevas</span>
          <span className="spacer" />
          <Money value={goal.saved} kind="income" size="sm" />
        </div>
        <div className="hstack small" style={{ marginTop: 6 }}>
          <span className="muted">Te falta</span>
          <span className="spacer" />
          <Money value={p.remaining} kind="muted" size="sm" />
        </div>
      </div>

      {/* Atajo cuando ya la cumplió pero el abono no cuadra al centavo. */}
      {!goal.done && p.remaining > 0 && (
        <button
          className="btn btn--ghost btn--block"
          onClick={() => {
            updateGoal({ ...goal, saved: goal.target, done: true })
            onClose()
          }}
        >
          <Check size={16} />
          Ya la cumplí, márcala completa
        </button>
      )}
    </Sheet>
  )
}
