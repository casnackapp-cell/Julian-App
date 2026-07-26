/**
 * Lista de cuentas con su saldo, más el resumen de deudas si las hay.
 *
 * Cuando no hay ninguna se ofrecen sugerencias de un toque (Efectivo, Nequi,
 * Bancolombia…): sin onboarding, esta pantalla tiene que arrancar sola.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'

import { Money } from '../components/Money'
import { AccountSheet } from '../components/AccountSheet'
import { useApp } from '../store/store'
import { suggestedAccounts } from '../config/brand'
import { allBalances, debtSummary, totalBalance, visibleAccounts } from '../data/selectors'
import type { Account } from '../data/types'

export function Accounts() {
  const { accounts, movements, addAccount } = useApp()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const balances = useMemo(() => allBalances(movements), [movements])
  const open = useMemo(() => visibleAccounts(accounts), [accounts])
  const archived = useMemo(
    () => accounts.filter((a) => a.archived && !a.deleted).sort((a, b) => a.order - b.order),
    [accounts],
  )

  const own = open.filter((a) => a.kind !== 'person')
  const people = open.filter((a) => a.kind === 'person')

  const total = useMemo(() => totalBalance(accounts, movements), [accounts, movements])
  const debts = useMemo(() => debtSummary(accounts, movements), [accounts, movements])

  function edit(account: Account) {
    setEditing(account)
    setSheetOpen(true)
  }

  function create() {
    setEditing(null)
    setSheetOpen(true)
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="screen-head__title">Cuentas</h1>
        <button className="icon-btn icon-btn--solid" onClick={create} aria-label="Nueva cuenta">
          <Plus size={18} />
        </button>
      </header>

      {own.length === 0 ? (
        <div className="card">
          <div className="empty">
            <h2 className="empty__title">Aún no tienes cuentas</h2>
            <p className="empty__text">
              Toca una de estas para crearla al instante, o crea la tuya con el botón de arriba.
            </p>
            <div className="chip-row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {suggestedAccounts.map((s) => (
                <button
                  key={s.name}
                  className="chip"
                  onClick={() => addAccount({ name: s.name, emoji: s.emoji, color: s.color })}
                >
                  <span aria-hidden="true">{s.emoji}</span>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="card">
            <span className="field__label" style={{ padding: 0 }}>
              Saldo total
            </span>
            <div style={{ marginTop: 4 }}>
              <Money value={total} size="lg" />
            </div>
          </section>

          <div className="list">
            {own.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                balance={balances[a.id] ?? 0}
                onEdit={() => edit(a)}
              />
            ))}
          </div>
        </>
      )}

      {/* Deudas */}
      {people.length > 0 && (
        <>
          <div className="section-head">
            <span className="section-head__title">Personas</span>
          </div>

          <div className="card card--tight card--quiet">
            <div className="hstack small">
              <ArrowDownLeft size={14} color="var(--income)" />
              <span className="muted">Me deben</span>
              <span className="spacer" />
              <Money value={debts.theyOweMe} kind="income" size="sm" />
            </div>
            <div className="hstack small" style={{ marginTop: 6 }}>
              <ArrowUpRight size={14} color="var(--expense)" />
              <span className="muted">Yo debo</span>
              <span className="spacer" />
              <Money value={debts.iOwe} kind="expense" size="sm" />
            </div>
          </div>

          <div className="list">
            {people.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                balance={balances[a.id] ?? 0}
                onEdit={() => edit(a)}
                isPerson
              />
            ))}
          </div>
        </>
      )}

      {/* Archivadas */}
      {archived.length > 0 && (
        <>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setShowArchived((v) => !v)}
            style={{ alignSelf: 'flex-start' }}
          >
            <Archive size={15} />
            {showArchived ? 'Ocultar' : 'Ver'} archivadas ({archived.length})
          </button>

          {showArchived && (
            <div className="list">
              {archived.map((a) => (
                <AccountRow
                  key={a.id}
                  account={a}
                  balance={balances[a.id] ?? 0}
                  onEdit={() => edit(a)}
                  dimmed
                />
              ))}
            </div>
          )}
        </>
      )}

      <AccountSheet open={sheetOpen} onClose={() => setSheetOpen(false)} editing={editing} />
    </div>
  )
}

function AccountRow({
  account,
  balance,
  onEdit,
  isPerson = false,
  dimmed = false,
}: {
  account: Account
  balance: number
  onEdit: () => void
  isPerson?: boolean
  dimmed?: boolean
}) {
  // En una cuenta de persona el signo cuenta una historia distinta:
  // positivo = me deben, negativo = yo debo.
  const subtitle = isPerson
    ? balance > 0
      ? 'Te debe'
      : balance < 0
        ? 'Le debes'
        : 'Al día'
    : balance < 0
      ? 'En negativo'
      : undefined

  return (
    <div className="row" style={dimmed ? { opacity: 0.55 } : undefined}>
      <Link
        to={`/cuentas/${account.id}`}
        className="hstack"
        style={{ flex: 1, minWidth: 0, gap: 12 }}
      >
        <span
          className="row__icon"
          style={{ background: `${account.color}22`, borderColor: 'transparent' }}
          aria-hidden="true"
        >
          {account.emoji}
        </span>
        <span className="row__main">
          <span className="row__title">{account.name}</span>
          {subtitle && <span className="row__sub">{subtitle}</span>}
        </span>
      </Link>

      <button
        className="row__right"
        onClick={onEdit}
        aria-label={`Editar ${account.name}`}
        style={{ background: 'none', border: 'none', padding: '4px 0 4px 8px' }}
      >
        <Money value={balance} kind={balance < 0 ? 'expense' : 'plain'} />
      </button>
    </div>
  )
}
