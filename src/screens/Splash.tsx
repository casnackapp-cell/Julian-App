/**
 * Pantalla de carga: el vinilo girando mientras se resuelve la sesión.
 *
 * Sin esto, al abrir la app se ve un parpadeo de la pantalla de entrada antes de
 * que Firebase confirme que la sesión ya existía, y parece que se cerró sola.
 */

export function Splash() {
  return (
    <div className="app">
      <div
        className="screen screen--plain"
        style={{ minHeight: '100dvh', justifyContent: 'center', alignItems: 'center' }}
      >
        <img
          src="/icon-512.png"
          alt="Cargando"
          width={72}
          height={72}
          style={{ animation: 'spin 2.6s linear infinite' }}
        />
      </div>
    </div>
  )
}
