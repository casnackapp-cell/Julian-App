/**
 * Notas y pendientes sueltos.
 *
 * Lo que no cabe en un movimiento: "cobrarle a Marcela", "cotizar el seguro".
 * Cada nota puede ser texto libre o una lista de chequeo.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pin, Plus, Trash2, X } from 'lucide-react'

import { Sheet } from '../components/ui/Sheet'
import { EmojiPicker } from '../components/ui/Pickers'
import { useApp } from '../store/store'
import { newId } from '../lib/id'
import type { Note, NoteColor, NoteItem } from '../data/types'

const COLORS: Array<{ value: NoteColor; label: string; css: string }> = [
  { value: 'crimson', label: 'Carmesí', css: 'var(--expense)' },
  { value: 'gold', label: 'Dorado', css: 'var(--gold)' },
  { value: 'olive', label: 'Oliva', css: 'var(--income)' },
  { value: 'steel', label: 'Acero', css: 'var(--transfer)' },
  { value: 'plum', label: 'Ciruela', css: '#6a5a8c' },
]

const colorOf = (c: NoteColor) => COLORS.find((x) => x.value === c)?.css ?? 'var(--gold)'

export function Notes() {
  const navigate = useNavigate()
  const { notes } = useApp()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)

  const sorted = useMemo(
    () => [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
    [notes],
  )

  return (
    <div className="screen screen--plain">
      <header className="screen-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-head__title">Notas</h1>
        <button
          className="icon-btn icon-btn--solid"
          onClick={() => {
            setEditing(null)
            setSheetOpen(true)
          }}
          aria-label="Nueva nota"
        >
          <Plus size={18} />
        </button>
      </header>

      {sorted.length === 0 ? (
        <div className="card">
          <div className="empty">
            <h2 className="empty__title">Sin notas</h2>
            <p className="empty__text">
              Para lo que no es un movimiento: cobrarle a alguien, cotizar algo, lo que sea.
            </p>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                setEditing(null)
                setSheetOpen(true)
              }}
            >
              <Plus size={16} />
              Escribir una nota
            </button>
          </div>
        </div>
      ) : (
        <div className="stack--sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              onOpen={() => {
                setEditing(n)
                setSheetOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <NoteSheet open={sheetOpen} onClose={() => setSheetOpen(false)} editing={editing} />
    </div>
  )
}

function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
  const { updateNote } = useApp()
  const done = note.items?.filter((i) => i.done).length ?? 0
  const total = note.items?.length ?? 0

  return (
    <section
      className="card"
      style={{ borderLeft: `3px solid ${colorOf(note.color)}`, borderRadius: 'var(--r-md)' }}
    >
      <button className="hstack" style={{ width: '100%' }} onClick={onOpen}>
        <span aria-hidden="true" style={{ fontSize: 19 }}>
          {note.emoji}
        </span>
        <span className="row__main">
          <span className="row__title">{note.title || 'Sin título'}</span>
          {note.isChecklist && total > 0 && (
            <span className="row__sub">
              {done} de {total} hechos
            </span>
          )}
        </span>
        {note.pinned && <Pin size={15} color="var(--gold)" />}
      </button>

      {note.isChecklist && note.items && note.items.length > 0 && (
        <ul style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {note.items.map((item) => (
            <li key={item.id}>
              <button
                className="hstack small"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() =>
                  updateNote({
                    ...note,
                    items: note.items!.map((i) =>
                      i.id === item.id ? { ...i, done: !i.done } : i,
                    ),
                  })
                }
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 16,
                    height: 16,
                    flex: 'none',
                    borderRadius: 4,
                    border: `1.5px solid ${item.done ? colorOf(note.color) : 'var(--border-soft)'}`,
                    background: item.done ? colorOf(note.color) : 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    fontSize: 11,
                    lineHeight: 1,
                  }}
                >
                  {item.done ? '✓' : ''}
                </span>
                <span
                  style={{
                    textDecoration: item.done ? 'line-through' : 'none',
                    opacity: item.done ? 0.5 : 1,
                  }}
                >
                  {item.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!note.isChecklist && note.body && (
        <p className="small muted" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
          {note.body}
        </p>
      )}
    </section>
  )
}

function NoteSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Note | null
}) {
  const { addNote, updateNote, deleteNote } = useApp()

  const [emoji, setEmoji] = useState('📝')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [items, setItems] = useState<NoteItem[]>([])
  const [isChecklist, setIsChecklist] = useState(false)
  const [color, setColor] = useState<NoteColor>('gold')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setEmoji(editing.emoji)
      setTitle(editing.title)
      setBody(editing.body ?? '')
      setItems(editing.items ?? [])
      setIsChecklist(editing.isChecklist)
      setColor(editing.color)
    } else {
      setEmoji('📝')
      setTitle('')
      setBody('')
      setItems([])
      setIsChecklist(false)
      setColor('gold')
    }
    setDraft('')
  }, [open, editing])

  function addItem() {
    const text = draft.trim()
    if (!text) return
    setItems((prev) => [...prev, { id: newId(), text, done: false }])
    setDraft('')
  }

  function save() {
    const payload = {
      emoji,
      title: title.trim(),
      body: isChecklist ? undefined : body,
      items: isChecklist ? items : undefined,
      isChecklist,
      color,
    }

    if (editing) updateNote({ ...editing, ...payload })
    else addNote(payload)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar nota' : 'Nueva nota'}
      headerAction={
        editing ? (
          <button
            className="icon-btn"
            onClick={() => updateNote({ ...editing, pinned: !editing.pinned })}
            aria-label={editing.pinned ? 'Quitar de arriba' : 'Fijar arriba'}
          >
            <Pin size={17} color={editing.pinned ? 'var(--gold)' : undefined} />
          </button>
        ) : undefined
      }
      footer={
        <button className="btn btn--primary btn--block" onClick={save}>
          {editing ? 'Guardar' : 'Crear nota'}
        </button>
      }
    >
      <div className="field">
        <span className="field__label">Título</span>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿De qué es?"
          maxLength={60}
        />
      </div>

      <div className="segmented">
        <button
          className={`segmented__item${!isChecklist ? ' segmented__item--active' : ''}`}
          onClick={() => setIsChecklist(false)}
        >
          Texto
        </button>
        <button
          className={`segmented__item${isChecklist ? ' segmented__item--active' : ''}`}
          onClick={() => setIsChecklist(true)}
        >
          Lista
        </button>
      </div>

      {isChecklist ? (
        <div className="field">
          <span className="field__label">Puntos</span>

          {items.length > 0 && (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
              {items.map((item) => (
                <li key={item.id} className="hstack">
                  <span style={{ flex: 1, fontSize: 14 }}>{item.text}</span>
                  <button
                    className="icon-btn"
                    style={{ width: 28, height: 28 }}
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    aria-label={`Quitar ${item.text}`}
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="hstack">
            <input
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem()
                }
              }}
              placeholder="Escribe y toca +"
              maxLength={80}
            />
            <button className="icon-btn icon-btn--solid" onClick={addItem} aria-label="Agregar punto">
              <Plus size={17} />
            </button>
          </div>
        </div>
      ) : (
        <div className="field">
          <span className="field__label">Nota</span>
          <textarea
            className="textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Lo que necesites recordar"
          />
        </div>
      )}

      <div className="field">
        <span className="field__label">Color</span>
        <div className="chip-row" style={{ flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button
              key={c.value}
              className={`chip${color === c.value ? ' chip--active' : ''}`}
              onClick={() => setColor(c.value)}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: c.css,
                  display: 'inline-block',
                }}
              />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <EmojiPicker value={emoji} onChange={setEmoji} />

      {editing && (
        <>
          <hr className="divider" />
          <button
            className="btn btn--danger btn--block"
            onClick={() => {
              deleteNote(editing.id)
              onClose()
            }}
          >
            <Trash2 size={16} />
            Borrar nota
          </button>
        </>
      )}
    </Sheet>
  )
}
