/**
 * La gráfica de torta, dibujada como un disco de vinilo: surcos concéntricos,
 * etiqueta central y agujero del eje.
 *
 * Es el guiño rock más visible de la app y no cuesta legibilidad — sigue siendo
 * una dona normal, con los surcos por encima como textura.
 *
 * SVG a mano, sin librería de gráficas: ninguna deja hacer esto sin pelear.
 */

import { motion } from 'framer-motion'
import { formatCompact } from '../../lib/money'

export interface VinylSlice {
  id: string
  label: string
  value: number
  color: string
  percent: number
}

interface VinylChartProps {
  slices: VinylSlice[]
  total: number
  /** Texto sobre el total, dentro de la etiqueta central. */
  caption?: string
  /** Oculta la cifra central si el usuario tiene los saldos ocultos. */
  hideAmount?: boolean
}

const SIZE = 200
const C = SIZE / 2
const R = 70
const BAND = 27
const CIRC = 2 * Math.PI * R

/** Radios de los surcos, repartidos por el ancho de la banda de color. */
const GROOVES = [R - 9, R - 5, R - 1, R + 3, R + 7, R + 11]

export function VinylChart({ slices, total, caption = 'Total', hideAmount = false }: VinylChartProps) {
  const sum = slices.reduce((acc, s) => acc + s.value, 0)

  if (sum <= 0) {
    return (
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="vinyl" role="img" aria-label="Sin datos">
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--border-soft)" strokeWidth={BAND} />
        <circle cx={C} cy={C} r={R - BAND / 2 - 2} fill="var(--surface-strong)" />
        <text x={C} y={C + 4} textAnchor="middle" className="vinyl__empty">
          Sin gastos
        </text>
      </svg>
    )
  }

  // Se va acumulando el arco recorrido para saber dónde arranca cada tajada.
  let offset = 0
  const arcs = slices.map((s) => {
    const length = (s.value / sum) * CIRC
    const arc = { ...s, length, offset }
    offset += length
    return arc
  })

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="vinyl"
      role="img"
      aria-label={`Reparto: ${slices.map((s) => `${s.label} ${s.percent}%`).join(', ')}`}
    >
      {/* Banda de color */}
      {arcs.map((a, i) => (
        <motion.circle
          key={a.id}
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke={a.color}
          strokeWidth={BAND}
          strokeDasharray={`${a.length} ${CIRC - a.length}`}
          strokeDashoffset={-a.offset}
          transform={`rotate(-90 ${C} ${C})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
        />
      ))}

      {/* Surcos del vinilo, por encima del color */}
      {GROOVES.map((r, i) => (
        <circle
          key={r}
          cx={C}
          cy={C}
          r={r}
          fill="none"
          stroke="var(--vinyl-groove)"
          strokeWidth={i === 0 || i === GROOVES.length - 1 ? 0.9 : 0.7}
        />
      ))}

      {/* Etiqueta central */}
      <circle cx={C} cy={C} r={R - BAND / 2 - 3.5} fill="var(--vinyl-label)" />
      <circle
        cx={C}
        cy={C}
        r={R - BAND / 2 - 3.5}
        fill="none"
        stroke="var(--border-soft)"
        strokeWidth={0.8}
      />

      {/* El agujero del eje va arriba, no en el centro geométrico: ahí chocaría
          con la cifra. Se lee igual como disco y el número queda limpio. */}
      <circle cx={C} cy={C - 26} r={4} fill="none" stroke="var(--text-faint)" strokeWidth={1.3} />

      <text x={C} y={C - 6} textAnchor="middle" className="vinyl__caption">
        {caption.toUpperCase()}
      </text>
      <text x={C} y={C + 22} textAnchor="middle" className="vinyl__total">
        {hideAmount ? '••••' : formatCompact(total)}
      </text>
    </svg>
  )
}
