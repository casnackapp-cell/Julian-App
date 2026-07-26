/**
 * Barra inferior de cinco, con el botón de registrar en el centro.
 * Es toda la navegación de la app: si algo no se alcanza desde aquí o desde el
 * inicio, no existe para Julián.
 */

import { NavLink } from 'react-router-dom'
import { House, List, Plus, Settings, Wallet } from 'lucide-react'
import { useSheets } from './SheetsContext'

const ITEMS = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/movimientos', label: 'Movimientos', icon: List },
] as const

const ITEMS_RIGHT = [
  { to: '/cuentas', label: 'Cuentas', icon: Wallet },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
] as const

export function BottomNav() {
  const { openMovement } = useSheets()

  return (
    <nav className="nav" aria-label="Navegación principal">
      <div className="nav__inner">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}`}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}

        <button className="nav__fab" onClick={() => openMovement()} aria-label="Registrar movimiento">
          <Plus size={24} strokeWidth={2.4} />
        </button>

        {ITEMS_RIGHT.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}`}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
