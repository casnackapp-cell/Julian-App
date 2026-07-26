import { describe, expect, it } from 'vitest'
import {
  formatCompact,
  formatMoney,
  groupThousands,
  parseAmount,
  percentChange,
  splitAmount,
  toPercentages,
} from './money'

describe('parseAmount', () => {
  it('lee un número pelado como pesos enteros', () => {
    expect(parseAmount('1250000')).toBe(125_000_000)
    expect(parseAmount('5')).toBe(500)
  })

  it('ignora los separadores de miles', () => {
    expect(parseAmount('1.250.000')).toBe(125_000_000)
    expect(parseAmount('1,250,000')).toBe(125_000_000)
  })

  it('toma los últimos 1-2 dígitos como decimales', () => {
    expect(parseAmount('1.250.000,50')).toBe(125_000_050)
    expect(parseAmount('1250000.50')).toBe(125_000_050)
    expect(parseAmount('10,5')).toBe(1050)
  })

  it('aguanta símbolos y espacios', () => {
    expect(parseAmount('$ 1.250.000')).toBe(125_000_000)
    expect(parseAmount('  $12.000  ')).toBe(1_200_000)
  })

  it('devuelve 0 ante basura', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount('.')).toBe(0)
    expect(parseAmount(',')).toBe(0)
  })

  it('no confunde un grupo de miles con decimales', () => {
    // "1.250" son mil doscientos cincuenta pesos, no un peso con 250 centavos.
    expect(parseAmount('1.250')).toBe(125_000)
  })

  it('nunca produce un flotante', () => {
    for (const raw of ['0,1', '0,2', '1,15', '99,99', '0,07']) {
      expect(Number.isInteger(parseAmount(raw))).toBe(true)
    }
  })
})

describe('groupThousands', () => {
  it('agrupa de a tres', () => {
    expect(groupThousands(0)).toBe('0')
    expect(groupThousands(999)).toBe('999')
    expect(groupThousands(1000)).toBe('1.000')
    expect(groupThousands(1250000)).toBe('1.250.000')
    expect(groupThousands(1234567890)).toBe('1.234.567.890')
  })
})

describe('splitAmount', () => {
  it('separa enteros y decimales', () => {
    expect(splitAmount(125_000_050)).toEqual({ int: '1.250.000', dec: '50' })
    expect(splitAmount(500)).toEqual({ int: '5', dec: '00' })
    expect(splitAmount(7)).toEqual({ int: '0', dec: '07' })
  })

  it('usa el valor absoluto: el signo lo pinta el componente', () => {
    expect(splitAmount(-125_000_050)).toEqual({ int: '1.250.000', dec: '50' })
  })
})

describe('formatMoney', () => {
  it('formatea en es-CO', () => {
    expect(formatMoney(125_000_000)).toBe('$1.250.000,00')
    expect(formatMoney(0)).toBe('$0,00')
  })

  it('usa el menos tipográfico para negativos', () => {
    expect(formatMoney(-125_000_000)).toBe('−$1.250.000,00')
  })

  it('agrega el más solo si se le pide', () => {
    expect(formatMoney(500, { sign: true })).toBe('+$5,00')
    expect(formatMoney(500)).toBe('$5,00')
  })
})

describe('formatCompact', () => {
  it('abrevia para los ejes de las gráficas', () => {
    expect(formatCompact(125_000_000)).toBe('$1,3 M')
    expect(formatCompact(1_200_000)).toBe('$12 K')
    expect(formatCompact(50_000)).toBe('$500')
  })
})

describe('percentChange', () => {
  it('calcula la variación', () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(50, 100)).toBe(-50)
  })

  it('devuelve null si antes era cero: no existe subir un infinito por ciento', () => {
    expect(percentChange(100, 0)).toBeNull()
  })
})

describe('toPercentages', () => {
  it('siempre suma exactamente 100', () => {
    const casos = [
      [1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [33, 33, 34],
      [100, 50, 25, 12, 6],
      [999999, 1],
    ]
    for (const caso of casos) {
      expect(toPercentages(caso).reduce((a, b) => a + b, 0)).toBe(100)
    }
  })

  it('no revienta con un total de cero', () => {
    expect(toPercentages([0, 0, 0])).toEqual([0, 0, 0])
    expect(toPercentages([])).toEqual([])
  })
})
