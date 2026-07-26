/**
 * Resumen inteligente. Sin IA, todo calculado (decisión D9).
 *
 * En vez de un chat donde Julián tenga que saber qué preguntar, se le entregan
 * ya respondidas las preguntas que de verdad importan. Es instantáneo, funciona
 * sin señal, no cuesta plata y no puede equivocarse en una cifra.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Flame,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import { Money } from '../components/Money'
import { useApp } from '../store/store'
import { addMonths, formatLongDate, monthLabel } from '../lib/date'
import { monthInsight } from '../data/selectors'

export function Summary() {
  const navigate = useNavigate()
  const { categories, movements } = useApp()
  const [offset, setOffset] = useState(0)

  const anchor = useMemo(() => addMonths(Date.now(), offset), [offset])
  const ins = useMemo(() => monthInsight(movements, categories, anchor), [movements, categories, anchor])

  const hasData = ins.expense > 0 || ins.income > 0

  return (
    <div className="screen screen--plain">
      <header className="screen-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-head__title">Resumen</h1>
      </header>

      <div className="hstack">
        <button className="icon-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Mes anterior">
          <ChevronLeft size={19} />
        </button>
        <span className="strong" style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>
          {monthLabel(ins.from)}
        </span>
        <button
          className="icon-btn"
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          aria-label="Mes siguiente"
          style={offset >= 0 ? { opacity: 0.3, pointerEvents: 'none' } : undefined}
        >
          <ChevronRight size={19} />
        </button>
      </div>

      {!hasData ? (
        <div className="card">
          <div className="empty">
            <h2 className="empty__title">Sin datos de este mes</h2>
            <p className="empty__text">
              Cuando registres movimientos, aquí te cuento en qué se te fue la plata.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Lo básico */}
          <div className="grid-2">
            <div className="card card--tight">
              <span className="field__label" style={{ padding: 0 }}>
                Entró
              </span>
              <div style={{ marginTop: 3 }}>
                <Money value={ins.income} kind="income" />
              </div>
            </div>
            <div className="card card--tight">
              <span className="field__label" style={{ padding: 0 }}>
                Salió
              </span>
              <div style={{ marginTop: 3 }}>
                <Money value={ins.expense} kind="expense" />
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: ins.net >= 0 ? 'var(--income-soft)' : 'var(--expense-soft)',
              borderColor: 'transparent',
            }}
          >
            <div className="hstack">
              <PiggyBank size={20} color={ins.net >= 0 ? 'var(--income)' : 'var(--expense)'} />
              <span className="row__main">
                <span className="row__title row__title--wrap">
                  {ins.net >= 0 ? 'Te quedó a favor' : 'Gastaste de más'}
                </span>
                <span className="row__sub row__sub--wrap">
                  {ins.net >= 0
                    ? 'Ganaste más de lo que gastaste este mes.'
                    : 'Gastaste más de lo que entró este mes.'}
                </span>
              </span>
              <Money value={Math.abs(ins.net)} kind={ins.net >= 0 ? 'income' : 'expense'} size="lg" />
            </div>
          </div>

          {/* Respuestas */}
          <div className="section-head">
            <span className="section-head__title">En qué se te fue</span>
          </div>

          <div className="list">
            {ins.topCategory?.category && (
              <InsightRow
                icon={<span aria-hidden="true">{ins.topCategory.category.emoji}</span>}
                title={`Lo que más pesó: ${ins.topCategory.category.name}`}
                sub={`${ins.topCategory.percent}% de todo tu gasto, en ${ins.topCategory.count} ${
                  ins.topCategory.count === 1 ? 'movimiento' : 'movimientos'
                }`}
                value={ins.topCategory.total}
                kind="expense"
              />
            )}

            {ins.worstDay && (
              <InsightRow
                icon={<Flame size={18} />}
                title="Tu día más caro"
                sub={formatLongDate(ins.worstDay.ts)}
                value={ins.worstDay.total}
                kind="expense"
              />
            )}

            <InsightRow
              icon={<Wallet size={18} />}
              title="Promedio por día"
              sub={`Sobre ${ins.elapsedDays} ${ins.elapsedDays === 1 ? 'día' : 'días'} de ${monthLabel(ins.from)}`}
              value={ins.dailyAverage}
              kind="muted"
            />

            {ins.isCurrentMonth && (
              <InsightRow
                icon={<CalendarClock size={18} />}
                title="A este ritmo cierras el mes en"
                sub={`Faltan ${ins.totalDays - ins.elapsedDays} días`}
                value={ins.projected}
                kind="adjust"
              />
            )}

            <ComparisonRow insight={ins} />
          </div>

          <p className="small faint center" style={{ marginTop: 4 }}>
            Todo esto sale de tus propios movimientos. Nada estimado por fuera.
          </p>
        </>
      )}
    </div>
  )
}

function InsightRow({
  icon,
  title,
  sub,
  value,
  kind,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  value: number
  kind: 'expense' | 'income' | 'muted' | 'adjust'
}) {
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <span className="row__icon">{icon}</span>
      <span className="row__main">
        <span className="row__title row__title--wrap">{title}</span>
        <span className="row__sub row__sub--wrap">{sub}</span>
      </span>
      <Money value={value} kind={kind} />
    </div>
  )
}

/** Comparativa contra el mes anterior, redactada en español llano. */
function ComparisonRow({ insight }: { insight: ReturnType<typeof monthInsight> }) {
  if (insight.expenseChange === null) {
    return (
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span className="row__icon">
          <TrendingUp size={18} />
        </span>
        <span className="row__main">
          <span className="row__title row__title--wrap">Sin mes anterior con qué comparar</span>
          <span className="row__sub row__sub--wrap">
            El mes que viene ya podrás ver si mejoraste.
          </span>
        </span>
      </div>
    )
  }

  const pct = Math.round(insight.expenseChange)
  const worse = pct > 0
  const diff = Math.abs(insight.expense - insight.prevExpense)

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <span className="row__icon" style={{ color: worse ? 'var(--expense)' : 'var(--income)' }}>
        {worse ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
      </span>
      <span className="row__main">
        <span className="row__title row__title--wrap">
          {pct === 0
            ? 'Igual que el mes pasado'
            : `Gastaste ${Math.abs(pct)}% ${worse ? 'más' : 'menos'} que el mes pasado`}
        </span>
        <span className="row__sub row__sub--wrap">
          El mes pasado fueron{' '}
          <Money value={insight.prevExpense} kind="muted" size="sm" />
        </span>
      </span>
      {pct !== 0 && <Money value={diff} kind={worse ? 'expense' : 'income'} />}
    </div>
  )
}
