/**
 * Ajustes. Puerta de entrada a lo que no cabe en la barra de cinco.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  CloudCheck,
  Eye,
  LogOut,
  Monitor,
  Moon,
  NotebookPen,
  Shapes,
  Sun,
  Target,
  TriangleAlert,
} from 'lucide-react'

import { Sheet } from '../components/ui/Sheet'
import { useApp } from '../store/store'
import { useAuth } from '../firebase/AuthProvider'
import { brand } from '../config/brand'
import type { ThemePref } from '../data/types'

const THEMES: Array<{ value: ThemePref; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Automático', icon: Monitor },
]

const SECTIONS = [
  { to: '/categorias', label: 'Categorías', hint: 'Crear, editar y borrar', icon: Shapes },
  { to: '/metas', label: 'Metas de ahorro', hint: 'Para lo que estás juntando', icon: Target },
  { to: '/notas', label: 'Notas', hint: 'Pendientes y recordatorios sueltos', icon: NotebookPen },
] as const

export function Settings() {
  const { profile, updateProfile, setTheme, toggleHideBalance, resetAll } = useApp()
  const { user, signOutUser } = useAuth()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="screen-head__title">Ajustes</h1>
      </header>

      {/* Nombre */}
      <section className="card">
        <div className="field">
          <span className="field__label">Tu nombre</span>
          <input
            className="input"
            value={profile.userName}
            onChange={(e) => updateProfile({ userName: e.target.value })}
            placeholder="¿Cómo te llamas?"
            maxLength={30}
          />
          <p className="small faint" style={{ paddingLeft: 2 }}>
            Es lo que aparece arriba en el inicio.
          </p>
        </div>
      </section>

      {/* Apariencia */}
      <section className="card">
        <div className="field">
          <span className="field__label">Tema</span>
          <div className="segmented">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                className={`segmented__item${profile.theme === value ? ' segmented__item--active' : ''}`}
                onClick={() => setTheme(value)}
                aria-pressed={profile.theme === value}
              >
                <Icon size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <hr className="divider" style={{ margin: '14px 0' }} />

        <button className="hstack" style={{ width: 100 + '%' }} onClick={toggleHideBalance}>
          <Eye size={18} className="faint" />
          <span className="row__main">
            <span className="row__title">Ocultar saldos</span>
            <span className="row__sub">
              Tapa los montos por si alguien te mira el celular
            </span>
          </span>
          <span className={`badge ${profile.hideBalance ? 'badge--ok' : ''}`}>
            {profile.hideBalance ? 'Activado' : 'Desactivado'}
          </span>
        </button>
      </section>

      {/* Secciones */}
      <div className="list">
        {SECTIONS.map(({ to, label, hint, icon: Icon }) => (
          <Link key={to} to={to} className="row">
            <span className="row__icon">
              <Icon size={18} />
            </span>
            <span className="row__main">
              <span className="row__title">{label}</span>
              <span className="row__sub">{hint}</span>
            </span>
            <ChevronRight size={17} className="faint" />
          </Link>
        ))}
      </div>

      {/* Sesión. Solo aparece si la app está conectada a la nube. */}
      {user && (
        <section className="card card--tight">
          <div className="hstack">
            <span className="row__icon">
              <CloudCheck size={18} color="var(--income)" />
            </span>
            <span className="row__main">
              <span className="row__title">Guardado en la nube</span>
              <span className="row__sub">{user.email}</span>
            </span>
            <button className="btn btn--sm btn--ghost" onClick={signOutUser}>
              <LogOut size={15} />
              Salir
            </button>
          </div>
        </section>
      )}

      {/* Zona peligrosa */}
      <div className="section-head">
        <span className="section-head__title">Cuidado</span>
      </div>

      <button className="btn btn--danger btn--block" onClick={() => setConfirmReset(true)}>
        <TriangleAlert size={16} />
        Borrar todos mis datos
      </button>

      <p className="small faint center" style={{ marginTop: 10 }}>
        {brand.name} · versión 1.0.0
      </p>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="¿Borrar todo?"
        footer={
          <>
            <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
            <button
              className="btn btn--danger"
              style={{ flex: 1 }}
              onClick={() => {
                resetAll()
                setConfirmReset(false)
              }}
            >
              Sí, borrar todo
            </button>
          </>
        }
      >
        <p className="empty__text" style={{ maxWidth: 'none' }}>
          Se borran tus cuentas, movimientos, pagos, metas y notas. Las categorías vuelven a las
          iniciales. <strong>Esto no se puede deshacer.</strong>
        </p>
      </Sheet>
    </div>
  )
}
