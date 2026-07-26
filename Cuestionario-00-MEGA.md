# 🎸 Megacuestionario — App de Cuentas para Julián

> **Base:** replicamos la arquitectura de **Dahia App** (`dayanaceballosu-pixel/Dahia-App`), pero
> como **proyecto nuevo, repo nuevo, Firebase nuevo, Vercel nuevo**. Nada compartido.
>
> **Cómo responder:** escribe debajo de cada pregunta, con tus palabras. En las de opciones,
> marca con **X**. Donde veas ⭐ es mi recomendación — si te da igual, escribe **"default"**.
> No hay que responder todo de una; puedes ir por bloques.
>
> Al final de este documento hay un **resumen de las 8 respuestas que desbloquean todo**,
> por si quieres ir rápido.

---

# 📋 Lo que Dahia ya resuelve (y heredamos gratis)

Esto **no** hace falta que lo decidas — ya está probado y funcionando. Solo léelo para saber
de qué partimos:

| Pieza | Cómo está en Dahia |
|---|---|
| **Stack** | Vite 5 + React 18 + TypeScript 5.5 + react-router 6 + Framer Motion 11 |
| **Estilos** | CSS puro con variables (`global.css` + `ui.css`), sin Tailwind. Glassmorphism real: `backdrop-filter: blur(18px)` |
| **Temas** | Claro y oscuro completos, más `system` |
| **Datos** | Firebase Auth (Google) + Firestore. Cada usuario en `users/{uid}` con subcolecciones |
| **Offline** | Capa `DataProvider` abstracta con dos implementaciones: `localProvider` (localStorage) y `firebaseProvider`. Se puede correr sin nube |
| **Navegación** | Barra inferior de 5 pestañas con botón ➕ central que abre un *bottom sheet* |
| **Movimientos** | 4 tipos: `income`, `expense`, `transfer`, `adjust` (ajuste de saldo, no cuenta como ingreso) |
| **Montos** | Guardados en **centavos, siempre positivos**. El tipo define el signo. Decimales en tamaño pequeño |
| **Cuentas** | No se borran, se **archivan**. Pueden ir en negativo. Emoji + color libres |
| **Categorías** | **No** están atadas a ingreso/gasto — una misma categoría acumula ambos y muestra su neto |
| **PWA** | `manifest.json` + service worker + prompt de instalación, `display: standalone` |
| **Deploy** | GitHub → Vercel automático, con `vercel.json` para rutas SPA |
| **Gamificación** | Mascota (gato) + racha diaria + tienda de accesorios desbloqueables por racha |

**Lo que NO heredamos** (es específico de Dahia y hay que reemplazar o eliminar):
`Ciclo` menstrual · `TokenEntry`/`WorkStats` (tokens de webcam) · el gato kawaii ·
la paleta rosada · el banner de Haaland.

--- NO QUIERO NADA DE LA MASCOTA DAHIA ERA MAS PARA VER COMO FUNCIONABAN LAS CUENTAS NADA M;AS

# 🧭 BLOQUE 1 — Rumbo (quién y para qué)

**1.1 — ¿Quién es Julián?**
Cuéntame con tus palabras: edad aproximada, a qué se dedica, cómo gana plata (¿sueldo fijo?
¿freelance? ¿negocio propio? ¿varias fuentes?), si es organizado o desordenado con la plata.

> _Respuesta:_ Es un poco desorganizado se dedica a adminitrar refrigerios para una cadena de Casinos

---

**1.2 — En una frase, ¿qué es esta app para él?**
(La de Dahia fue: *"una app que sienta como propia, que le guste entrar y llevar sus cuentas,
que se vea muy limpia y muy kawaii pero funcional"*)

> _Respuesta:_ QUe pueda organizar sus cuentas saber en que gasta la plata y como tiene todo, debe ser muy intuitiva sin fujos complejos porque no le va mucho a la tegnologia

---

**1.3 — ¿Qué problema real le resuelve?**
- [ X] No sabe en qué se le va la plata
- [ X] Se le olvidan pagos y le llegan recargos
- [ ] Quiere ahorrar para algo concreto (¿qué? _______)
- [ ] Lleva todo en la cabeza / en notas del celular / en Excel
- [ ] Tiene varias fuentes de ingreso y no sabe cuál rinde más
- [ ] Tiene deudas y no lleva el control
- [ ] Otro: _______

---

**1.4 — ¿Qué NO quieres que sienta al usarla?**
(Dahia: *"que es sucia, que tiene mil opciones, que es caótica"*)

> _Respuesta:_ Que nno la entiende y tiene que preguntar como funciona o no sabe como ver facilmente sus cuentas

---

**1.5 — ¿Cuándo y dónde la va a abrir?**
- [ ] Varias veces al día, en el celular, en el momento del gasto
- [ X] Una vez al día, en la noche, a ponerse al día
- [ X] Los fines de semana, sentado a revisar
- [ X] Solo cuando se acuerde
- [ ] En el computador, no en el celular

---

**1.6 — ¿Julián sabe del regalo o es sorpresa?**
Esto importa: si sabe, le puedo hacer preguntas directas (sus cuentas reales, sus gastos fijos)
y la app queda mucho mejor calibrada.

> _Respuesta:_ Me esta pagando por hacerla pero hagamosla simple y que funcione no mas sin tanta prreguntadera a el

---

**1.7 — Nombre de la app**
Aparece en la pantalla de inicio del celular, en el instalador y en el repo.
- [ ] ⭐ Nombre corto tipo marca con guiño rock: *Riff · Amp · Bassline · Setlist · Encore · Tempo*
- [ ] Su nombre: *Cuentas Julián · Julián App*
- [ ] Tengo uno: _______ Julian App

---

**1.8 — ¿Esto es un regalo cerrado o una base para vender después?**
- [ ] ⭐ Regalo cerrado, a la medida de Julián
- [ x ] Base reutilizable — que la pueda revender a otros clientes cambiando cuatro cosas

*(Si es lo segundo, cambia el diseño: nada hardcodeado, todo configurable. Vale la pena saberlo desde ya.)*

---

# 💸 BLOQUE 2 — Las cuentas (el dinero)

**2.1 — ¿Qué cuentas maneja Julián de verdad?**
Lista las reales, con nombre: Nequi, Daviplata, Bancolombia ahorros, efectivo, tarjeta de crédito…

> _Respuesta:_ Dejemos que el las pueda crear cuando llegue el momento asi como dahia que sea facil crearlas

---

**2.2 — Moneda**
- [x  ] ⭐ Solo COP (pesos colombianos), como Dahia
- [ ] Solo _______
- [ ] Dos monedas (COP + USD), como soporta Dahia. ¿Por qué? _______

---

**2.3 — ¿Tiene varias fuentes de ingreso que quiera separar?**
Dahia separa webcam vs. tatuajes usando **categorías**, no cuentas. ¿A Julián le pasa algo parecido?

> _Respuesta:_ NO 
---

**2.4 — Tarjetas de crédito** *(Dahia no las maneja — esto sería nuevo)*
- [ x ] No tiene / no importa
- [ ] ⭐ Sí, pero simple: una cuenta más que puede ir en negativo
- [ ] Sí, completo: cupo, fecha de corte, fecha límite de pago, compras a cuotas

*Ojo: la opción 3 es un módulo entero. Vale la pena solo si de verdad la usa.*

---

**2.5 — ¿Le presta plata a gente / le deben?**
Dahia tiene cuentas de tipo `person` justo para esto (se archivan solas cuando el saldo llega a 0).
- [ x ] ⭐ Sí, heredamos ese sistema
- [ ] No, quítalo

---

**2.6 — Categorías de gasto**
Dahia arranca con 14 base (Comida 🍔, Mercado 🛒, Arriendo 🏠, Transporte 🚕, Salud 💊…).
¿Cuáles serían las de Julián? Piensa en las que **él** de verdad usaría.

> _Respuesta:_ Si las basicas pero que las pueda eliminar igual que las que el cree 

Y confirma el criterio de Dahia (recomendado ⭐):
- [ ] Una categoría acumula **ingresos y gastos** juntos y muestra el neto (ej. "Moto" suma lo que gasta en ella y lo que gana si la alquila)
- [ x ] No, prefiero categorías separadas de ingreso y de gasto

---

**2.7 — ¿Qué es lo MÍNIMO para registrar un gasto?**
Dahia pide: monto + cuenta + categoría, nota opcional, fecha/hora automáticas.
- [ x ] ⭐ Igual que Dahia
- [ ] Menos campos todavía (¿cuáles quitas? _______)
- [ ] Más campos (¿cuáles? _______)

---

**2.8 — ¿Qué campos extra quieres en un movimiento?** (marca los que sí)
- [ ] Comercio/lugar ("Éxito", "Uber")
- [ ] Etiquetas libres (#viaje, #regalo)
- [ ] Foto del recibo
- [ ] Método de pago
- [ ] Marcar "necesario vs. capricho"
- [ x ] Ninguno, con lo de Dahia basta ⭐

---

**2.9 — Saldo inicial de cada cuenta**
Dahia no tiene campo de "saldo inicial": se pone con un movimiento tipo **ajuste**, que cambia
el saldo pero no ensucia las estadísticas. Es elegante.
- [ x ] ⭐ Igual
- [ ] Prefiero un campo de saldo inicial normal

---

**2.10 — Formato del dinero**
Dahia: `$1.250.000,00` con los decimales en tamaño pequeño, y un ojito 👁 para ocultar el saldo.
- [ x ] ⭐ Igual
- [ ] Sin decimales (`$1.250.000`) — en COP los centavos casi no se usan
- [ ] Otro: _______

---

# 🏗️ BLOQUE 3 — Estructura y funciones

**3.1 — Navegación**
Dahia usa barra inferior de 5: 🏠 Inicio · 📜 Movimientos · **➕** · 💳 Cuentas · ⚙️ Ajustes.
- [ x ] ⭐ Igual (con iconos/nombres adaptados)
- [ ] Otras secciones: _______

---

**3.2 — ¿Qué ve Julián al abrir?**
Dahia muestra: saldo total, últimos movimientos, la mascota, avisos de pagos pendientes.
- [ x ] ⭐ Igual
- [ ] Otra cosa: _______ Sin mascota esta app es mas seria y se ve financiera con un toque rockero

---

**3.3 — Módulos** — marca los que quieres. Los ✅ ya existen en Dahia (salen casi gratis);
los 🆕 hay que construirlos desde cero.

**Núcleo (v1):**
- [x] ✅ Cuentas con saldo, archivar, negativo
- [x] ✅ Movimientos: ingreso / gasto / transferencia / ajuste
- [x] ✅ Categorías con emoji y color
- [x] ✅ Historial con filtros, editable y con recálculo de saldos
- [x] ✅ Estadísticas por categoría (semana / mes)
- [x] ✅ Recordatorios de pago con popup al entrar
- [x] ✅ Tema claro/oscuro
- [x] ✅ Notas / pendientes tipo sticker

**A decidir:**
- [ NO ] ✅ Mascota + racha + tienda de cosméticos *(ver bloque 5)*
- [ NO ] 🆕 **Presupuesto mensual por categoría** con barra y alerta al pasarse ⭐
- [ NO ] 🆕 **Gastos recurrentes / suscripciones** (distinto de recordatorio: se registra solo)
- [ SI ] 🆕 **Metas de ahorro** con barra de progreso y fecha objetivo ⭐
- [ SI ] 🆕 **Gráficas** de verdad (torta, barras, evolución del saldo) — Dahia solo tiene tablas
- [ NO ] 🆕 Deudas con abonos parciales *(si marcaste 2.5, ya va incluido a medias)*
- [  NO] 🆕 Exportar a CSV / Excel / PDF
- [ SI ] 🆕 Comparativa mes vs. mes anterior
- [ SI ] 🆕 Proyección: "a este ritmo terminas el mes en X"
- [ SI ] 🆕 Calendario de pagos del mes
- [ NO ] 🆕 Importar extracto del banco (CSV)
- [ SI ] 🆕 Asistente que responda "¿en qué gasté más este mes?"

---

**3.4 — De todo lo anterior: ¿cuáles 3 son IMPRESCINDIBLES?**
Si estas 3 no están, la app no sirve para Julián.

> _Respuesta:_ no se jaja

---

**3.5 — ¿Qué NO quieres que tenga?**
Cosas que la harían pesada o confusa.

> _Respuesta:_ Que sea enredado nada simple de usar y me toque estarle explicando es decr que no sea intuitiva y que parexca una demo y no algo profesional y completo

---

**3.6 — El "módulo personal"**
Dahia tiene dos módulos que son *suyos* y le dan alma a la app: **Ciclo** (menstrual) y
**Tokens** (metas de webcam). Son lo que la hace sentir propia y no genérica.

¿Cuál sería el equivalente para Julián? Algo suyo, que no sea plata, pero que le dé gusto abrir:
-  NO  ] 🎸 Su música: discos que quiere comprar, conciertos a los que quiere ir, equipo (guitarra, pedales) como metas de ahorro
- [ NO ] 🏋️ Rutina / gimnasio / hábitos con racha
- [ NO ] ⚽ Su equipo de fútbol, calendario de partidos
- [ NO ] 🎮 Videojuegos / colección
- [ NO ] 🏍️ Vehículo: mantenimientos, gasolina, kilometraje
- [ NO ] 📚 Lo que está leyendo / viendo
- [ NO ] Nada, que sea solo cuentas
- [ ] Otro: _______

*Este es el bloque que va a hacer que la app se sienta hecha para él. Piénsalo con calma.*

---

# 🎨 BLOQUE 4 — Estética: minimalista + glassmorphism + rock

**4.1 — Punto de partida**
Dahia es rosado pastel con degradado radial y cristal. Para Julián invertimos:
- [ ] ⭐ **Oscuro por defecto** (carbón/negro) con un acento fuerte — y modo claro también disponible
- [ X ] Claro por defecto, oscuro opcional
- [ ] Solo oscuro, sin modo claro

---

**4.2 — Color de acento** *(el que reemplaza al rosa `#ff7fb3` de Dahia)*
- [ X ] ⭐ Rojo carmesí / vino — rock clásico, se ve caro
- [ ] Ámbar / dorado — vibra de amplificador vintage
- [ ] Naranja quemado
- [ ] Morado eléctrico — glam
- [ ] Verde ácido — punk
- [ ] Azul acero — más sobrio, casi corporativo
- [ ] _______

---

**4.3 — ¿Cuánto rock? Calibremos "sin saturar"**
- [ ] ⭐ **Susurro** — solo paleta oscura, tipografía con carácter, logo. Nadie diría "app de rock", pero se siente. Máxima seriedad.
- [ X ] **Presente** — lo anterior + textura sutil de grano, algún icono con guiño, gráfica estilo ecualizador
- [ ] **Evidente** — lo anterior + los nombres de las secciones son temáticos (*Setlist*, *Backstage*, *Encore*) e ilustraciones

---

**4.4 — Guiños permitidos** (marca los que te gusten)
- [ ] Grano/ruido muy sutil en el fondo (textura de vinilo)
- [ ] Gráfica de gastos con forma de **ecualizador / waveform** ⭐
- [ ] Barras de progreso estilo **VU meter** (medidor de volumen)
- [ ] Iconos con guiño: púa, vinilo, ampli, jack
- [ ] Tipografía de títulos condensada, estilo póster de concierto
- [ ] Detalles metálicos / cromo en bordes
- [ ] Micro-animación tipo "cuerda que vibra" al registrar algo
- [ ] Ninguno, solo la paleta

Que se vea muy clasico por favor con vinilos y asi, mucha mini aminacion que se sienta viva sin saturar
---

**4.5 — ¿Qué rock le gusta a Julián?**
Cambia mucho el resultado final:
- [ X ] Clásico (Zeppelin, Queen, Pink Floyd) → dorado, cuero, vintage, cálido
- [ ] Metal → negro, plateado, tipografía angular, alto contraste
- [ ] Punk → crudo, collage, colores primarios
- [ ] Indie / alternativo → sobrio, tonos apagados, mucho aire
- [ ] Grunge / 90s → texturas gastadas, verdes y marrones
- [ X ] Rock latino / en español → _______
- [ ] Bandas concretas que le encantan: _______

---

**4.6 — Nivel de glassmorphism**
Dahia usa `blur(18px)` en claro y `blur(20px)` en oscuro, con superficies al 62% / 8% de opacidad.
- [ X ] ⭐ Igual de sutil — se ve profesional, no de demo
- [ ] Más marcado — que se note el vidrio
- [ ] Solo en modales y elementos flotantes

---

**4.7 — Tipografía**
Dahia usa la fuente del sistema (SF Pro / Segoe UI redondeadas).
- [ ] Fuente del sistema, como Dahia (carga instantánea, cero peso)
- [ X ] ⭐ Una sans moderna (Inter / Geist) + **una mono para los montos** — los números se ven mucho mejor
- [ ] Lo anterior + una display condensada solo para títulos (Bebas Neue, Oswald, Anton)

---

**4.8 — Iconos**
Dahia usa **emojis** para todo (categorías, cuentas, navegación). Es rápido y con personalidad,
pero en estética rock oscura los emojis se ven fuera de lugar.
- [ ] Emojis, como Dahia
- [X  ] ⭐ Iconos SVG (Lucide / Phosphor) para la interfaz + emojis solo para categorías y cuentas, que elige el usuario
- [ ] Iconos SVG para absolutamente todo

---

**4.9 — Animaciones**
Dahia usa Framer Motion, con animaciones "kawaii equilibradas".
- [ X ] ⭐ Sutiles: transiciones, hover, números que suben contando. Nada juguetón
- [ ] Ricas: gráficas que se dibujan, sheets con física, celebraciones
- [ ] Mínimas: que se sienta instantánea

---

**4.10 — Referencias visuales**
Mándame capturas o links de apps/webs que te gusten para esto.
*Sugerencias que encajan con lo que describes: Linear, Arc, Copilot Money, Monarch, Spotify (modo oscuro), Cred.*

> _Respuesta:_

---

**4.11 — Logo**
- [ ] ⭐ Que lo genere yo (símbolo simple + tipografía)
- [ ] Ya tengo uno: _______
- [ ] Solo el nombre en texto
Dame un buen promt para un buen logo pero no algo generico un logo que represente la app sin salir de lo minimalista cuando me des el promt yo lo creo con ia generativa
---

# 🐾 BLOQUE 5 — Mascota y gamificación

Dahia tiene un gato vectorial con animaciones ociosas, frases al tocarlo, racha diaria y una
tienda de ~40 accesorios desbloqueables. Es una parte **grande** del proyecto.

**5.1 — ¿Julián quiere mascota?**
- [ ] Sí, pero **no un gato kawaii** — algo con actitud: _______
- [ ] ⭐ No mascota, pero **sí racha** y logros (mucho más sobrio y profesional)
- [ x ] Ni mascota ni gamificación, cero
- [ ] Sí, igual que Dahia pero con otro personaje

---

**5.2 — Si dijiste "sí racha": ¿qué se desbloquea?**
Dahia desbloquea accesorios cosméticos por días de racha.
- [ ] ⭐ Temas visuales / paletas alternativas (rojo, ámbar, morado…) que se van ganando
- [ ] Insignias/logros tipo "3 meses sin pasarte del presupuesto"
- [ ] Portadas o fondos estilo álbum de disco
- [ ] Nada que desbloquear, solo el número de la racha
- [ ] Otro: _______

---

**5.3 — ¿La racha debe ser exigente?**
En Dahia, si falta un día la racha vuelve a 0 (pero el récord histórico se conserva y desbloquea cosas).
- [ ] ⭐ Igual
- [ ] Más permisiva (perdona 1 día)
- [ ] No aplica

---

**5.4 — Idea alternativa, para que la consideres**
En vez de mascota: un **"estado de ánimo del mes"** que cambia el color y la textura del fondo
según cómo vas — verde si estás bajo presupuesto, ámbar si vas justo, rojo si te pasaste.
Cero infantil, muy visual, y encaja con lo del ecualizador.
- [ ] Me gusta, agrégalo
- [x ] No

---

# 🔐 BLOQUE 6 — Cuentas de servicio (GitHub, Firebase, Vercel)

Pediste **todo nuevo**. Esto es lo que hay que crear — dime qué prefieres en cada uno.

**6.1 — GitHub**
- [ ] Crear una cuenta nueva para este proyecto — usuario/email deseado: _______
- [ x  ] Usar una tuya existente: _______https://github.com/casnackapp-cell/Julian-App.git
- [ ] Crear una cuenta que sea de Julián y quede a su nombre

Nombre del repo: _______ *(sugerencia: el slug del nombre de la app)*
- [ ] ⭐ Privado
- [ ] Público

---

**6.2 — Firebase**
- [ ] ⭐ Proyecto nuevo, con la misma cuenta de Google que GitHub
- [ ] Cuenta de Google distinta: _______ AHorita la creo

⚠️ **Una cosa a mejorar respecto a Dahia:** ahí las credenciales de Firebase están escritas
directamente en `src/firebase/config.ts` y subidas al repo. En Firebase Web esas claves son
públicas por diseño (la seguridad real está en las reglas de Firestore), así que **no es una
fuga**, pero es mejor práctica moverlas a variables de entorno.
- [ X ] ⭐ Sí, hagámoslo con variables de entorno en el proyecto nuevo
- [ ] Da igual, como Dahia

---

**6.3 — Método de login**
Dahia usa **Google** (con popup y fallback a redirect, necesario para PWA en iPhone).
- [ X ] ⭐ Google, igual
- [ ] Email + contraseña
- [ ] Google + email
- [ ] Sin login: todo local en el dispositivo *(más simple y privado, pero si pierde el celular pierde los datos)*
- [ ] Login + PIN de 4 dígitos al abrir ⭐ *(recomiendo agregarlo, es plata de por medio)*

---

**6.4 — Vercel**
- [ ] ⭐ Cuenta nueva, conectada al GitHub nuevo
- [X  ] Tu cuenta existente 

Yo la conecto al final no problem

¿Dominio propio?
- [ x ] No, el `.vercel.app` está bien ⭐
- [ ] Sí: _______

---

**6.5 — ¿Quieres que te haga la guía paso a paso?**
Dahia tiene un `Guia-Cuentas-Firebase-GitHub-Vercel.md` con el clic a clic.
- [ ] ⭐ Sí, hazme la guía y yo creo las cuentas
- [ ] No, ya sé hacerlo
- [ x ] Créalas tú si puedes *(ojo: los signups piden verificación de correo/teléfono, hay pasos que tienes que hacer tú sí o sí)*

En lo posible, vamos a hacer que tu conectes y crees todo si toca instalar algo lo hacemos pero yo hago muchas apps entonces entre mas automatico quede mucho mejor obviamente preguntandome bien las cuentas porque yo tengo muchas apps y t odas en correos diferentes 

---

# 📱 BLOQUE 7 — Plataforma y entrega

**7.1 — ¿Dónde la usa Julián?**
Dahia es PWA optimizada para iPhone.
- [ x ] ⭐ PWA instalable (funciona en Android y iPhone, se instala desde el navegador)
- [ ] PWA pero optimizada para Android
- [ ] APK de Android de verdad (con Capacitor) — ya tienes la skill `instalar-app-mobil`
- [ ] Web de escritorio
- [ ] Celular + escritorio, ambos bien

**Celular de Julián:** [ x ] Android  [ ] iPhone  [ ] _______ Creo

---

**7.2 — ¿Debe funcionar sin internet?**
Dahia tiene la capa local lista para esto.
- [ x ] ⭐ Sí, que se pueda registrar sin señal y sincronice después
- [ ] No hace falta, siempre tiene datos

---

**7.3 — Respaldos**
- [ x ] ⭐ Firebase ya es el respaldo (está en la nube)
- [ ] Además, botón de "exportar todo a archivo"
- [ ] Respaldo automático programado

---

**7.4 — ¿Cómo se la entregas?**
- [ x ] ⭐ Link + le muestras cómo instalarla desde el navegador
- [ ] Se la instalas tú en su celular
- [ ] Archivo APK por WhatsApp

---

**7.5 — Onboarding la primera vez**
Dahia: saluda, pide el nombre de la mascota, crea las primeras cuentas.
- [ ] ⭐ Sí, 3-4 pasos: nombre → cuentas y saldos → categorías → listo
- [ ] Sí, y además precargado con sus datos reales si me los pasas
- [ x ] No, que entre directo

---

**7.6 — Idioma y tono de los textos**
Dahia habla de tú, cariñoso, y la llama por su nombre.
- [ x ] Español, de tú, directo y seco ⭐
- [ ] Español, de tú, con humor
- [ ] Español neutro/formal
- [ ] Español con jerga rockera *(cuidado: envejece rápido y cansa)*

---

# ⚙️ BLOQUE 8 — Cómo trabajamos

**8.1 — ¿Por fases o de una?**
- [ ] ⭐ Por fases: v1 núcleo funcionando → revisas → v1.1 extras → v2. Ves avances pronto
- [ x ] Todo de una, me avisas cuando esté lista

---

**8.2 — ¿Quieres aprobar el diseño antes de que programe?**
- [ x ] ⭐ Sí — te hago un mockup navegable de 2-3 pantallas para que apruebes la estética. Dahia hizo justo esto con `Muestra-Gatito-Dahia.html`
- [ ] No, arranca y ajustamos sobre la marcha

---

**8.3 — ¿Para cuándo la necesitas?** *(¿cumpleaños? ¿fecha concreta?)*

> _Respuesta:_ Para ya ahorita mas tarde 

---

**8.4 — Documentación del proyecto**
- [ x ] ⭐ Sí: `Documento-Maestro.md` (fuente única de verdad, como el de Dahia) + `CLAUDE.md` con las reglas del proyecto
- [ ] Solo lo mínimo

---

**8.5 — ¿Quién mantiene la app después?**
- [ x ] ⭐ Tú, conmigo
- [ ] Se entrega y listo

---

**8.6 — ¿Tests automatizados?**
- [ x ] Sí, al menos en la lógica de saldos y cálculos ⭐ *(son montos: un error ahí destruye la confianza en la app)*
- [ ] No, proyecto personal

---

# 💬 BLOQUE 9 — Abiertas

**9.1 — ¿Qué haría que Julián diga "esto está hecho para mí"?**
El detalle personal. En Dahia fue el gato y el módulo de ciclo.

> _Respuesta:_ Que se sienta empresarial y con su toque rockero clasico

---

**9.2 — ¿Ha probado alguna app de finanzas y la abandonó? ¿Por qué?**

> _Respuesta:_ No que yo sepa

---

**9.3 — ¿Algo que quieras copiar tal cual de Dahia, o algo de Dahia que NO te gustó?**

> _Respuesta:_ No, no se jaja 

---

**9.4 — Cualquier cosa que se me haya escapado**

> _Respuesta:_ Por ahora lo veo bien concentrate en cada cosa hasta en detalles no importa cuantos tokens gasetemos ni tiempo pero no quiero que sea el camino rapido para entregarla si no cada apartado con mucha logica paciencia y que se note el esmero 

---

---

# ⚡ Las 8 respuestas que desbloquean todo

Si quieres que arranque ya, respóndeme solo esto:

| # | Pregunta | Ref. |
|---|---|---|
| 1 | **Nombre** de la app | 1.7 |
| 2 | **Color de acento** y **cuánto rock** (susurro / presente / evidente) | 4.2 + 4.3 |
| 3 | Tus **3 funciones imprescindibles** | 3.4 |
| 4 | El **módulo personal** de Julián (lo que no es plata) | 3.6 |
| 5 | **¿Mascota, solo racha, o nada?** | 5.1 |
| 6 | **Login**: Google, o local sin cuenta | 6.3 |
| 7 | **Celular** de Julián: Android o iPhone | 7.1 |
| 8 | Sus **cuentas reales** y sus **categorías** | 2.1 + 2.6 |

Con esas ocho armo el **Documento Maestro** y el mockup visual. El resto lo podemos ir
afinando sobre la marcha.
