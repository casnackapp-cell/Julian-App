/**
 * Evolución del saldo total en el tiempo: línea con área bajo la curva.
 *
 * Responde de un vistazo a "¿voy subiendo o bajando?", que es lo que Julián
 * quiere saber cuando se sienta el fin de semana a revisar.
 */

import { motion } from 'framer-motion'
import { formatCompact } from '../../lib/money'
import { monthShort } from '../../lib/date'

interface BalanceChartProps {
  points: Array<{ ts: number; balance: number }>
  height?: number
  hideAmounts?: boolean
}

const W = 320
const PAD_X = 6
const PAD_Y = 10

export function BalanceChart({ points, height = 130, hideAmounts = false }: BalanceChartProps) {
  if (points.length < 2) {
    return (
      <div className="empty" style={{ padding: '18px 0' }}>
        <p className="empty__text small">Con un par de días más de movimientos aparece la curva.</p>
      </div>
    )
  }

  const values = points.map((p) => p.balance)
  const min = Math.min(...values)
  const max = Math.max(...values)
  // Si todo el rango es plano, se centra la línea en vez de dividir por cero.
  const span = max - min || Math.abs(max) || 1

  const innerW = W - PAD_X * 2
  const innerH = height - PAD_Y * 2

  const x = (i: number) => PAD_X + (i / (points.length - 1)) * innerW
  const y = (v: number) => PAD_Y + innerH - ((v - min) / span) * innerH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)},${height - PAD_Y} L${PAD_X},${height - PAD_Y} Z`

  const last = points[points.length - 1]
  const rising = last.balance >= points[0].balance
  const stroke = rising ? 'var(--income)' : 'var(--expense)'

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        style={{ width: '100%', height, display: 'block' }}
        role="img"
        aria-label={`Evolución del saldo, ${rising ? 'al alza' : 'a la baja'}`}
        preserveAspectRatio="none"
      >
        {/* Línea del cero, solo si la curva la cruza: ahí sí es información. */}
        {min < 0 && max > 0 && (
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--border-soft)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        <motion.path
          d={area}
          fill={stroke}
          opacity={0.1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 0.5 }}
        />

        <motion.path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        <circle cx={x(points.length - 1)} cy={y(last.balance)} r={3.2} fill={stroke} />
      </svg>

      <div className="hstack small faint" style={{ justifyContent: 'space-between', marginTop: 2 }}>
        <span>{monthShort(points[0].ts)}</span>
        <span>{hideAmounts ? '••••' : formatCompact(last.balance)}</span>
        <span>{monthShort(last.ts)}</span>
      </div>
    </div>
  )
}
