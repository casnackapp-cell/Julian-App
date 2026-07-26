/**
 * Inicio. Lo primero que ve Julián al abrir.
 *
 * Orden pensado para su forma de usarla (una vez al día, en la noche):
 * cuánto tengo → qué debo pagar ya → en qué voy del mes → qué registré último.
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChartPie,
  Eye,
  EyeOff,
  Moon,
  NotebookPen,
  Plus,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import { Money } from '../components/Money'
import { MovementRow } from '../components/MovementRow'
import { EqualizerChart, type EqualizerBar } from '../components/charts/EqualizerChart'
import { useApp } from '../store/store'
import { useSheets } from '../components/SheetsContext'
import { useCountUp } from '../components/CountUp'
import { formatDayHeader, monthLabel } from '../lib/date'
import {
  dailyTotals,
  dueReminders,
  monthInsight,
  reminderUrgency,
  sortedDesc,
  totalBalance,
  visibleAccounts,
} from '../data/selectors'

const QUICK_LINKS = [
  { to: '/resumen', label: 'Resumen', icon: Sparkles },
  { to: '/graficas', label: 'Gráficas', icon: ChartPie },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/pagos', label: 'Pagos', icon: CalendarDays },
  { to: '/notas', label: 'Notas', icon: NotebookPen },
] as const

export function Home() {
  const { openMovement, editMovement } = useSheets()
  const {
    profile,
    accounts,
    categories,
    movements,
    reminders,
    resolvedTheme,
    setTheme,
    toggleHideBalance,
  } = useApp()

  const open = useMemo(() => visibleAccounts(accounts), [accounts])
  const total = useMemo(() => totalBalance(accounts, movements), [accounts, movements])
  const insight = useMemo(() => monthInsight(movements, categories), [movements, categories])
  const due = useMemo(() => dueReminders(reminders), [reminders])

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const recent = useMemo(() => sortedDesc(movements).slice(0, 4), [movements])

  /** Barras del ecualizador: días vividos con su gasto, días futuros apagados. */
  const bars = useMemo<EqualizerBar[]>(() => {
    const days = dailyTotals(movements, insight.from, insight.to, 'expense')
    return days.map((d, i) => ({
      ts: d.ts,
      total: i < insight.elapsedDays ? d.total : insight.dailyAverage,
      future: i >= insight.elapsedDays,
    }))
  }, [movements, insight])

  const animatedTotal = useCountUp(total, !profile.hideBalance)

  /* --- App recién instalada: el estado vacío hace de tutorial (no hay onboarding) --- */
  if (open.length === 0) {
    return (
      <div className="screen">
        <Header
          userName={profile.userName}
          theme={resolvedTheme}
          onToggleTheme={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        />

        <div className="card">
          <div className="empty">
            <Wallet size={38} className="empty__art" />
            <h2 className="empty__title">Empecemos por tus cuentas</h2>
            <p className="empty__text">
              Una cuenta es cada lugar donde tienes plata: el efectivo del bolsillo, Nequi, el
              banco. Crea la primera y ya podrás registrar movimientos.
            </p>
            <Link to="/cuentas" className="btn btn--primary">
              <Plus size={17} />
              Crear mi primera cuenta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header
        userName={profile.userName}
        theme={resolvedTheme}
        onToggleTheme={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      />

      {/* Saldo total */}
      <section className="card" aria-label="Saldo total">
        <div className="hstack">
          <span className="field__label" style={{ padding: 0 }}>
            Saldo total
          </span>
          <span className="spacer" />
          <button
            className="icon-btn"
            onClick={toggleHideBalance}
            aria-label={profile.hideBalance ? 'Mostrar saldos' : 'Ocultar saldos'}
            style={{ width: 30, height: 30 }}
          >
            {profile.hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div style={{ margin: '4px 0 9px' }}>
          <Money value={profile.hideBalance ? total : animatedTotal} size="xl" />
        </div>

        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
          <MonthChangeBadge insight={insight} />
          <span className="badge">
            {open.length} {open.length === 1 ? 'cuenta' : 'cuentas'}
          </span>
        </div>
      </section>

      {/* Pagos por vencer */}
      {due.length > 0 && (
        <Link
          to="/pagos"
          className="card card--tight"
          style={{
            background: 'var(--expense-soft)',
            borderColor: 'color-mix(in srgb, var(--expense) 24%, transparent)',
          }}
        >
          <div className="hstack">
            <span className="row__icon" style={{ background: 'transparent', border: 'none' }}>
              <CalendarDays size={19} color="var(--expense)" />
            </span>
            <span className="row__main">
              <span className="row__title" style={{ color: 'var(--expense)' }}>
                {due.length === 1
                  ? `${due[0].name} ${reminderUrgency(due[0]) === 'overdue' ? 'está vencido' : 'vence pronto'}`
                  : `${due.length} pagos por vencer`}
              </span>
              <span className="row__sub">Toca para revisarlos</span>
            </span>
            {due.length === 1 && due[0].amount ? (
              <Money value={due[0].amount} kind="expense" />
            ) : null}
          </div>
        </Link>
      )}

      {/* Accesos rápidos */}
      <nav className="chip-row" aria-label="Secciones">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="chip">
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Gasto del mes */}
      <section className="card" aria-label={`Gasto de ${monthLabel(insight.from)}`}>
        <div className="hstack" style={{ alignItems: 'baseline' }}>
          <span className="field__label" style={{ padding: 0 }}>
            Gasto de {monthLabel(insight.from)}
          </span>
          <span className="spacer" />
          <Money value={insight.expense} kind="expense" />
        </div>

        <div style={{ margin: '12px 0 9px' }}>
          <EqualizerChart bars={bars} height={72} hideAmounts={profile.hideBalance} />
        </div>

        {insight.isCurrentMonth && insight.expense > 0 ? (
          <div className="hstack small">
            <TrendingUp size={14} color="var(--gold)" />
            <span className="muted">A este ritmo cierras en</span>
            <Money value={insight.projected} kind="adjust" size="sm" />
          </div>
        ) : (
          <p className="small faint">
            {insight.expense === 0
              ? 'Todavía no has registrado gastos este mes.'
              : `${insight.elapsedDays} días registrados.`}
          </p>
        )}
      </section>

      {/* Últimos movimientos */}
      <div className="section-head">
        <span className="section-head__title">Últimos movimientos</span>
        {movements.length > 0 && (
          <Link to="/movimientos" className="section-head__action">
            Ver todo
          </Link>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '22px 12px' }}>
            <h2 className="empty__title">Nada registrado aún</h2>
            <p className="empty__text">
              Toca el <strong>+</strong> de abajo para anotar tu primer gasto o ingreso.
            </p>
            <button className="btn btn--primary btn--sm" onClick={() => openMovement()}>
              <Plus size={16} />
              Registrar movimiento
            </button>
          </div>
        </div>
      ) : (
        <div className="list">
          {recent.map((m) => (
            <MovementRow
              key={m.id}
              movement={m}
              accounts={accountMap}
              categories={categoryMap}
              onClick={() => editMovement(m)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Header({
  userName,
  theme,
  onToggleTheme,
}: {
  userName: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}) {
  return (
    <header className="screen-head">
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="screen-head__title">{userName}</h1>
        <p className="screen-head__sub">{formatDayHeader(Date.now())}</p>
      </div>
      <button
        className="icon-btn icon-btn--solid"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
    </header>
  )
}

/** Comparativa del gasto contra el mes pasado. */
function MonthChangeBadge({ insight }: { insight: ReturnType<typeof monthInsight> }) {
  if (insight.expenseChange === null) {
    return <span className="badge">Primer mes con datos</span>
  }

  const pct = Math.round(insight.expenseChange)
  if (pct === 0) return <span className="badge">Igual que el mes pasado</span>

  const worse = pct > 0
  return (
    <span className={`badge ${worse ? 'badge--danger' : 'badge--ok'}`}>
      {worse ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(pct)}% {worse ? 'más' : 'menos'} que el mes pasado
    </span>
  )
}
