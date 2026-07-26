/**
 * Gráficas: en qué se va la plata.
 *
 * Es la respuesta al problema número uno de Julián ("no sé en qué se me va").
 * Tres vistas del mismo periodo: reparto (vinilo), día a día (ecualizador) y
 * evolución del saldo (línea).
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

import { Money } from '../components/Money'
import { VinylChart, type VinylSlice } from '../components/charts/VinylChart'
import { EqualizerChart } from '../components/charts/EqualizerChart'
import { BalanceChart } from '../components/charts/BalanceChart'
import { useApp } from '../store/store'
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  monthLabel,
  startOfMonth,
  startOfWeek,
} from '../lib/date'
import { balanceEvolution, categoryStats, dailyTotals, periodTotals } from '../data/selectors'

type Period = 'week' | 'month'
type Lens = 'expense' | 'income'

export function Stats() {
  const navigate = useNavigate()
  const { accounts, categories, movements, profile } = useApp()

  const [period, setPeriod] = useState<Period>('month')
  const [lens, setLens] = useState<Lens>('expense')
  /** 0 = periodo actual, -1 = el anterior, y así. */
  const [offset, setOffset] = useState(0)

  const { from, to, label } = useMemo(() => {
    const now = Date.now()
    if (period === 'month') {
      const anchor = addMonths(now, offset)
      return { from: startOfMonth(anchor), to: endOfMonth(anchor), label: monthLabel(anchor) }
    }
    const anchor = now + offset * 7 * 86_400_000
    const s = startOfWeek(anchor)
    const e = endOfWeek(anchor)
    return {
      from: s,
      to: e,
      label:
        offset === 0
          ? 'Esta semana'
          : offset === -1
            ? 'Semana pasada'
            : `Semana del ${new Date(s).getDate()}`,
    }
  }, [period, offset])

  const totals = useMemo(() => periodTotals(movements, from, to), [movements, from, to])

  const stats = useMemo(
    () => categoryStats(movements, categories, from, to, lens),
    [movements, categories, from, to, lens],
  )

  const slices = useMemo<VinylSlice[]>(
    () =>
      stats.slice(0, 8).map((s) => ({
        id: s.categoryId,
        label: s.category?.name ?? 'Sin categoría',
        value: s.total,
        color: s.category?.color ?? 'var(--text-faint)',
        percent: s.percent,
      })),
    [stats],
  )

  const bars = useMemo(
    () => dailyTotals(movements, from, to, lens).map((d) => ({ ts: d.ts, total: d.total })),
    [movements, from, to, lens],
  )

  const evolution = useMemo(
    () => balanceEvolution(accounts, movements, from, to),
    [accounts, movements, from, to],
  )

  const lensTotal = lens === 'expense' ? totals.expense : totals.income

  return (
    <div className="screen screen--plain">
      <header className="screen-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-head__title">Gráficas</h1>
      </header>

      <div className="segmented">
        <button
          className={`segmented__item${period === 'week' ? ' segmented__item--active' : ''}`}
          onClick={() => {
            setPeriod('week')
            setOffset(0)
          }}
        >
          Semana
        </button>
        <button
          className={`segmented__item${period === 'month' ? ' segmented__item--active' : ''}`}
          onClick={() => {
            setPeriod('month')
            setOffset(0)
          }}
        >
          Mes
        </button>
      </div>

      {/* Navegación de periodo */}
      <div className="hstack">
        <button className="icon-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Periodo anterior">
          <ChevronLeft size={19} />
        </button>
        <span className="strong" style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>
          {label}
        </span>
        <button
          className="icon-btn"
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset >= 0}
          aria-label="Periodo siguiente"
          style={offset >= 0 ? { opacity: 0.3, pointerEvents: 'none' } : undefined}
        >
          <ChevronRight size={19} />
        </button>
      </div>

      {/* Ingresos vs gastos */}
      <div className="grid-2">
        <button
          className={`card card--tight${lens === 'expense' ? '' : ' card--quiet'}`}
          onClick={() => setLens('expense')}
          style={lens === 'expense' ? { borderColor: 'var(--expense)' } : undefined}
        >
          <span className="field__label" style={{ padding: 0 }}>
            Gastos
          </span>
          <div style={{ marginTop: 3 }}>
            <Money value={totals.expense} kind="expense" />
          </div>
        </button>

        <button
          className={`card card--tight${lens === 'income' ? '' : ' card--quiet'}`}
          onClick={() => setLens('income')}
          style={lens === 'income' ? { borderColor: 'var(--income)' } : undefined}
        >
          <span className="field__label" style={{ padding: 0 }}>
            Ingresos
          </span>
          <div style={{ marginTop: 3 }}>
            <Money value={totals.income} kind="income" />
          </div>
        </button>
      </div>

      {/* Vinilo */}
      <section className="card">
        <div className="center">
          <span className="field__label">
            {lens === 'expense' ? 'En qué se fue' : 'De dónde entró'}
          </span>
        </div>

        <div style={{ margin: '6px 0 12px' }}>
          <VinylChart
            slices={slices}
            total={lensTotal}
            caption="Total"
            hideAmount={profile.hideBalance}
          />
        </div>

        {stats.length === 0 ? (
          <p className="empty__text center" style={{ margin: '0 auto' }}>
            No hay {lens === 'expense' ? 'gastos' : 'ingresos'} en este periodo.
          </p>
        ) : (
          <div className="list">
            {stats.map((s) => (
              <div key={s.categoryId} className="row row--flat" style={{ padding: '7px 2px' }}>
                <span
                  className="row__icon"
                  style={{
                    background: `${s.category?.color ?? '#888'}22`,
                    borderColor: 'transparent',
                    width: 34,
                    height: 34,
                    fontSize: 16,
                  }}
                  aria-hidden="true"
                >
                  {s.category?.emoji ?? '📌'}
                </span>
                <span className="row__main">
                  <span className="row__title">{s.category?.name ?? 'Sin categoría'}</span>
                  <span className="row__sub">
                    {s.percent}% · {s.count} {s.count === 1 ? 'vez' : 'veces'}
                  </span>
                </span>
                <Money value={s.total} kind={lens === 'expense' ? 'expense' : 'income'} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ecualizador */}
      <section className="card">
        <span className="field__label" style={{ padding: 0 }}>
          Día a día
        </span>
        <div style={{ margin: '12px 0 4px' }}>
          <EqualizerChart bars={bars} height={100} hideAmounts={profile.hideBalance} />
        </div>
        <p className="small faint">La barra dorada es el día que más se movió.</p>
      </section>

      {/* Evolución del saldo */}
      <section className="card">
        <span className="field__label" style={{ padding: 0 }}>
          Cómo va tu saldo
        </span>
        <div style={{ marginTop: 8 }}>
          <BalanceChart points={evolution} hideAmounts={profile.hideBalance} />
        </div>
      </section>
    </div>
  )
}
