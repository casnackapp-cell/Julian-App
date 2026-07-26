/**
 * Red de seguridad. Un error de render en cualquier pantalla dejaría la app en
 * blanco, y Julián no tendría forma de saber qué pasó ni cómo salir.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="app">
        <div className="screen screen--plain" style={{ justifyContent: 'center', minHeight: '100dvh' }}>
          <div className="card">
            <div className="empty">
              <TriangleAlert size={34} className="empty__art" />
              <h1 className="empty__title">Algo se rompió</h1>
              <p className="empty__text">
                Tus datos están a salvo. Recarga la app y sigue donde ibas.
              </p>
              <button className="btn btn--primary" onClick={() => window.location.reload()}>
                <RotateCcw size={17} />
                Recargar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
