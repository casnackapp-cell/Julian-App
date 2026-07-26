/**
 * Todo el dinero de la app pasa por aquí.
 *
 * Los montos viven como ENTEROS EN CENTAVOS. Nunca se usa punto flotante para
 * guardar ni sumar plata: `0.1 + 0.2 !== 0.3` y en una app de cuentas eso es
 * inaceptable. Los `float` solo aparecen al calcular porcentajes para las gráficas.
 */

import { brand } from '../config/brand'

/** Separadores del locale es-CO: miles con punto, decimales con coma. */
const THOUSANDS = '.'
const DECIMAL = ','

/**
 * Convierte lo que escribe el usuario a centavos.
 *
 * Acepta las formas que un colombiano teclea de verdad:
 *   "1250000"      → 125 000 000 centavos
 *   "1.250.000"    → 125 000 000
 *   "1.250.000,50" → 125 000 050
 *   "1250000.50"   → 125 000 050  (por si usa el punto como decimal)
 *   "$ 1.250.000"  → 125 000 000
 *
 * Devuelve 0 ante cualquier cosa que no se pueda interpretar.
 */
export function parseAmount(raw: string): number {
  if (!raw) return 0

  // Fuera todo lo que no sea dígito o separador.
  const cleaned = raw.replace(/[^\d.,]/g, '')
  if (!cleaned) return 0

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  const lastSep = Math.max(lastComma, lastDot)

  let intPart = cleaned
  let decPart = ''

  // Un separador es decimal solo si le siguen 1 o 2 dígitos y es el último.
  if (lastSep !== -1) {
    const tail = cleaned.slice(lastSep + 1)
    if (tail.length > 0 && tail.length <= 2 && /^\d+$/.test(tail)) {
      intPart = cleaned.slice(0, lastSep)
      decPart = tail
    }
  }

  const intDigits = intPart.replace(/\D/g, '')
  const pesos = intDigits ? Number.parseInt(intDigits, 10) : 0
  const cents = decPart ? Number.parseInt(decPart.padEnd(2, '0'), 10) : 0

  if (!Number.isFinite(pesos) || !Number.isFinite(cents)) return 0
  return pesos * 100 + cents
}

/**
 * Formatea lo que el usuario va tecleando, en vivo.
 *
 * Agrupa los miles mientras escribe (`1250000` → `1.250.000`) y deja como mucho
 * una coma con dos decimales. Ver la cifra tomando forma evita el error clásico
 * de teclear un cero de más y no darse cuenta.
 */
export function formatAmountInput(raw: string): string {
  if (!raw) return ''

  // Solo dígitos y una coma decimal; el punto se descarta porque lo pone el formateador.
  const only = raw.replace(/[^\d,]/g, '')
  const firstComma = only.indexOf(',')

  const intDigits = (firstComma === -1 ? only : only.slice(0, firstComma)).replace(/\D/g, '')
  const grouped = intDigits ? groupThousands(Number.parseInt(intDigits, 10)) : ''

  if (firstComma === -1) return grouped

  const decDigits = only.slice(firstComma + 1).replace(/\D/g, '').slice(0, 2)
  return `${grouped || '0'},${decDigits}`
}

/** Separa los centavos en parte entera formateada y decimales, para renderizarlos distinto. */
export function splitAmount(cents: number): { int: string; dec: string } {
  const abs = Math.abs(Math.round(cents))
  const pesos = Math.floor(abs / 100)
  const dec = abs % 100

  return {
    int: groupThousands(pesos),
    dec: String(dec).padStart(2, '0'),
  }
}

/** Inserta el separador de miles: 1250000 → "1.250.000". */
export function groupThousands(n: number): string {
  const s = String(Math.abs(Math.trunc(n)))
  let out = ''
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += THOUSANDS
    out += s[i]
  }
  return out
}

/** Texto plano completo: "$1.250.000,00". Para tooltips, `aria-label` y exportaciones. */
export function formatMoney(cents: number, opts?: { sign?: boolean; symbol?: boolean }): string {
  const { int, dec } = splitAmount(cents)
  const symbol = opts?.symbol === false ? '' : brand.currencySymbol
  let prefix = ''
  if (cents < 0) prefix = '−'
  else if (opts?.sign && cents > 0) prefix = '+'
  return `${prefix}${symbol}${int}${DECIMAL}${dec}`
}

/**
 * Versión corta para ejes de gráficas, donde no cabe el monto completo.
 * 1 250 000 00 centavos → "$1,2 M"
 */
export function formatCompact(cents: number): string {
  const pesos = Math.abs(Math.round(cents / 100))
  const sign = cents < 0 ? '−' : ''
  const s = brand.currencySymbol

  if (pesos >= 1_000_000_000) return `${sign}${s}${trimDec(pesos / 1_000_000_000)} MM`
  if (pesos >= 1_000_000) return `${sign}${s}${trimDec(pesos / 1_000_000)} M`
  if (pesos >= 1_000) return `${sign}${s}${trimDec(pesos / 1_000)} K`
  return `${sign}${s}${groupThousands(pesos)}`
}

function trimDec(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : String(r).replace('.', DECIMAL)
}

/**
 * Porcentaje de cambio entre dos periodos, para las comparativas.
 * Devuelve `null` cuando el periodo anterior fue cero: no existe "subió un ∞ %".
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

/** Reparte un total en porcentajes enteros que suman exactamente 100 (método de restos mayores). */
export function toPercentages(values: number[]): number[] {
  const total = values.reduce((sum, v) => sum + v, 0)
  if (total <= 0) return values.map(() => 0)

  const exact = values.map((v) => (v / total) * 100)
  const floored = exact.map(Math.floor)
  let remainder = 100 - floored.reduce((sum, v) => sum + v, 0)

  // Los puntos sobrantes van a los que tienen mayor parte decimal.
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)

  const out = [...floored]
  for (const { i } of order) {
    if (remainder <= 0) break
    out[i] += 1
    remainder -= 1
  }
  return out
}
