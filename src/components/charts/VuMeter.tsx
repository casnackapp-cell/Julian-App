/**
 * Barra de progreso con forma de VU meter: segmentos discretos en vez de una
 * barra continua. Se usa en las metas de ahorro.
 *
 * Los segmentos se leen mejor que un relleno liso — se cuenta "voy por 7 de 20"
 * sin tener que interpretar una longitud.
 */

interface VuMeterProps {
  /** Fracción entre 0 y 1. */
  ratio: number
  /** Cuántos segmentos tiene la barra. */
  ticks?: number
  color?: string
  /** Marca el último segmento encendido en dorado, como el pico de la aguja. */
  showPeak?: boolean
}

export function VuMeter({ ratio, ticks = 20, color, showPeak = true }: VuMeterProps) {
  const clamped = Math.max(0, Math.min(1, ratio))
  const on = Math.round(clamped * ticks)

  return (
    <div
      className="vu"
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: ticks }, (_, i) => {
        const lit = i < on
        const isPeak = showPeak && lit && i === on - 1
        return (
          <div
            key={i}
            className={`vu__tick${lit ? ' vu__tick--on' : ''}${isPeak ? ' vu__tick--peak' : ''}`}
            style={lit && !isPeak && color ? { background: color } : undefined}
          />
        )
      })}
    </div>
  )
}
