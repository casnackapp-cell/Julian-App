/**
 * Pagos del mes: calendario + lista de recordatorios.
 *
 * Resuelve el segundo problema de Julián ("se me olvidan pagos y me llegan
 * recargos"). El calendario da la foto del mes de un vistazo; la lista permite
 * confirmar cada pago.
 *
 * Nada se registra solo. Cuando confirma un pago con monto y cuenta, la app
 * crea el gasto — y lo dice antes de hacerlo.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Plus, Trash2 } from 'lucide-react'

import { Money } from '../components/Money'
import { Sheet } from '../components/ui/Sheet'
import { EmojiPicker } from '../components/ui/Pickers'
import { useApp } from '../store/store'
import { formatAmountInput, parseAmount } from '../lib/money'
import {
  addMonths,
  dayKey,
  endOfMonth,
  fromDateInput,
  monthLabel,
  relativeDay,
  startOfMonth,
  toDateInput,
} from '../lib/date'
import {
  activeReminders,
  categoriesOf,
  remindersByDay,
  remindersTotal,
  reminderUrgency,
  visibleAccounts,
} from '../data/selectors'
import type { Reminder, ReminderFreq } from '../data/types'

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const FREQS: Array<{ value: ReminderFreq; label: string }> = [
  { value: 'weekly', label: 'Cada semana' },
  { value: 'biweekly', label: 'Cada 15 días' },
  { value: 'monthly', label: 'Cada mes' },
  { value: 'bimonthly', label: 'Cada 2 meses' },
  { value: 'yearly', label: 'Cada año' },
]

export function Payments() {
  const navigate = useNavigate()
  const { reminders, accounts, markReminderPaid, snoozeReminder } = useApp()

  const [offset, setOffset] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)

  const anchor = useMemo(() => addMonths(Date.now(), offset), [offset])
  const from = startOfMonth(anchor)
  const to = endOfMonth(anchor)

  const byDay = useMemo(() => remindersByDay(reminders, from, to), [reminders, from, to])
  const monthTotal = useMemo(() => remindersTotal(reminders, from, to), [reminders, from, to])
  const upcoming = useMemo(() => activeReminders(reminders), [reminders])

  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name

  /** Casillas del calendario, con los huecos del principio para cuadrar los días. */
  const cells = useMemo(() => {
    const first = new Date(from)
    // getDay() da 0 para domingo; la semana arranca en lunes.
    const lead = (first.getDay() + 6) % 7
    const total = new Date(to).getDate()

    const out: Array<{ key: string; day: number | null; ts: number }> = []
    for (let i = 0; i < lead; i++) out.push({ key: `pad${i}`, day: null, ts: 0 })
    for (let d = 1; d <= total; d++) {
      const ts = new Date(first.getFullYear(), first.getMonth(), d).getTime()
      out.push({ key: dayKey(ts), day: d, ts })
    }
    return out
  }, [from, to])

  const todayKey = dayKey()

  return (
    <div className="screen screen--plain">
      <header className="screen-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-head__title">Pagos</h1>
        <button
          className="icon-btn icon-btn--solid"
          onClick={() => {
            setEditing(null)
            setSheetOpen(true)
          }}
          aria-label="Nuevo pago"
        >
          <Plus size={18} />
        </button>
      </header>

      {/* Calendario */}
      <section className="card">
        <div className="hstack" style={{ marginBottom: 12 }}>
          <button className="icon-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Mes anterior">
            <ArrowLeft size={17} />
          </button>
          <span
            className="strong"
            style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}
          >
            {monthLabel(anchor)}
          </span>
          <button
            className="icon-btn"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Mes siguiente"
            style={{ transform: 'rotate(180deg)' }}
          >
            <ArrowLeft size={17} />
          </button>
        </div>

        <div className="cal">
          {DOW.map((d, i) => (
            <span key={`${d}${i}`} className="cal__dow">
              {d}
            </span>
          ))}

          {cells.map((c) => {
            if (c.day === null) return <span key={c.key} />

            const items = byDay.get(c.key) ?? []
            const isToday = c.key === todayKey
            const overdue = items.some((r) => reminderUrgency(r) === 'overdue')

            return (
              <div
                key={c.key}
                className={[
                  'cal__day',
                  isToday ? 'cal__day--today' : '',
                  items.length > 0 ? 'cal__day--has' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={items.map((r) => r.name).join(', ')}
              >
                {c.day}
                {items.length > 0 && (
                  <span className={`cal__dot${overdue ? ' cal__dot--overdue' : ''}`} />
                )}
              </div>
            )
          })}
        </div>

        {monthTotal > 0 && (
          <div className="hstack small" style={{ marginTop: 12 }}>
            <span className="muted">Comprometido en {monthLabel(anchor)}</span>
            <span className="spacer" />
            <Money value={monthTotal} kind="expense" size="sm" />
          </div>
        )}
      </section>

      {/* Lista */}
      <div className="section-head">
        <span className="section-head__title">Próximos</span>
      </div>

      {upcoming.length === 0 ? (
        <div className="card">
          <div className="empty">
            <h2 className="empty__title">Sin pagos programados</h2>
            <p className="empty__text">
              Anota el arriendo, los servicios o las cuotas y te aviso antes de que se venzan.
            </p>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                setEditing(null)
                setSheetOpen(true)
              }}
            >
              <Plus size={16} />
              Programar un pago
            </button>
          </div>
        </div>
      ) : (
        <div className="list">
          {upcoming.map((r) => {
            const urgency = reminderUrgency(r)
            const actionable = urgency !== 'later'

            return (
              <div key={r.id} className="card card--tight">
                <button
                  className="hstack"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setEditing(r)
                    setSheetOpen(true)
                  }}
                >
                  <span className="row__icon" aria-hidden="true">
                    {r.emoji}
                  </span>
                  <span className="row__main">
                    <span className="row__title">{r.name}</span>
                    <span className="row__sub">
                      {[
                        urgency === 'overdue' ? 'Vencido' : relativeDay(r.nextDate),
                        r.periodic ? FREQS.find((f) => f.value === r.freq)?.label : 'Una sola vez',
                        accountName(r.accountId),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  {r.amount ? <Money value={r.amount} kind="expense" /> : null}
                </button>

                {/* Los botones solo aparecen cuando el pago está cerca o vencido.
                    En los lejanos serían ruido. */}
                {actionable && (
                  <div className="hstack" style={{ marginTop: 10, gap: 8 }}>
                    <button
                      className="btn btn--sm btn--primary"
                      style={{ flex: 1 }}
                      onClick={() => markReminderPaid(r.id, Boolean(r.amount && r.accountId))}
                    >
                      <Check size={15} />
                      Ya lo pagué
                    </button>
                    <button
                      className="btn btn--sm btn--ghost"
                      style={{ flex: 1 }}
                      onClick={() => snoozeReminder(r.id, 1)}
                    >
                      <Clock size={15} />
                      Mañana
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ReminderSheet open={sheetOpen} onClose={() => setSheetOpen(false)} editing={editing} />
    </div>
  )
}

function ReminderSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Reminder | null
}) {
  const { accounts, categories, addReminder, updateReminder, deleteReminder } = useApp()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🔔')
  const [amountRaw, setAmountRaw] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [periodic, setPeriodic] = useState(true)
  const [freq, setFreq] = useState<ReminderFreq>('monthly')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  const open_ = useMemo(() => visibleAccounts(accounts), [accounts])
  const expenseCats = useMemo(() => categoriesOf(categories, 'expense'), [categories])

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setEmoji(editing.emoji)
      setAmountRaw(
        editing.amount ? formatAmountInput(String(editing.amount / 100).replace('.', ',')) : '',
      )
      setAccountId(editing.accountId ?? '')
      setCategoryId(editing.categoryId ?? '')
      setPeriodic(editing.periodic)
      setFreq(editing.freq ?? 'monthly')
      setDate(toDateInput(editing.nextDate))
    } else {
      setName('')
      setEmoji('🔔')
      setAmountRaw('')
      setAccountId('')
      setCategoryId('')
      setPeriodic(true)
      setFreq('monthly')
      setDate(toDateInput(Date.now()))
    }
  }, [open, editing])

  function save() {
    if (!name.trim()) {
      setError('¿Qué pago es?')
      return
    }
    if (!date) {
      setError('¿Para cuándo?')
      return
    }

    const amount = parseAmount(amountRaw)
    const nextDate = fromDateInput(date)

    if (editing) {
      updateReminder({
        ...editing,
        name: name.trim(),
        emoji,
        amount: amount > 0 ? amount : undefined,
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        periodic,
        freq: periodic ? freq : undefined,
        nextDate,
      })
    } else {
      addReminder({
        name,
        emoji,
        amount: amount > 0 ? amount : undefined,
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        periodic,
        freq,
        nextDate,
      })
    }
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar pago' : 'Programar un pago'}
      footer={
        <button className="btn btn--primary btn--block" onClick={save}>
          {editing ? 'Guardar' : 'Programar'}
        </button>
      }
    >
      <div className="field">
        <span className="field__label">¿Qué pago es?</span>
        <input
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          placeholder="Arriendo, luz, internet…"
          maxLength={40}
        />
      </div>

      <div className="field">
        <span className="field__label">Monto (opcional)</span>
        <input
          className="input"
          inputMode="decimal"
          value={amountRaw}
          onChange={(e) => setAmountRaw(formatAmountInput(e.target.value))}
          placeholder="Déjalo vacío si cambia cada mes"
        />
      </div>

      <div className="field">
        <span className="field__label">¿Cuándo se vence?</span>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setError('')
          }}
        />
      </div>

      <div className="field">
        <span className="field__label">¿Se repite?</span>
        <div className="segmented">
          <button
            className={`segmented__item${periodic ? ' segmented__item--active' : ''}`}
            onClick={() => setPeriodic(true)}
          >
            Sí
          </button>
          <button
            className={`segmented__item${!periodic ? ' segmented__item--active' : ''}`}
            onClick={() => setPeriodic(false)}
          >
            Una sola vez
          </button>
        </div>
      </div>

      {periodic && (
        <div className="field">
          <span className="field__label">Cada cuánto</span>
          <select
            className="select"
            value={freq}
            onChange={(e) => setFreq(e.target.value as ReminderFreq)}
          >
            {FREQS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {open_.length > 0 && (
        <div className="field">
          <span className="field__label">¿De qué cuenta sale? (opcional)</span>
          <select
            className="select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">No registrar el gasto automáticamente</option>
            {open_.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {a.name}
              </option>
            ))}
          </select>
          <p className="small faint" style={{ paddingLeft: 2 }}>
            Si eliges una cuenta y pones monto, al confirmar el pago se registra el gasto solo.
          </p>
        </div>
      )}

      {accountId && expenseCats.length > 0 && (
        <div className="field">
          <span className="field__label">Categoría del gasto</span>
          <select
            className="select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Sin categoría</option>
            {expenseCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <EmojiPicker value={emoji} onChange={setEmoji} />

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
              deleteReminder(editing.id)
              onClose()
            }}
          >
            <Trash2 size={16} />
            Borrar pago
          </button>
        </>
      )}
    </Sheet>
  )
}
