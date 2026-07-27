/**
 * Aviso de pagos que se vencen, al abrir la app.
 *
 * Es la pieza que sostiene el hábito: sin mascota ni racha, esto es lo único que
 * hace que Julián vuelva. Por eso interrumpe de verdad (hoja modal) en vez de
 * ser una tarjeta más entre otras que se pasa de largo.
 *
 * Aparece una vez al día como máximo, para no volverse ruido.
 */

import { useEffect, useState } from 'react'
import { Check, Clock, Wallet } from 'lucide-react'

import { Sheet } from './ui/Sheet'
import { Money } from './Money'
import { useApp } from '../store/store'
import { useSheets } from './SheetsContext'
import { dayKey, relativeDay } from '../lib/date'
import { dueReminders, reminderUrgency } from '../data/selectors'

const SEEN_KEY = 'julian.duePopup.lastSeen'

export function PaymentsDuePopup() {
  const { reminders, loading, markReminderPaid, snoozeReminder } = useApp()
  const { openMovement } = useSheets()
  const [open, setOpen] = useState(false)

  const due = dueReminders(reminders)

  useEffect(() => {
    if (loading || due.length === 0) return

    let lastSeen: string | null = null
    try {
      lastSeen = localStorage.getItem(SEEN_KEY)
    } catch {
      // Modo privado sin almacenamiento: se muestra el aviso igual.
    }

    if (lastSeen === dayKey()) return

    // Un respiro antes de interrumpir, para que la pantalla ya esté dibujada.
    const id = window.setTimeout(() => setOpen(true), 550)
    return () => window.clearTimeout(id)
  }, [loading, due.length])

  function close() {
    setOpen(false)
    try {
      localStorage.setItem(SEEN_KEY, dayKey())
    } catch {
      // Sin almacenamiento el aviso volverá a salir. Es el fallo correcto:
      // más vale recordar de más que dejar pasar un pago.
    }
  }

  // Si se pagan todos desde aquí, la hoja se cierra sola.
  useEffect(() => {
    if (open && due.length === 0) close()
  }, [open, due.length])

  if (due.length === 0) return null

  return (
    <Sheet
      open={open}
      onClose={close}
      title={due.length === 1 ? 'Tienes un pago' : `Tienes ${due.length} pagos`}
      footer={
        <button className="btn btn--ghost btn--block" onClick={close}>
          Cerrar
        </button>
      }
    >
      <div className="list">
        {due.map((r) => {
          const urgency = reminderUrgency(r)
          const badge =
            urgency === 'overdue'
              ? { text: 'Vencido', cls: 'badge--danger' }
              : urgency === 'today'
                ? { text: 'Hoy', cls: 'badge--warn' }
                : { text: relativeDay(r.nextDate), cls: 'badge--info' }

          return (
            <div key={r.id} className="card card--tight">
              <div className="hstack">
                <span className="row__icon" aria-hidden="true">
                  {r.emoji}
                </span>
                <span className="row__main">
                  <span className="row__title">{r.name}</span>
                  <span className="row__sub">{badge.text}</span>
                </span>
                {r.amount ? <Money value={r.amount} kind="expense" /> : null}
              </div>

              <button
                className="btn btn--sm btn--primary btn--block"
                style={{ marginTop: 10 }}
                onClick={() => {
                  openMovement({ type: 'expense', amount: r.amount, note: r.name })
                  markReminderPaid(r.id)
                  close()
                }}
              >
                <Wallet size={15} />
                Ir a pagar
              </button>

              <div className="hstack" style={{ marginTop: 8, gap: 8 }}>
                <button
                  className="btn btn--sm btn--ghost"
                  style={{ flex: 1 }}
                  onClick={() => markReminderPaid(r.id)}
                >
                  <Check size={15} />
                  Ya está pagado
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
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
