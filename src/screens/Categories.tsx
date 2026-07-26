/**
 * Categorías, separadas por ingreso y gasto.
 *
 * Van separadas por decisión del cliente: al registrar un gasto solo aparecen
 * las de gasto. Menos opciones en pantalla, menos posibilidad de equivocarse.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

import { Sheet } from '../components/ui/Sheet'
import { ColorPicker, EmojiPicker } from '../components/ui/Pickers'
import { useApp } from '../store/store'
import { palette } from '../config/brand'
import { categoriesOf, categoryIsUsed } from '../data/selectors'
import type { Category, CategoryKind } from '../data/types'

export function Categories() {
  const navigate = useNavigate()
  const { categories, movements } = useApp()
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const list = useMemo(() => categoriesOf(categories, kind), [categories, kind])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of movements) {
      if (!m.categoryId) continue
      map.set(m.categoryId, (map.get(m.categoryId) ?? 0) + 1)
    }
    return map
  }, [movements])

  return (
    <div className="screen screen--plain">
      <header className="screen-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-head__title">Categorías</h1>
        <button
          className="icon-btn icon-btn--solid"
          onClick={() => {
            setEditing(null)
            setSheetOpen(true)
          }}
          aria-label="Nueva categoría"
        >
          <Plus size={18} />
        </button>
      </header>

      <div className="segmented">
        <button
          className={`segmented__item${kind === 'expense' ? ' segmented__item--active' : ''}`}
          onClick={() => setKind('expense')}
        >
          Gastos
        </button>
        <button
          className={`segmented__item${kind === 'income' ? ' segmented__item--active' : ''}`}
          onClick={() => setKind('income')}
        >
          Ingresos
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <div className="empty">
            <h2 className="empty__title">
              Sin categorías de {kind === 'income' ? 'ingreso' : 'gasto'}
            </h2>
            <p className="empty__text">
              Necesitas al menos una para poder registrar{' '}
              {kind === 'income' ? 'ingresos' : 'gastos'}.
            </p>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                setEditing(null)
                setSheetOpen(true)
              }}
            >
              <Plus size={16} />
              Crear una
            </button>
          </div>
        </div>
      ) : (
        <div className="list">
          {list.map((c) => {
            const used = counts.get(c.id) ?? 0
            return (
              <button
                key={c.id}
                className="row"
                onClick={() => {
                  setEditing(c)
                  setSheetOpen(true)
                }}
              >
                <span
                  className="row__icon"
                  style={{ background: `${c.color}22`, borderColor: 'transparent' }}
                  aria-hidden="true"
                >
                  {c.emoji}
                </span>
                <span className="row__main">
                  <span className="row__title">{c.name}</span>
                  <span className="row__sub">
                    {used === 0
                      ? 'Sin usar'
                      : `${used} ${used === 1 ? 'movimiento' : 'movimientos'}`}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <CategorySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editing={editing}
        defaultKind={kind}
      />
    </div>
  )
}

function CategorySheet({
  open,
  onClose,
  editing,
  defaultKind,
}: {
  open: boolean
  onClose: () => void
  editing: Category | null
  defaultKind: CategoryKind
}) {
  const { movements, addCategory, updateCategory, deleteCategory } = useApp()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📌')
  const [color, setColor] = useState<string>(palette[0])
  const [kind, setKind] = useState<CategoryKind>(defaultKind)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setEmoji(editing.emoji)
      setColor(editing.color)
      setKind(editing.kind)
    } else {
      setName('')
      setEmoji('📌')
      setColor(palette[Math.floor(Math.random() * palette.length)])
      setKind(defaultKind)
    }
  }, [open, editing, defaultKind])

  const used = editing ? categoryIsUsed(movements, editing.id) : false

  function save() {
    if (!name.trim()) {
      setError('Ponle un nombre.')
      return
    }
    if (editing) updateCategory({ ...editing, name: name.trim(), emoji, color, kind })
    else addCategory({ name, emoji, color, kind })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar categoría' : 'Nueva categoría'}
      footer={
        <button className="btn btn--primary btn--block" onClick={save}>
          {editing ? 'Guardar' : 'Crear'}
        </button>
      }
    >
      <div className="field">
        <span className="field__label">Nombre</span>
        <input
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          placeholder="Mercado, Gasolina, Sueldo…"
          maxLength={30}
        />
      </div>

      {/* Cambiar el tipo de una categoría ya usada movería sus movimientos de
          lado en las estadísticas, así que solo se elige al crear. */}
      {!editing && (
        <div className="field">
          <span className="field__label">Es para</span>
          <div className="segmented">
            <button
              className={`segmented__item${kind === 'expense' ? ' segmented__item--active' : ''}`}
              onClick={() => setKind('expense')}
            >
              Gastos
            </button>
            <button
              className={`segmented__item${kind === 'income' ? ' segmented__item--active' : ''}`}
              onClick={() => setKind('income')}
            >
              Ingresos
            </button>
          </div>
        </div>
      )}

      <EmojiPicker value={emoji} onChange={setEmoji} />
      <ColorPicker value={color} onChange={setColor} />

      {error && (
        <p className="small" style={{ color: 'var(--expense)' }} role="alert">
          {error}
        </p>
      )}

      {editing && (
        <>
          <hr className="divider" />
          <button
            className="btn btn--danger btn--block"
            onClick={() => {
              deleteCategory(editing.id)
              onClose()
            }}
          >
            <Trash2 size={16} />
            Borrar categoría
          </button>
          {used && (
            <p className="small faint" style={{ marginTop: -6 }}>
              Como ya la usaste, se esconderá de la lista pero tus movimientos
              seguirán mostrando su nombre.
            </p>
          )}
        </>
      )}
    </Sheet>
  )
}
