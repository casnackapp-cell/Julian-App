import { Link } from 'react-router-dom'
import { Disc3 } from 'lucide-react'

export function NotFound() {
  return (
    <div className="screen screen--plain" style={{ justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="card">
        <div className="empty">
          <Disc3 size={38} className="empty__art" />
          <h1 className="empty__title">Esta página no existe</h1>
          <p className="empty__text">Se te fue la aguja del surco.</p>
          <Link to="/" className="btn btn--primary btn--sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
