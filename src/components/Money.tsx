/**
 * El único sitio donde se pinta plata.
 *
 * Renderiza los decimales en un `<span>` aparte para bajarles el tamaño: es lo
 * que hace que una lista de montos se lea de un vistazo sin perder la precisión.
 */

import { useApp } from '../store/store'
import { formatMoney, splitAmount } from '../lib/money'
import { brand } from '../config/brand'

type MoneyKind = 'income' | 'expense' | 'transfer' | 'adjust' | 'muted' | 'auto' | 'plain'

interface MoneyProps {
  /** Centavos, entero. */
  value: number
  /** De qué color se pinta. `auto` = verde si es positivo, carmesí si es negativo. */
  kind?: MoneyKind
  /** Muestra `+` en los positivos. */
  sign?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Oculta los decimales. Para ejes y espacios apretados. */
  noDecimals?: boolean
  /** Fuerza mostrar u ocultar, saltándose la preferencia global del ojito. */
  hidden?: boolean
  className?: string
}

const KIND_CLASS: Record<Exclude<MoneyKind, 'auto' | 'plain'>, string> = {
  income: 'money--income',
  expense: 'money--expense',
  transfer: 'money--transfer',
  adjust: 'money--adjust',
  muted: 'money--muted',
}

const SIZE_CLASS = {
  sm: '',
  md: '',
  lg: 'money--lg',
  xl: 'money--xl',
} as const

export function Money({
  value,
  kind = 'plain',
  sign = false,
  size = 'md',
  noDecimals = false,
  hidden,
  className = '',
}: MoneyProps) {
  const { profile } = useApp()
  const isHidden = hidden ?? profile.hideBalance

  // `auto` se resuelve por el signo del valor; `plain` no pinta color.
  const resolvedKind: Exclude<MoneyKind, 'auto'> =
    kind === 'auto' ? (value > 0 ? 'income' : value < 0 ? 'expense' : 'muted') : kind

  const colorClass = resolvedKind === 'plain' ? '' : KIND_CLASS[resolvedKind]

  const classes = ['money', colorClass, SIZE_CLASS[size], className].filter(Boolean).join(' ')

  if (isHidden) {
    return (
      <span className={`${classes} money--hidden`} aria-label="Monto oculto">
        {brand.currencySymbol}
        ••••••
      </span>
    )
  }

  const { int, dec } = splitAmount(value)

  // El signo se decide aquí, no en el número: los montos guardados son positivos.
  let prefix = ''
  if (value < 0) prefix = '−'
  else if (sign && value > 0) prefix = '+'

  return (
    <span className={classes} aria-label={formatMoney(value, { sign })}>
      <span aria-hidden="true">
        {prefix}
        {brand.currencySymbol}
        {int}
        {!noDecimals && <span className="money__dec">,{dec}</span>}
      </span>
    </span>
  )
}
