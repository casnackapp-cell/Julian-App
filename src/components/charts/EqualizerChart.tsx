/**
 * Gasto día a día, dibujado como las barras de un ecualizador.
 *
 * Los días que aún no llegaron se pintan apagados: es la proyección al ritmo
 * actual, y se distingue a simple vista de lo que de verdad se gastó.
 */

import { motion } from 'framer-motion'
import { formatCompact } from '../../lib/money'

export interface EqualizerBar {
  ts: number
  total: number
  /** Día futuro: se pinta apagado. */
  future?: boolean
}

interface EqualizerChartProps {
  bars: EqualizerBar[]
  /** Resalta la barra más alta en dorado, como el pico de un VU meter. */
  highlightPeak?: boolean
  height?: number
  hideAmounts?: boolean
}

export function EqualizerChart({
  bars,
  highlightPeak = true,
  height = 92,
  hideAmounts = false,
}: EqualizerChartProps) {
  const max = Math.max(...bars.map((b) => b.total), 1)
  const peak = highlightPeak ? bars.reduce((best, b) => (b.total > best ? b.total : best), 0) : -1

  return (
    <div className="eq" style={{ height }}>
      {bars.map((b, i) => {
        // Un día con gasto siempre se ve, aunque sea mínimo comparado con el máximo.
        const ratio = b.total > 0 ? Math.max(0.06, b.total / max) : 0.02
        const isPeak = !b.future && b.total > 0 && b.total === peak

        return (
          <motion.div
            key={b.ts}
            className={`eq__bar${b.future ? ' eq__bar--future' : ''}${isPeak ? ' eq__bar--peak' : ''}`}
            initial={{ height: '2%' }}
            animate={{ height: `${ratio * 100}%` }}
            transition={{ delay: Math.min(i * 0.012, 0.3), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            title={hideAmounts ? undefined : formatCompact(b.total)}
          />
        )
      })}
    </div>
  )
}
