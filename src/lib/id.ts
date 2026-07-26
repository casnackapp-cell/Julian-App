/**
 * Identificadores locales.
 *
 * No se usa el id que asigna Firestore: la app tiene que poder crear registros
 * sin conexión y sincronizarlos después, así que el id lo genera el cliente.
 */

/** Id corto, ordenable por tiempo y con suficiente azar para no chocar. */
export function newId(): string {
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `${time}${rand}`
}
