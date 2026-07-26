/**
 * Marco de las pantallas con barra inferior.
 * Las pantallas secundarias (gráficas, metas, notas…) se montan fuera de aquí
 * para que ocupen todo el alto y se sientan como un nivel más adentro.
 */

import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
