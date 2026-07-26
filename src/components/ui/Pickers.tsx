/**
 * Selectores de emoji y color, compartidos por cuentas, categorías, metas y notas.
 *
 * El emoji se escoge de una lista corta y además se puede teclear cualquiera:
 * Julián no tiene por qué conformarse con los que se me ocurrieron a mí.
 */

import { palette } from '../../config/brand'

const COMMON_EMOJI = [
  '💵', '💳', '🏦', '📱', '🐖', '💰', '🪙', '💼',
  '🛒', '🍔', '🚗', '🏠', '💡', '💊', '👕', '🎸',
  '📦', '✨', '🎁', '🍺', '⛽', '📚', '🐶', '🎯',
  '🔔', '📝', '⚽', '🎬', '✈️', '🔧', '📌', '🎧',
]

export function EmojiPicker({
  value,
  onChange,
  label = 'Icono',
}: {
  value: string
  onChange: (emoji: string) => void
  label?: string
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>

      <div className="hstack">
        <input
          className="input"
          style={{ width: 64, textAlign: 'center', fontSize: 22, padding: '8px 4px' }}
          value={value}
          onChange={(e) => {
            // Un emoji puede ocupar varios code units (👨‍👩‍👦). Se corta por
            // caracteres reales, no por índices, o se parte en pedazos rotos.
            const chars = [...e.target.value]
            onChange(chars.slice(-1).join('') || value)
          }}
          aria-label="Escribe cualquier emoji"
          maxLength={8}
        />
        <span className="small faint">Toca uno o escribe el que quieras</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 6,
          marginTop: 4,
        }}
      >
        {COMMON_EMOJI.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            aria-label={`Usar ${e}`}
            aria-pressed={value === e}
            style={{
              aspectRatio: '1',
              fontSize: 19,
              borderRadius: 'var(--r-xs)',
              background: value === e ? 'var(--primary-soft)' : 'var(--surface-soft)',
              border: `1px solid ${value === e ? 'var(--primary)' : 'var(--border-soft)'}`,
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ColorPicker({
  value,
  onChange,
  label = 'Color',
}: {
  value: string
  onChange: (color: string) => void
  label?: string
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="swatch-grid">
        {palette.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Color ${c}`}
            aria-pressed={value === c}
            className={`swatch${value === c ? ' swatch--active' : ''}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  )
}
