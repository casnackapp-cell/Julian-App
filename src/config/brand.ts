/**
 * ÚNICO archivo que se toca para revender la app a otro cliente.
 *
 * Nombre, textos de marca, colores de acento y categorías base salen todos de aquí.
 * Regla del proyecto: ningún componente escribe "Julián" ni un color de marca a mano.
 */

export const brand = {
  /** Nombre visible en la app, el manifest y el título del navegador. */
  name: 'Julian App',
  /** Nombre corto para el icono de la pantalla de inicio (máx ~12 caracteres). */
  shortName: 'Julian',
  /** Frase que acompaña al nombre en la pantalla de login. */
  tagline: 'Tus cuentas, claras.',
  /** Descripción del manifest de la PWA. */
  description: 'Controla tus cuentas, tus gastos y tus pagos del mes.',

  /** Nombre por defecto del usuario, hasta que lo cambie en Ajustes. */
  defaultUserName: 'Julián',

  /** Locale y moneda. La app es de una sola moneda por decisión de alcance. */
  locale: 'es-CO',
  currency: 'COP',
  currencySymbol: '$',

  /**
   * Colores de marca. Deben coincidir con las variables de src/styles/global.css.
   * Se duplican aquí porque el manifest y las metaetiquetas los necesitan en JS.
   */
  colors: {
    /** Carmesí vino: el acento. */
    primary: '#9e1b32',
    /** Dorado viejo: el secundario, para detalles. */
    gold: '#b08334',
    /** Fondo del tema claro ("Papel"), para el manifest y la barra del navegador. */
    paper: '#f3ead9',
    /** Fondo del tema oscuro ("Cuero"). */
    leather: '#1e1714',
  },
} as const

/** Paleta que se ofrece al crear cuentas y categorías. Tonos vintage, nada chillón. */
export const palette = [
  '#9e1b32', // carmesí
  '#b0483a', // teja
  '#b08334', // dorado viejo
  '#8a7b3f', // oliva
  '#3f7d55', // verde botella
  '#3d7a75', // verde azulado
  '#5a6b8c', // azul acero
  '#6a5a8c', // ciruela
  '#8c5a72', // vino claro
  '#7a6a5a', // topo
  '#a5644a', // cobre
  '#5c5f66', // grafito
] as const

/**
 * Categorías con las que arranca la app.
 * Julián puede editarlas y borrarlas todas, igual que las que cree él (respuesta 2.6).
 * Van separadas por tipo: al registrar un gasto solo se ven las de gasto.
 */
export const baseCategories: ReadonlyArray<{
  name: string
  emoji: string
  color: string
  kind: 'income' | 'expense'
}> = [
  // — Gastos —
  { name: 'Mercado', emoji: '🛒', color: '#3f7d55', kind: 'expense' },
  { name: 'Comida', emoji: '🍔', color: '#b0483a', kind: 'expense' },
  { name: 'Transporte', emoji: '🚗', color: '#5a6b8c', kind: 'expense' },
  { name: 'Arriendo', emoji: '🏠', color: '#7a6a5a', kind: 'expense' },
  { name: 'Servicios', emoji: '💡', color: '#b08334', kind: 'expense' },
  { name: 'Salud', emoji: '💊', color: '#3d7a75', kind: 'expense' },
  { name: 'Familia', emoji: '👨‍👩‍👦', color: '#8c5a72', kind: 'expense' },
  { name: 'Ropa', emoji: '👕', color: '#6a5a8c', kind: 'expense' },
  { name: 'Gustos', emoji: '🎸', color: '#9e1b32', kind: 'expense' },
  { name: 'Negocio', emoji: '📦', color: '#a5644a', kind: 'expense' },
  { name: 'Otros gastos', emoji: '📌', color: '#5c5f66', kind: 'expense' },

  // — Ingresos —
  { name: 'Sueldo', emoji: '💼', color: '#3f7d55', kind: 'income' },
  { name: 'Negocio', emoji: '📦', color: '#b08334', kind: 'income' },
  { name: 'Extras', emoji: '✨', color: '#3d7a75', kind: 'income' },
  { name: 'Otros ingresos', emoji: '📌', color: '#5c5f66', kind: 'income' },
]

/** Cuentas que se sugieren de un toque en el estado vacío (no hay onboarding). */
export const suggestedAccounts: ReadonlyArray<{ name: string; emoji: string; color: string }> = [
  { name: 'Efectivo', emoji: '💵', color: '#3f7d55' },
  { name: 'Nequi', emoji: '📱', color: '#6a5a8c' },
  { name: 'Daviplata', emoji: '📲', color: '#b0483a' },
  { name: 'Bancolombia', emoji: '🏦', color: '#b08334' },
  { name: 'Ahorros', emoji: '🐖', color: '#5a6b8c' },
]
