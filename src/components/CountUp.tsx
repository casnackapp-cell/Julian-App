/**
 * Número que sube contando al aparecer.
 *
 * Solo se usa en los montos grandes (el saldo del inicio, el total de un
 * periodo). En una lista sería ruido; ahí los números se muestran quietos.
 */

import { useEffect, useRef, useState } from 'react'

const DURATION = 650

export function useCountUp(target: number, enabled = true): number {
  const [value, setValue] = useState(enabled ? 0 : target)
  const fromRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }

    // Quien pidió menos movimiento no quiere ver números girando.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    const from = fromRef.current
    const delta = target - from
    if (delta === 0) return

    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      // easeOutCubic: arranca rápido y frena, que es como se lee natural.
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(from + delta * eased)
      setValue(current)
      fromRef.current = current
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [target, enabled])

  return value
}
