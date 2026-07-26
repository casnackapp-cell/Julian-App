/**
 * Rutas de la app.
 *
 * Las cinco de la barra inferior van dentro de <Layout>; las secundarias se
 * montan sueltas para que ocupen toda la pantalla y se sientan un nivel adentro.
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { SheetsProvider } from './components/SheetsContext'
import { PaymentsDuePopup } from './components/PaymentsDuePopup'
import { InstallPrompt } from './components/InstallPrompt'

import { Home } from './screens/Home'
import { Movements } from './screens/Movements'
import { Accounts } from './screens/Accounts'
import { AccountDetail } from './screens/AccountDetail'
import { Settings } from './screens/Settings'
import { Categories } from './screens/Categories'
import { Stats } from './screens/Stats'
import { Summary } from './screens/Summary'
import { Goals } from './screens/Goals'
import { Payments } from './screens/Payments'
import { Notes } from './screens/Notes'
import { NotFound } from './screens/NotFound'

export function App() {
  return (
    <BrowserRouter>
      <SheetsProvider>
        <div className="app">
          <Routes>
            {/* Con barra inferior */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/movimientos" element={<Movements />} />
              <Route path="/cuentas" element={<Accounts />} />
              <Route path="/cuentas/:id" element={<AccountDetail />} />
              <Route path="/ajustes" element={<Settings />} />
            </Route>

            {/* Secundarias */}
            <Route path="/categorias" element={<Categories />} />
            <Route path="/graficas" element={<Stats />} />
            <Route path="/resumen" element={<Summary />} />
            <Route path="/metas" element={<Goals />} />
            <Route path="/pagos" element={<Payments />} />
            <Route path="/notas" element={<Notes />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <PaymentsDuePopup />
        <InstallPrompt />
      </SheetsProvider>
    </BrowserRouter>
  )
}
