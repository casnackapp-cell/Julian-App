/**
 * Crear o editar una cuenta.
 *
 * Al crear se pide el SALDO INICIAL, y puede ser negativo. Es lo que permite
 * arrancar con las deudas que ya existían: si Julián le debe plata a alguien
 * desde hace meses, esa deuda no tiene ningún movimiento de dónde salir, así
 * que entra como saldo de partida.
 *
 * Por dentro ese saldo se guarda como un movimiento de tipo `adjust`, que mueve
 * el saldo pero no cuenta como ingreso ni gasto en las estadísticas — si contara,
 * el mes en que Julián crea sus cuentas parecería que ganó millones.
 *
 * Nota sobre borrar: si la cuenta ya tiene movimientos no se borra, se archiva.
 * Borrarla dejaría el historial apuntando a una cuenta que no existe y los
 * saldos dejarían de cuadrar. La hoja lo dice con todas las letras.
 */

import { useEffect, useState } from 'react'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'

import { Sheet } from './ui/Sheet'
import { Money } from './Money'
import { ColorPicker, EmojiPicker } from './ui/Pickers'
import { useApp } from '../store/store'
import { palette } from '../config/brand'
import { formatAmountInput, parseAmount } from '../lib/money'
import { accountIsEmpty } from '../data/selectors'
import type { Account, AccountKind } from '../data/types'

interface AccountSheetProps {
  open: boolean
  onClose: () => void
  editing: Account | null
}

export function AccountSheet({ open, onClose, editing }: AccountSheetProps) {
  const { movements, addAccount, addMovement, updateAccount, archiveAccount, deleteAccount } =
    useApp()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💵')
  const [color, setColor] = useState<string>(palette[0])
  const [kind, setKind] = useState<AccountKind>('normal')
  const [balanceRaw, setBalanceRaw] = useState('')
  /** +1 = a favor (o "te debe"); −1 = en contra (o "le debes"). */
  const [sign, setSign] = useState<1 | -1>(1)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setBalanceRaw('')
    setSign(1)

    if (editing) {
      setName(editing.name)
      setEmoji(editing.emoji)
      setColor(editing.color)
      setKind(editing.kind)
    } else {
      setName('')
      setEmoji('💵')
      setColor(palette[Math.floor(Math.random() * palette.length)])
      setKind('normal')
    }
  }, [open, editing])

  const canHardDelete = editing ? accountIsEmpty(movements, editing.id) : false
  const isPerson = kind === 'person'
  const amount = parseAmount(balanceRaw)

  function save() {
    if (!name.trim()) {
      setError('Ponle un nombre a la cuenta.')
      return
    }

    if (editing) {
      updateAccount({ ...editing, name: name.trim(), emoji, color, kind })
      onClose()
      return
    }

    const account = addAccount({ name, emoji, color, kind })

    // El saldo de partida entra como ajuste: mueve el saldo sin ensuciar las
    // estadísticas del mes.
    if (amount > 0) {
      addMovement({
        type: 'adjust',
        amount,
        accountId: account.id,
        direction: sign > 0 ? 'in' : 'out',
        note: isPerson
          ? sign > 0
            ? 'Deuda inicial: te debe'
            : 'Deuda inicial: le debes'
          : 'Saldo inicial',
      })
    }

    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar cuenta' : 'Nueva cuenta'}
      footer={
        <button className="btn btn--primary btn--block" onClick={save}>
          {editing ? 'Guardar' : 'Crear cuenta'}
        </button>
      }
    >
      <div className="field">
        <span className="field__label">Nombre</span>
        <input
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          placeholder={isPerson ? 'Nombre de la persona' : 'Efectivo, Nequi, Bancolombia…'}
          maxLength={40}
        />
      </div>

      {/* El tipo solo se elige al crear: cambiarlo después movería la cuenta
          entre el saldo total y el resumen de deudas sin avisar. */}
      {!editing && (
        <>
          <div className="field">
            <span className="field__label">¿Qué es?</span>
            <div className="segmented">
              <button
                className={`segmented__item${!isPerson ? ' segmented__item--active' : ''}`}
                onClick={() => setKind('normal')}
              >
                Mi plata
              </button>
              <button
                className={`segmented__item${isPerson ? ' segmented__item--active' : ''}`}
                onClick={() => setKind('person')}
              >
                Una persona
              </button>
            </div>
            <p className="small faint" style={{ paddingLeft: 2 }}>
              {isPerson
                ? 'Para llevar lo que le prestaste a alguien o lo que le debes. No suma a tu saldo total.'
                : 'Un lugar donde tienes plata: efectivo, una app, el banco.'}
            </p>
          </div>

          {/* Saldo de partida */}
          <div className="field">
            <span className="field__label">
              {isPerson ? '¿Cuánto se deben hoy?' : '¿Cuánto tienes ahí hoy?'}
            </span>

            <div className="segmented">
              <button
                className={`segmented__item${sign === 1 ? ' segmented__item--active' : ''}`}
                onClick={() => setSign(1)}
              >
                {isPerson ? 'Te debe' : 'A favor'}
              </button>
              <button
                className={`segmented__item${sign === -1 ? ' segmented__item--active' : ''}`}
                onClick={() => setSign(-1)}
              >
                {isPerson ? 'Le debes' : 'En contra'}
              </button>
            </div>

            <input
              className="amount-input"
              inputMode="decimal"
              placeholder="0"
              value={balanceRaw}
              onChange={(e) => setBalanceRaw(formatAmountInput(e.target.value))}
              aria-label="Saldo inicial"
            />

            <p className="small faint" style={{ paddingLeft: 2 }}>
              {amount > 0 ? (
                <>
                  La cuenta arranca en{' '}
                  <Money value={sign * amount} kind="auto" sign hidden={false} size="sm" />.
                </>
              ) : isPerson ? (
                'Si ya venían debiéndose plata de antes, ponla aquí. Déjalo en cero si están al día.'
              ) : (
                'Déjalo en cero si prefieres empezar de ahí. Lo puedes corregir cuando quieras.'
              )}
            </p>
          </div>
        </>
      )}

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
            className="btn btn--ghost btn--block"
            onClick={() => {
              archiveAccount(editing.id, !editing.archived)
              onClose()
            }}
          >
            {editing.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {editing.archived ? 'Reactivar cuenta' : 'Archivar cuenta'}
          </button>
          <p className="small faint" style={{ marginTop: -6 }}>
            Archivar la esconde de las listas pero conserva todo su historial.
          </p>

          <button
            className="btn btn--danger btn--block"
            onClick={() => {
              deleteAccount(editing.id)
              onClose()
            }}
          >
            <Trash2 size={16} />
            {canHardDelete ? 'Borrar cuenta' : 'Borrar (se archivará)'}
          </button>
          {!canHardDelete && (
            <p className="small faint" style={{ marginTop: -6 }}>
              Esta cuenta ya tiene movimientos, así que no se puede borrar del todo: se archivará
              para no descuadrar tu historial.
            </p>
          )}
        </>
      )}
    </Sheet>
  )
}
