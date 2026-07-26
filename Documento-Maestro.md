# 🎸 Julian App — Documento Maestro

> **Una sola fuente de verdad.** Consolida todo lo definido en `Cuestionario-00-MEGA.md`.
> Si algo aquí no cuadra, se cambia **antes** de seguir programando.
> Fecha de cierre de definición: **2026-07-26**.

---

## 1. Qué es y para quién

App **PWA de finanzas personales** para **Julián**, que administra refrigerios para una cadena
de casinos. Una sola usuario. Es un **encargo pagado**, no un regalo.

**El problema real que resuelve** (respuesta 1.3):
1. No sabe en qué se le va la plata.
2. Se le olvidan pagos y le llegan recargos.

**Perfil de uso** (1.5): la abre **una vez al día en la noche**, los **fines de semana** a revisar,
y a veces **solo cuando se acuerde**. No la va a abrir en el momento del gasto.

**Restricción central** (1.2, 1.4, 3.5): Julián **no es técnico**. La app debe entenderse sola.
Si hay que explicarle algo, está mal diseñado. Nada de flujos complejos, nada que parezca demo.

**Sensación objetivo** (9.1): **empresarial, seria, financiera**, con un **toque rockero clásico**.
**Nunca:** infantil, enredada, genérica, ni con pinta de proyecto sin terminar.

**Plataforma:** PWA instalable, **Android** (7.1). Funciona **offline** y sincroniza después (7.2).
**Moneda: solo COP** (2.2).

---

## 2. Decisiones que resolví (choques entre respuestas)

Esto es importante: hubo puntos donde tus respuestas se contradecían. Así los resolví.

| # | El choque | Resolución |
|---|---|---|
| **D1** | En 3.6 marcaste **NO a todas** las opciones de "módulo personal" — incluida la opción "Nada, que sea solo cuentas" | **No hay módulo personal.** La app es solo finanzas. La identidad se la da la **estética** (rock clásico), no un módulo extra. Coherente con 9.1 y con "sin mascota". |
| **D2** | 3.4 "¿tus 3 imprescindibles?" → *"no sé jaja"* | Los deduzco de 1.3 y 1.4: **(1)** ver el saldo de todo de un vistazo, **(2)** saber en qué se va la plata (gráficas + resumen), **(3)** no olvidar pagos (recordatorios + calendario). Todo lo demás es secundario. |
| **D3** | 1.7 la llamas **"Julian App"**, pero 1.8 dice que es **base reutilizable para revender** | Se construye **sin nada hardcodeado**: nombre, colores, logo y categorías base salen de **un solo archivo** (`src/config/brand.ts`). Para revenderla se cambia ese archivo y ya. Se entrega como "Julian App". |
| **D4** | 7.5 **sin onboarding** + 2.1 **sin cuentas precargadas** = Julián abre la app y ve una pantalla vacía | Se compensa con **empty states que enseñan**: la pantalla vacía ES el tutorial. Un botón grande "Crear mi primera cuenta" con ejemplos sugeridos (Efectivo, Nequi, Bancolombia) de un toque. Sin pasos, sin wizard. |
| **D5** | 3.3: **NO** presupuesto mensual, pero **SÍ** proyección "a este ritmo terminas en X" | La proyección **no depende de presupuesto**: se calcula con el ritmo de gasto de los días transcurridos del mes, proyectado al cierre, y se compara contra el mes anterior. |
| **D6** | 3.3: **NO** gastos recurrentes automáticos, pero **SÍ** calendario de pagos del mes | El calendario se alimenta de los **recordatorios de pago** (que sí están en el núcleo). Nada se registra solo; Julián confirma cada pago con un botón. Es más seguro y es lo que él espera. |
| **D7** | 2.5: **SÍ** cuentas de tipo persona (le debo / me deben), pero 3.3: **NO** módulo de deudas con abonos | Se hereda el sistema de cuentas `person` de Dahia (se archivan solas al llegar a cero), **sin** módulo aparte de deudas. Un abono es simplemente un movimiento a esa cuenta. |
| **D8** | 4.1 tema **claro** por defecto + 4.5 rock **clásico** (dorado, cuero, vintage) | El claro **no es blanco de banco**: es **papel crema vintage**, tipo funda de disco. Así el "claro" y el "rock clásico" conviven. Confirmado contigo. |
| **D9** | 3.3 **SÍ** asistente "¿en qué gasté más este mes?" | Es un **Resumen inteligente sin IA**: respuestas ya calculadas, instantáneas, offline, gratis y sin posibilidad de equivocarse. Julián no escribe nada, solo lee. Confirmado contigo. |
| **D10** | Sin gamificación (5.1) + la abre "cuando se acuerde" (1.5) | Sin racha, **la única razón para volver son los recordatorios**. Por eso el popup de pagos pendientes al abrir es una pieza **crítica**, no decorativa. Se le da peso de diseño. |

---

## 3. Identidad visual

### 3.1 Concepto
**"Contabilidad de tabernáculo"**: papel crema envejecido, cristal ahumado, carmesí de acento,
dorado viejo en detalles. Se ve **caro y serio**, con la calidez de una funda de vinilo de los 70.
Minimalista, no recargado.

### 3.2 Paleta

**Tema claro — "Papel"** (por defecto):
- Fondo: crema cálido con degradado radial suave (`#f6efe3 → #eee3d1`)
- Superficies: cristal blanco ahumado, 60% opacidad, `backdrop-filter: blur(18px)`
- Acento: **carmesí vino** `#9e1b32`
- Secundario: **dorado viejo** `#b08334`
- Texto: casi negro cálido `#2b2320`

**Tema oscuro — "Cuero"**:
- Fondo: madera/cuero oscuro (`#1e1815 → #14100e`)
- Superficies: cristal ámbar muy tenue, `blur(20px)`
- Acento: carmesí más luminoso `#d94962`
- Secundario: dorado `#d9a854`

**Colores por tipo de movimiento** (semánticos, en versión vintage apagada):
- Ingreso = **verde botella** `#3f7d55`
- Gasto = **carmesí** (el color de acento)
- Transferencia = **azul acero** `#5a6b8c`
- Ajuste = dorado

### 3.3 Detalles de estética (4.3 "Presente", 4.4 "clásico con vinilos")
- **Textura de grano sutil** en el fondo (papel/vinilo), muy tenue.
- **Gráfica de gastos estilo ecualizador** (barras verticales) en vez de barras genéricas.
- **Disco de vinilo** como forma de la gráfica de torta: anillo con surcos y etiqueta central.
- **Barras de progreso estilo VU meter** en las metas de ahorro.
- **Micro-animaciones por todos lados**, sutiles (4.9): números que cuentan hacia arriba, sheets
  que entran con física suave, filas que aparecen escalonadas, el vinilo que gira despacio al cargar.
  *"Que se sienta viva sin saturar."*
- **Glassmorphism sutil** (4.6): igual de discreto que Dahia. Nada de vidrio exagerado.

### 3.4 Tipografía (4.7)
- **Interfaz:** Inter (sans moderna, legible, seria).
- **Montos:** una **mono tabular** (JetBrains Mono / Geist Mono) — los números alineados se ven
  profesionales y se leen rápido.
- Decimales en tamaño reducido, como Dahia.

### 3.5 Iconos (4.8)
- **Lucide** (SVG) para toda la interfaz.
- **Emojis** solo para categorías y cuentas, que los elige Julián.

### 3.6 Formato del dinero (2.10)
`$1.250.000,00` con decimales pequeños. Ojito 👁 para ocultar el saldo.
Montos guardados **en centavos, enteros y siempre positivos** — el tipo de movimiento define el signo.

### 3.7 Tono de los textos (7.6)
Español, **de tú, directo y seco**. Sin cariñitos, sin jerga rockera, sin chistes.
Frases cortas. La app no habla de más.

---

## 4. Modelo de datos

Heredado de Dahia-App, con los cambios que pediste.

```ts
Profile      { userName, theme, hideBalance, createdAt }
Account      { id, name, emoji, color, kind: 'normal'|'person', archived, deleted, order, createdAt }
Category     { id, name, emoji, color, kind: 'income'|'expense', order, createdAt }   // ← SEPARADAS (2.6)
Movement     { id, type: 'income'|'expense'|'transfer'|'adjust', amount, accountId,
               toAccountId?, categoryId?, note?, direction?, date, createdAt }
Reminder     { id, name, emoji?, amount?, accountId?, periodic, freq, nextDate, note?, active, done?, createdAt }
Note         { id, emoji?, title?, body?, items?, isChecklist, color, pinned, createdAt, updatedAt }
SavingsGoal  { id, name, emoji, color, target, saved, deadline?, accountId?, done, createdAt }  // ← NUEVO
```

**Se elimina de Dahia:** `Gamification`, `Cycle`, `TokenEntry`, `WorkStats`.

**Reglas de negocio heredadas** (están probadas, no se tocan):
- Las cuentas **no se borran, se archivan**; conservan su historial y pueden ir en negativo.
- **No hay campo de saldo inicial**: se pone con un movimiento tipo **ajuste**, que mueve el saldo
  pero no cuenta como ingreso en las estadísticas (2.9).
- Las **transferencias** no cuentan como ingreso ni gasto.
- Los movimientos se **editan y borran**, y la app **recalcula** todos los saldos.
- Las cuentas de tipo `person` se **auto-archivan** cuando su saldo llega a cero.

**Cambio propio:** las categorías **están atadas a ingreso o gasto** (2.6). Al registrar un gasto
solo aparecen categorías de gasto, y viceversa. Menos opciones en pantalla = menos confusión,
que es justo lo que pide 1.4.

---

## 5. Alcance

### ✅ Incluido en la entrega
| Módulo | Origen |
|---|---|
| Cuentas: saldo, archivar, negativo, tipo persona | Dahia |
| Movimientos: ingreso / gasto / transferencia / ajuste | Dahia |
| Categorías con emoji y color, **separadas por tipo** | Adaptado |
| Historial con filtros, editable, con recálculo de saldos | Dahia |
| Estadísticas por categoría (semana / mes) | Dahia |
| Recordatorios de pago + popup al abrir | Dahia |
| Tema claro / oscuro | Dahia |
| Notas y pendientes | Dahia |
| **Gráficas**: vinilo (torta), ecualizador (barras), evolución del saldo | Nuevo |
| **Resumen inteligente** sin IA | Nuevo |
| **Metas de ahorro** con progreso y fecha objetivo | Nuevo |
| **Comparativa** mes vs. mes anterior | Nuevo |
| **Proyección** de fin de mes | Nuevo |
| **Calendario** de pagos del mes | Nuevo |

### ❌ Fuera de alcance (decidido explícitamente)
Mascota · gamificación / racha / tienda · presupuestos por categoría · gastos recurrentes
automáticos · tarjetas de crédito con ciclo · módulo de deudas con abonos · exportar CSV/Excel/PDF ·
importar extracto bancario · multi-moneda · IA conversacional · módulo personal no financiero ·
onboarding · "estado de ánimo del mes".

---

## 6. Navegación

**Barra inferior de 5** (3.1), igual que Dahia:

`Inicio` · `Movimientos` · **`+`** · `Cuentas` · `Ajustes`

El botón **`+`** central pregunta primero **qué tipo** de movimiento es, y luego abre el formulario.

**Pantalla de Inicio** (3.2) muestra, en este orden:
1. Saldo total (con ojito para ocultar) y su variación respecto al mes pasado.
2. **Popup de pagos pendientes** si hay algo vencido, para hoy o para mañana. *(pieza crítica — D10)*
3. Fila de accesos rápidos: Resumen · Gráficas · Metas · Calendario · Notas.
4. Gasto del mes con la proyección de cierre.
5. Últimos movimientos.

Las pantallas secundarias (Estadísticas, Resumen, Metas, Calendario, Notas, Categorías) se
alcanzan desde Inicio y Ajustes, para no romper la barra de 5.

---

## 7. Stack técnico

| Pieza | Elección |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript 6 |
| Rutas | react-router-dom 7 |
| Animación | Framer Motion 12 |
| Estilos | **CSS puro con variables** (`global.css` + `ui.css`), sin Tailwind — igual que Dahia |
| Iconos | lucide-react |
| Gráficas | **SVG propio**, sin librería — para lograr el vinilo y el ecualizador |
| Datos | Capa `DataProvider` abstracta: `localProvider` (localStorage) + `firebaseProvider` (Firestore) |
| Auth | Firebase Auth con **Google** (popup + fallback a redirect) |
| Tests | Vitest sobre la lógica de saldos y cálculos (8.6) |
| Deploy | GitHub → Vercel |

**Mejora sobre Dahia:** las credenciales de Firebase van en **variables de entorno** (`.env`),
no escritas en el código fuente (6.2).

---

## 8. Infraestructura

| Servicio | Estado |
|---|---|
| **GitHub** | `casnackapp-cell/Julian-App` — ya existe, vacío, **público** (decidido). Faltan credenciales de esa cuenta para hacer push. |
| **Firebase** | **Pendiente.** El correo de Julián pide código de verificación de su celular. Se construye con `localProvider` y se conecta después sin tocar la UI. |
| **Vercel** | Cuenta existente del desarrollador. Se conecta al final. |

---

## 9. Cómo se trabaja

- **Todo de una** (8.1), pero con **mockup visual aprobado antes** de programar la app (8.2).
- Documentación: este archivo + `CLAUDE.md` con las reglas del proyecto (8.4).
- Mantenimiento posterior: el desarrollador (8.5).
- **Criterio de calidad explícito del cliente** (9.4):
  > *"Concéntrate en cada cosa hasta en detalles, no importa cuántos tokens gastemos ni tiempo,
  > pero no quiero que sea el camino rápido para entregarla, sino cada apartado con mucha lógica,
  > paciencia y que se note el esmero."*

---

## 10. Entrega

- Link de la PWA + instrucciones para instalarla desde el navegador de Android (7.4).
- Sin onboarding: entra directo (7.5).
- Firebase es el respaldo; no hay exportación a archivo (7.3).
