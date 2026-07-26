# Conectar Firebase

Casi todo lo hago yo por terminal. Solo hay **dos momentos** que exigen que tú
hagas clic, porque piden abrir un navegador y elegir cuenta.

---

## Paso 1 — Autenticar la cuenta (lo haces tú)

En tu terminal:

```bash
firebase login:add
```

Se abre el navegador. **Elige `casnack.app@gmail.com`** y acepta los permisos.

Tu cuenta `jostivtrb@gmail.com` sigue ahí; esto solo añade una segunda. Puedes
verlas con `firebase login:list`.

Cuando termines, avísame. De aquí yo sigo con:

- crear el proyecto de Firebase,
- registrar la app web,
- escribir el `.env` con las credenciales,
- crear la base de Firestore,
- publicar las reglas de seguridad.

---

## Paso 2 — Activar el ingreso con Google (lo haces tú, 3 clics)

Esto **no se puede hacer por terminal**: la CLI de Firebase no expone los
proveedores de autenticación. Son tres clics en la consola.

1. Entra a https://console.firebase.google.com con `casnack.app@gmail.com`
2. Abre el proyecto **Julian App**
3. Menú izquierdo → **Authentication** → botón **Comenzar**
4. Pestaña **Sign-in method** → **Google** → interruptor **Habilitar**
5. Te pedirá un *correo de asistencia del proyecto*: elige `casnack.app@gmail.com`
6. **Guardar**

---

## Paso 3 — Autorizar el dominio de Vercel (cuando despleguemos)

Google solo permite entrar desde dominios en lista blanca. `localhost` ya viene
autorizado, pero el de Vercel hay que añadirlo o Julián verá un error al entrar.

1. **Authentication** → pestaña **Settings** → **Authorized domains**
2. **Add domain** → pega el dominio que te dé Vercel
   (algo como `julian-app.vercel.app`)

---

## Comprobar que quedó bien

```bash
npm run dev
```

Abre http://localhost:5173. Deberías ver la pantalla de entrada con el logo y el
botón **Entrar con Google**. Si entra y llegas al inicio, está listo.

Si en vez de eso entras directo sin pedir cuenta, es que el `.env` no se cargó:
la app está diseñada para caer al modo local cuando faltan las credenciales, en
vez de romperse.

---

## Nota sobre las claves

Las credenciales de Firebase Web **son públicas por diseño** — van dentro del
JavaScript que descarga cualquiera. La seguridad real está en
[`firestore.rules`](../firestore.rules), que solo deja a cada usuario leer y
escribir lo que cuelga de su propio `users/{uid}`.

Aun así las ponemos en `.env` (que no se sube al repo) para poder cambiar de
proyecto sin tocar el código, que es lo que hará falta al reutilizar la app con
otro cliente.
