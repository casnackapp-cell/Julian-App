# 🎸 Julian App

PWA de finanzas personales. Cuentas, movimientos, gráficas y recordatorios de pago,
en español y pensada para el celular.

Estética: papel crema vintage con cristal ahumado, acento carmesí y un guiño de rock
clásico — la gráfica de torta es un disco de vinilo y la de gastos, un ecualizador.

![captura](docs/captura-inicio.png)

---

## Empezar

```bash
npm install
npm run dev        # http://localhost:5173
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprueba tipos y compila a `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run test` | Tests de la lógica de dinero |
| `npm run lint` | Análisis estático |

---

## Cómo está armada

```
src/
  config/brand.ts      → nombre, colores y categorías base (lo único que se cambia al reutilizarla)
  data/
    types.ts           → modelo de datos
    provider.ts        → interfaz DataProvider
    localProvider.ts   → implementación con localStorage
    firebaseProvider.ts→ implementación con Firestore (pendiente)
    selectors.ts       → TODO cálculo derivado: saldos, estadísticas, proyecciones
  store/store.tsx      → estado global y reglas de negocio
  screens/             → una pantalla por archivo
  components/          → reutilizables, incluidas las gráficas SVG
  lib/                 → money, date, id (funciones puras)
  styles/              → global.css (variables) + ui.css (componentes)
```

### Las tres reglas que no se rompen

1. **El dinero son enteros en centavos, siempre positivos.** El signo lo define
   `movement.type`. Nunca punto flotante para guardar o sumar plata.
2. **Ningún componente calcula saldos.** Todo cálculo vive en `data/selectors.ts`,
   que son funciones puras y cubiertas por tests.
3. **Ningún componente habla con el almacenamiento.** Todo pasa por `DataProvider`,
   por eso `localProvider` y `firebaseProvider` son intercambiables sin tocar la UI.

Las reglas completas están en [`CLAUDE.md`](CLAUDE.md); las decisiones de producto
y por qué se tomaron, en [`Documento-Maestro.md`](Documento-Maestro.md).

---

## Datos

Hoy la app guarda en el dispositivo (`localStorage`), así que funciona sin cuenta y
sin señal. La capa de Firestore se enchufa cambiando una línea en `src/main.tsx`.

Las credenciales de Firebase van en `.env` (ver `.env.example`), nunca en el código.

---

## Despliegue

GitHub → Vercel. El `vercel.json` redirige todas las rutas a `index.html` porque es
una SPA. No hace falta configurar nada más.
