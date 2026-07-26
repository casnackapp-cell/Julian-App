# CLAUDE.md — Julian App

Reglas del proyecto. Léelas antes de tocar código.
La fuente de verdad del alcance y las decisiones es `Documento-Maestro.md`.

---

## Qué es

PWA de finanzas personales para **Julián** (Android, español, COP).
Arquitectura copiada de `github.com/dayanaceballosu-pixel/Dahia-App`, adaptada.

**El usuario final no es técnico.** Si una pantalla necesita explicación, está mal.

---

## Reglas duras

### Dinero
- Los montos se guardan **en centavos, como enteros, siempre positivos**.
  El signo lo define `movement.type`, nunca el número.
- **Nunca usar float para dinero.** Nada de `0.1 + 0.2`.
- Todo cálculo de saldo vive en `src/data/selectors.ts`. No calcular saldos en componentes.
- Formato: `$1.250.000,00` (es-CO), decimales en tamaño reducido. Usar `<Money />`, no formatear a mano.

### Modelo de datos
- Las **cuentas no se borran**, se archivan (`archived: true`). Conservan historial.
- **No hay campo de saldo inicial.** Se usa un movimiento `adjust`, que mueve el saldo pero
  **no** cuenta como ingreso ni gasto en estadísticas.
- Las **transferencias** no son ingreso ni gasto.
- Las **categorías tienen `kind: 'income' | 'expense'`** y solo se muestran las del tipo que
  corresponde. (Esto difiere de Dahia, donde eran compartidas — fue una decisión explícita.)
- Las cuentas `kind: 'person'` se auto-archivan cuando su saldo llega a cero.

### Datos y persistencia
- Toda escritura pasa por la interfaz `DataProvider` (`src/data/provider.ts`).
  **Ningún componente habla con Firestore ni con localStorage directamente.**
- `localProvider` y `firebaseProvider` deben ser intercambiables sin tocar la UI.
- Firestore rechaza `undefined`: sanear los objetos antes de escribir.

### Marca y reventa
- El proyecto es una **base reutilizable**. Nombre, colores, logo, categorías base y textos de
  marca viven **solo** en `src/config/brand.ts`.
- **Nunca escribir "Julián" ni "Julian App" hardcodeado** en componentes. Siempre desde `brand`.

### Estilos
- CSS puro con variables. **No instalar Tailwind ni librerías de componentes.**
- Todos los colores salen de variables CSS de `src/styles/global.css`.
  **Ningún hex suelto en un componente.**
- Tema claro = "Papel" (crema vintage). Tema oscuro = "Cuero". Ambos completos, siempre.
- Glassmorphism **sutil**: `blur(18px)` claro / `blur(20px)` oscuro. No exagerar.

### Gráficas
- **SVG escrito a mano**, sin librería de gráficas. Las formas son parte de la identidad:
  torta = disco de vinilo con surcos; barras = ecualizador; progreso = VU meter.

### Animación
- Framer Motion, **sutil**: transiciones, números que cuentan, entradas escalonadas.
  Nada juguetón ni infantil. "Viva sin saturar."
- Respetar `prefers-reduced-motion`.

### Secretos
- Credenciales de Firebase en `.env` (`VITE_FIREBASE_*`), nunca en el código.
- `.env` va en `.gitignore`. Mantener `.env.example` actualizado.
- **El repo es público.** Nada sensible en el árbol.

---

## Lo que NO lleva

No agregar sin pedir permiso: mascota, gamificación, racha, presupuestos por categoría,
gastos recurrentes automáticos, tarjetas de crédito con ciclo, exportar/importar archivos,
multi-moneda, IA conversacional, onboarding.

Fueron decisiones explícitas del cliente, no olvidos.

---

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # typecheck + build de producción
npm run preview    # servir el build
npm run test       # tests de la lógica de dinero
```

---

## Estructura

```
src/
  config/brand.ts      → nombre, colores de marca, categorías base (lo único que se cambia al revender)
  data/
    types.ts           → modelo de datos
    provider.ts        → interfaz DataProvider
    localProvider.ts   → implementación localStorage
    firebaseProvider.ts→ implementación Firestore
    seed.ts            → datos iniciales
    selectors.ts       → TODO cálculo derivado (saldos, estadísticas, proyecciones)
  store/store.tsx      → Context global, CRUD, reglas de negocio
  screens/             → una carpeta por pantalla
  components/          → reutilizables
  lib/                 → money, date, id, emoji (utilidades puras)
  styles/              → global.css (variables) + ui.css (componentes)
```

---

## Antes de dar algo por terminado

1. `npm run build` pasa sin errores ni warnings de TypeScript.
2. `npm run test` en verde.
3. Probado en **claro y oscuro**.
4. Probado en viewport de móvil (~390px) — es una PWA de Android.
5. Los estados vacíos se ven bien y **explican qué hacer** (no hay onboarding: el empty state
   es el tutorial).
