/**
 * Detalle de una cuenta: su saldo y solo sus movimientos.
 *
 * Cada fila muestra con cuánto quedó la cuenta después de ese movimiento. Es lo
 * que permite "devolverse en el tiempo" cuando el saldo de la app no coincide
 * con el del banco y hay que encontrar dónde se torció.
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'

import { Money } from '../components/Money'
import { MovementRow } from '../components/MovementRow'
import { AccountSheet } from '../components/AccountSheet'
import { useApp } from '../store/store'
import { useSheets } from '../components/SheetsContext'
import { relativeDay } from '../lib/date'
import { accountBalance, balancesAfter, groupByDay } from '../data/selectors'

export function AccountDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { accounts, categories, movements } = useApp()
  const { openMovement, editMovement } = useSheets()
  const [editOpen, setEditOpen] = useState(false)

  const account = accounts.find((a) => a.id === id)

  const own = useMemo(
    () => (id ? movements.filter((m) => m.accountId === id || m.toAccountId === id) : []),
    [movements, id],
  )

  // Los saldos se calculan sobre TODOS los movimientos de la cuenta, no sobre lo
  // que se está viendo, o el acumulado saldría mal.
  const after = useMemo(() => balancesAfter(own), [own])
  const groups = useMemo(() => groupByDay(own), [own])

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  if (!account) {
    return (
      <div className="screen screen--plain">
        <div className="card">
          <div className="empty">
            <h1 className="empty__title">Esta cuenta ya no existe</h1>
            <Link to="/cuentas" className="btn btn--primary btn--sm">
              Volver a cuentas
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const balance = accountBalance(movements, account.id)

  return (
    <div className="screen">
      <header className="screen-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="screen-head__title">
            <span aria-hidden="true">{account.emoji}</span> {account.name}
          </h1>
          {account.archived && <p className="screen-head__sub">Archivada</p>}
        </div>
        <button
          className="icon-btn icon-btn--solid"
          onClick={() => setEditOpen(true)}
          aria-label="Editar cuenta"
        >
          <Pencil size={16} />
        </button>
      </header>

      <section className="card">
        <span className="field__label" style={{ padding: 0 }}>
          {account.kind === 'person'
            ? balance > 0
              ? 'Te debe'
              : balance < 0
                ? 'Le debes'
                : 'Están al día'
            : 'Saldo'}
        </span>
        <div style={{ margin: '4px 0 12px' }}>
          <Money
            value={account.kind === 'person' ? Math.abs(balance) : balance}
            size="lg"
            kind={balance < 0 && account.kind !== 'person' ? 'expense' : 'plain'}
          />
        </div>

        <div className="hstack" style={{ gap: 8 }}>
          <button
            className="btn btn--primary btn--sm"
            style={{ flex: 1 }}
            onClick={() => openMovement({ accountId: account.id })}
          >
            <Plus size={15} />
            Registrar aquí
          </button>
          <button
            className="btn btn--ghost btn--sm"
            style={{ flex: 1 }}
            onClick={() => openMovement({ type: 'adjust', accountId: account.id })}
          >
            Corregir saldo
          </button>
        </div>
      </section>

      {groups.length === 0 ? (
        <div className="card">
          <div className="empty">
            <h2 className="empty__title">Sin movimientos</h2>
            <p className="empty__text">
              Cuando registres algo en esta cuenta, aparecerá aquí con el saldo que fue quedando.
            </p>
          </div>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.day}>
            <div className="day-sep">
              <span>{relativeDay(g.ts)}</span>
            </div>
            <div className="list">
              {g.items.map((m) => {
                // En una transferencia, el saldo que interesa es el de ESTA cuenta.
                const snapshot = after[m.id]
                const resulting =
                  m.toAccountId === account.id && snapshot?.to !== undefined
                    ? snapshot.to
                    : snapshot?.from

                return (
                  <div key={m.id}>
                    <MovementRow
                      movement={m}
                      accounts={accountMap}
                      categories={categoryMap}
                      onClick={() => editMovement(m)}
                    />
                    {resulting !== undefined && (
                      <p
                        className="small faint"
                        style={{ textAlign: 'right', padding: '3px 12px 0' }}
                      >
                        Quedó en <Money value={resulting} kind="muted" size="sm" />
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}

      <AccountSheet open={editOpen} onClose={() => setEditOpen(false)} editing={account} />
    </div>
  )
}
