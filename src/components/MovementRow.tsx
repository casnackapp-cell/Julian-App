/**
 * Una fila del historial. Se usa igual en el inicio, en movimientos y en el
 * detalle de una cuenta, para que un movimiento se vea siempre igual.
 */

import { ArrowRightLeft, Scale } from 'lucide-react'
import { Money } from './Money'
import { formatTime } from '../lib/date'
import type { Account, Category, ID, Movement } from '../data/types'

interface MovementRowProps {
  movement: Movement
  accounts: Map<ID, Account>
  categories: Map<ID, Category>
  onClick?: () => void
  /** Oculta la hora cuando la fila ya va bajo una cabecera de día. */
  hideTime?: boolean
}

export function MovementRow({
  movement: m,
  accounts,
  categories,
  onClick,
  hideTime = false,
}: MovementRowProps) {
  const account = accounts.get(m.accountId)
  const toAccount = m.toAccountId ? accounts.get(m.toAccountId) : undefined
  const category = m.categoryId ? categories.get(m.categoryId) : undefined

  let title: string
  let icon: React.ReactNode
  let tint: string

  switch (m.type) {
    case 'transfer':
      title = 'Transferencia'
      icon = <ArrowRightLeft size={18} />
      tint = 'var(--transfer)'
      break
    case 'adjust':
      title = 'Saldo corregido'
      icon = <Scale size={18} />
      tint = 'var(--adjust)'
      break
    default:
      title = category?.name ?? 'Sin categoría'
      icon = <span aria-hidden="true">{category?.emoji ?? '📌'}</span>
      tint = m.type === 'income' ? 'var(--income)' : 'var(--expense)'
  }

  // La segunda línea cuenta el contexto: hora, cuentas implicadas y la nota.
  const parts: string[] = []
  if (!hideTime) parts.push(formatTime(m.date))
  if (m.type === 'transfer') {
    parts.push(`${account?.name ?? '?'} → ${toAccount?.name ?? '?'}`)
  } else if (account) {
    parts.push(account.name)
  }
  if (m.note) parts.push(m.note)

  /** El signo que se muestra. Los ajustes llevan el suyo según la dirección. */
  const signed =
    m.type === 'income'
      ? m.amount
      : m.type === 'expense'
        ? -m.amount
        : m.type === 'adjust'
          ? m.direction === 'out'
            ? -m.amount
            : m.amount
          : m.amount

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag className="row" onClick={onClick} type={onClick ? 'button' : undefined}>
      <span
        className="row__icon"
        style={{ color: tint, background: 'var(--surface-soft)' }}
      >
        {icon}
      </span>

      <span className="row__main">
        <span className="row__title">{title}</span>
        <span className="row__sub">{parts.join(' · ')}</span>
      </span>

      <span className="row__right">
        <Money
          value={signed}
          kind={m.type === 'transfer' ? 'transfer' : m.type === 'adjust' ? 'adjust' : m.type}
          sign={m.type === 'income'}
        />
      </span>
    </Tag>
  )
}
