/**
 * Fechas, siempre en la zona horaria local del dispositivo.
 *
 * Cuidado con `new Date(iso)`: `new Date('2026-07-26')` se interpreta como UTC y
 * en Colombia (UTC−5) cae el día anterior. Por eso las claves de día se construyen
 * y se leen a mano, componente por componente.
 */

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export const DAY_MS = 86_400_000

/** Clave local 'YYYY-MM-DD'. Es el identificador de día en toda la app. */
export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Convierte una clave 'YYYY-MM-DD' de vuelta a timestamp local (medianoche). */
export function fromDayKey(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function endOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export function startOfMonth(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime()
}

export function endOfMonth(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
}

/** La semana arranca en lunes, que es como se piensa aquí. */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts))
  const dow = d.getDay() // 0 = domingo
  const back = dow === 0 ? 6 : dow - 1
  d.setDate(d.getDate() - back)
  return d.getTime()
}

export function endOfWeek(ts: number): number {
  return startOfWeek(ts) + 7 * DAY_MS - 1
}

/** Suma meses respetando el fin de mes: 31 de enero + 1 mes → 28/29 de febrero. */
export function addMonths(ts: number, months: number): number {
  const d = new Date(ts)
  const targetDay = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(targetDay, lastDay))
  return d.getTime()
}

export function addDays(ts: number, days: number): number {
  const d = new Date(ts)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

/** Días de calendario entre dos instantes, ignorando la hora. */
export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS)
}

export function daysInMonth(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function isSameDay(a: number, b: number): boolean {
  return dayKey(a) === dayKey(b)
}

/* ---------------------------------------------------------------------------
   Formato para mostrar
   --------------------------------------------------------------------------- */

/** "Hoy", "Ayer", "Mañana", o "lun 21 jul". Para las cabeceras del historial. */
export function relativeDay(ts: number, now: number = Date.now()): string {
  const diff = daysBetween(now, ts)
  if (diff === 0) return 'Hoy'
  if (diff === -1) return 'Ayer'
  if (diff === 1) return 'Mañana'

  const d = new Date(ts)
  const label = `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
  // Si es de otro año, hay que decirlo.
  return d.getFullYear() === new Date(now).getFullYear() ? label : `${label} ${d.getFullYear()}`
}

/** "6:40 p. m." */
export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** "26 de julio de 2026" */
export function formatLongDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}

/** "domingo, 26 de julio" — el subtítulo del inicio. */
export function formatDayHeader(ts: number): string {
  const d = new Date(ts)
  return `${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

/** "julio" o "julio 2025" si es de otro año. */
export function monthLabel(ts: number, now: number = Date.now()): string {
  const d = new Date(ts)
  const name = MONTHS[d.getMonth()]
  return d.getFullYear() === new Date(now).getFullYear() ? name : `${name} ${d.getFullYear()}`
}

export function monthShort(ts: number): string {
  return MONTHS_SHORT[new Date(ts).getMonth()]
}

export function dayShort(ts: number): string {
  return DAYS_SHORT[new Date(ts).getDay()]
}

/** Valor para un `<input type="date">`, que espera 'YYYY-MM-DD' local. */
export function toDateInput(ts: number): string {
  return dayKey(ts)
}

/** Valor para un `<input type="datetime-local">`. */
export function toDateTimeInput(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${dayKey(ts)}T${hh}:${mm}`
}

/** Lee un `<input type="date">` o `datetime-local` sin que se corra un día por UTC. */
export function fromDateInput(value: string, fallback: number = Date.now()): number {
  if (!value) return fallback
  const [datePart, timePart] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) return fallback
  let hours = 0
  let minutes = 0
  if (timePart) {
    const [h, min] = timePart.split(':').map(Number)
    hours = h || 0
    minutes = min || 0
  }
  return new Date(y, m - 1, d, hours, minutes, 0, 0).getTime()
}
