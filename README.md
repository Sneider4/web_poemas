# Sitio de Santiago a secas

Sitio de poesía de Santiago ([@santiago_a_secas__](https://instagram.com/santiago_a_secas__)),
con panel de administración para que él mismo cargue sus poemas, edite su biografía y modere
la comunidad, sin depender de un desarrollador.

Reemplaza al sitio anterior hecho en Google Sites.

## Stack

| Capa | Tecnología | Despliegue previsto |
|---|---|---|
| Frontend | Angular 21 LTS (standalone, signals, zoneless, SSR) | Vercel |
| Estilos | Bootstrap 5.3 personalizado con SCSS | — |
| Backend | Node + Express + TypeScript | Railway |
| Base de datos | PostgreSQL 17 + Prisma | Railway |

## Estructura

```
pagina_santiago/
├── frontend/          # Angular 21
│   └── src/app/
│       ├── core/      # servicios, guards, interceptores, modelos (singletons)
│       ├── shared/    # componentes reutilizables sin lógica de negocio
│       ├── layout/    # cabecera, pie y envoltorio del sitio público
│       └── features/  # home, poems, author, community, admin
├── backend/           # Express + Prisma
│   ├── prisma/        # schema.prisma y seed
│   └── src/
│       ├── config/    # validación de variables de entorno
│       ├── middleware/# auth, errores, rate limit, validación
│       ├── modules/   # author, poems, community, admin-auth
│       │              # cada uno: routes -> controller -> service -> schema
│       ├── routes/    # ensamblado de la API
│       └── utils/     # slugify, hash de IP, errores HTTP
└── package.json       # scripts para levantar todo junto
```

Cada módulo del backend separa responsabilidades en cuatro archivos: `*.routes.ts` (URLs y
middleware), `*.controller.ts` (entrada/salida HTTP), `*.service.ts` (lógica y acceso a datos)
y `*.schema.ts` (validación con zod).

## Puesta en marcha

### 1. Requisitos

- Node 22.12+ (probado con 24.18.1)
- PostgreSQL 17 corriendo en local

### 2. Instalar dependencias

```bash
npm run install:all
```

Si npm avisa sobre *install scripts* bloqueados, aprobalos (Prisma los necesita):

```bash
cd backend && npm approve-scripts prisma @prisma/client @prisma/engines esbuild
```

### 3. Configurar el entorno

```bash
cp backend/.env.example backend/.env
```

Editá `backend/.env` con los datos de tu PostgreSQL. Generá los secretos con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Crear la base y sembrarla

```bash
createdb santiago_dev          # o desde pgAdmin
npm run db:migrate
npm run db:seed
```

El seed carga el usuario admin, la biografía y los 25 poemas del sitio anterior.

Al panel se entra con **usuario y contraseña** (no con correo). Los valores salen de
`ADMIN_USERNAME` y `ADMIN_INITIAL_PASSWORD` en `backend/.env`.

El seed también imprime un **código de recuperación** por única vez. Guardalo: sirve para
poner una contraseña nueva si se olvida.

> ⚠️ **Antes de desplegar, cambiá la contraseña.** El panel queda expuesto en internet
> y las claves cortas o predecibles son lo primero que prueban los bots. Se cambia desde
> **Panel → Seguridad**, sin tocar la base.

## Contraseña y recuperación

**Panel → Seguridad** tiene las dos cosas:

- **Cambiar la contraseña** — pide la actual, exige mínimo 8 caracteres y cierra la sesión
  al cambiarla.
- **Código de recuperación** — se genera desde ahí y se muestra **una sola vez**.

### Cómo funciona el código

Son 16 caracteres aleatorios (`A3F9-K2M7-QX4B-7TZP`), de un alfabeto que evita los que se
confunden al copiar a mano (sin `0/O`, sin `1/I/L`). Unas 10²² combinaciones.

- Se guarda **cifrado con bcrypt**, igual que la contraseña. Ni con acceso a la base se
  puede leer: solo generar otro.
- Es de **un solo uso**: al aplicarlo queda invalidado, para que uno filtrado no sirva
  después.
- Generar uno nuevo **invalida el anterior**.
- Al escribirlo no importan mayúsculas ni guiones.

Se usa en `/admin/recuperar`, enlazado desde el acceso como *"Olvidé mi contraseña"*.

Esa ruta es pública a propósito —se necesita justo cuando no se puede entrar—, así que
está limitada a **5 intentos por hora y por IP**, mucho más estricto que el login. El
mensaje de error es el mismo para usuario inexistente y código incorrecto, para no
revelar qué usuarios existen.

> Si Santiago pierde el código **y** la contraseña, la única salida es correr
> `npm run db:seed` con la base vacía o cambiar el hash a mano. Conviene que guarde el
> código apenas lo genere.

### 5. Levantar todo

```bash
npm run dev
```

- Sitio: http://localhost:4200
- API: http://localhost:3000/api
- Panel: http://localhost:4200/admin/login

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta backend y frontend a la vez |
| `npm run build` | Compila ambos para producción |
| `npm run db:migrate` | Aplica migraciones de Prisma |
| `npm run db:seed` | Siembra datos iniciales |
| `npm run db:studio` | Abre Prisma Studio para ver la base |

## API

### Público

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor y la base |
| GET | `/api/author` | Datos del autor |
| GET | `/api/poems` | Poemas publicados (`?featured=true&limit=3`) |
| GET | `/api/poems/:slug` | Un poema por su dirección |
| GET | `/api/community` | Tablero (`?page=&pageSize=`) |
| POST | `/api/community` | Publicar (sin login, con límite por IP) |
| POST | `/api/community/:id/rating` | Calificar (409 si ya calificó) |

### Panel (requiere sesión)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/admin/login` | Ingresar (deja cookie httpOnly) |
| POST | `/api/admin/logout` | Cerrar sesión |
| GET | `/api/admin/me` | Verificar sesión activa |
| POST | `/api/admin/password` | Cambiar contraseña |
| PUT | `/api/admin/author` | Editar biografía |
| GET/POST | `/api/admin/poems` | Listar (con borradores) / crear |
| PUT/DELETE | `/api/admin/poems/:id` | Editar / eliminar |
| GET | `/api/admin/community` | Listar (con ocultas) |
| PATCH | `/api/admin/community/:id` | Ocultar o mostrar |
| DELETE | `/api/admin/community/:id` | Eliminar |

## Cómo se manejan los estilos

El diseño se apoya en **Bootstrap 5.3**. La regla es: *todo lo que Bootstrap
resuelva, se hace con Bootstrap*; el `.scss` de cada componente queda solo para
los ajustes que su sistema no cubre.

### La paleta

El sitio usa una paleta **monocromática sobre base oscura**. Las fotos aportan
el único color de la página.

| Tono | Hex | Uso |
|---|---|---|
| Charcoal Noir | `#2B2B2B` | Fondo del sitio |
| Ironclad Grey | `#565656` | Bordes y separadores |
| Urban Fog | `#848484` | Texto grande y decorativo |
| Moonlit Silver | `#B3B3B3` | Texto secundario |
| Cloud Veil | `#E0E0E0` | Texto principal y botones |

**Contraste — respetar estos límites:**

| Color sobre `#2B2B2B` | Ratio | Permitido en |
|---|---|---|
| `#E0E0E0` | 10.9:1 | Texto principal, títulos |
| `#B3B3B3` | 6.9:1 | Texto secundario, fechas, ayudas |
| `#848484` | 3.7:1 | **Solo texto grande (≥18pt) o decorativo** |
| `#565656` | 1.6:1 | **Solo bordes**, nunca texto |

`src/styles/_paleta.scss` tiene esos tonos en un solo lugar. `src/styles.scss`
los asigna a las variables de Bootstrap **antes** de importarlo, usando su
soporte nativo de modo oscuro (`data-bs-theme="dark"` en `index.html`):

```scss
@import 'styles/paleta';

$primary: $cloud-veil;      // sobre fondo oscuro, lo que resalta es lo claro
$body-bg-dark: $fondo;
$body-color-dark: $texto;
$card-bg: $superficie;
// ...

@import 'bootstrap/scss/bootstrap';
```

Para cambiar la identidad visual del sitio entero alcanza con tocar
`_paleta.scss`.

### Clases propias

En `styles.scss`, después de Bootstrap, hay tres clases globales que sí son
específicas de un sitio de poesía:

| Clase | Para qué |
|---|---|
| `.texto-poema` | Serif + `white-space: pre-wrap`, para respetar versos y estrofas |
| `.titulo-poetico` | Serif en cursiva, para títulos de poemas y del sitio |
| `.eyebrow` | Antetítulo en versalitas |

### Qué queda en cada componente

Solo 10 de 16 componentes tienen `.scss`, y cada uno con pocas líneas: el botón
flotante de la comunidad (Bootstrap no trae FAB), el vidrio esmerilado de la
cabecera, el realce de las tarjetas al pasar el mouse, y anchos máximos de
formularios. El resto es todo Bootstrap.

> **Nota sobre el modal de la comunidad:** usa clases `.card` y no
> `.modal-content`. Bootstrap define las variables `--bs-modal-*` en el
> contenedor `.modal`, que el CDK Dialog no monta; fuera de esa jerarquía
> `.modal-content` queda sin fondo ni bordes. `.card` sí es autónomo.

Bootstrap se importa completo para tener todas sus utilidades disponibles
(~103 kB comprimidos en total con la app). Si más adelante hace falta recortar
peso, en `styles.scss` se pueden importar solo los módulos que se usen.

## Fotos e imágenes

Santiago **sube las fotos desde el panel**. El backend las guarda en disco y las
sirve como estáticos; en la base solo queda la ruta (`/uploads/poemas/xxx.jpg`).

### Dónde va cada imagen

| Sección | Dónde se sube | Tamaño recomendado |
|---|---|---|
| Fondo de la portada | Autor → Página principal | Horizontal, 1920 × 1080 o más |
| Imagen de cada poema | Poemas → editar poema | Horizontal, 1200 × 800 o más |
| Foto del autor | Autor → Página de autor | Vertical 3:4, 600 × 800 o más |

Formatos aceptados: **JPG, PNG y WebP**, hasta **5 MB**. Cada campo del panel
lleva esa guía escrita debajo, así que no hace falta recordarla.

### Cómo funciona por dentro

- `POST /api/admin/uploads/:categoria` — protegido por sesión de admin.
  Valida el tipo real del archivo, limita el tamaño y **renombra con un UUID**:
  nunca se usa el nombre que manda el navegador.
- Después de guardarla, la imagen se **redimensiona y comprime** con `sharp`
  (`uploads.optimizar.ts`): 1920 px de ancho para la portada, 1600 para los poemas
  y 900 para el retrato del autor. Una foto de celular de 2 MB queda en unos 30 KB,
  y quien entra desde el teléfono no descarga de más. Si el procesado falla o queda
  más pesado que el original, se conserva la original.
- Las categorías (`poemas`, `portada`, `autor`) son una **lista blanca**; sin
  eso el nombre de carpeta podría usarse para escribir fuera de `uploads/`.
- `DELETE /api/admin/uploads?url=...` valida que la ruta esté dentro de
  `uploads/` antes de borrar.
- Al reemplazar una imagen se borra la anterior, pero recién cuando la nueva
  quedó guardada.

**Sin fotos el sitio funciona igual.** Cada poema muestra un degradado en grises
derivado de su slug — siempre el mismo para el mismo poema, y distinto al de sus
vecinos. La galería se ve intencional aunque todavía no haya imágenes reales.

### ⚠️ Al desplegar en Railway

El disco de Railway es **efímero**: en cada despliegue se borra lo que no esté en
el repositorio, y las fotos subidas se perderían.

Para evitarlo hay que **montar un volumen** en el servicio del backend, con punto
de montaje `/app/uploads`. Se configura desde el panel de Railway
(*Service → Settings → Volumes*) y no requiere cambios en el código.

Si más adelante el volumen queda corto, la alternativa es mover el
almacenamiento a un servicio externo (Cloudinary, S3): solo habría que cambiar
`backend/src/modules/uploads/`, porque el resto del código únicamente guarda la
URL que ese módulo devuelve.

## Compartir en redes

Cada poema tiene tres acciones, todas resueltas en el navegador sin backend:

- **Copiar enlace** con la API de portapapeles.
- **Compartir** nativo del sistema (`navigator.share`), solo si el navegador lo soporta.
- **Imagen para historias**: dibuja el poema en un canvas de 1080×1920 con la
  tipografía y los grises del sitio, y lo descarga como PNG listo para Instagram.
  Si el poema no entra completo se corta por verso (nunca a mitad de línea) y
  agrega "Leelo completo en el sitio".

El código del canvas está en
`frontend/src/app/shared/components/share-poem/historia-canvas.ts`.

## Decisiones de diseño

**Sesión en cookie httpOnly, no en localStorage.** El JavaScript de la página no puede leer el
token, lo que protege la sesión ante un XSS.

**La comunidad no pide registro**, igual que el sitio anterior. Como contrapeso hay límite de
publicaciones por IP, validación de longitud, un campo trampa contra bots y moderación desde el
panel.

**Las calificaciones se deduplican en la base** con un índice único sobre `(publicación, hash
de IP)`. La IP nunca se guarda en claro, solo su hash con sal. El `localStorage` del navegador
solo sirve para deshabilitar el botón al instante; la barrera real es la base de datos.

**Ocultar antes que borrar.** La moderación oculta publicaciones por defecto, que es reversible.

## Renderizado en el servidor (SSR)

El frontend se renderiza en el servidor. No es por velocidad: es porque **WhatsApp,
Instagram, Facebook y Twitter no ejecutan JavaScript** cuando alguien pega un enlace.
Leen el HTML tal como llega. Sin SSR, compartir cualquier poema mostraba siempre la
misma tarjeta genérica del sitio.

Con SSR, cada poema llega con su propio título, sus primeros versos y su foto:

```
GET /poemas/cicatriz
  <title>cicatriz | Santiago a secas</title>
  <meta property="og:title" content="cicatriz">
  <meta property="og:description" content="El triste poeta caminó de espaldas...">
  <meta property="og:image" content="https://…/uploads/poemas/xxx.jpg">
```

Eso lo arma `core/services/seo.service.ts`, que corre igual en el servidor y en el
navegador.

### Qué se renderiza dónde

`frontend/src/app/app.routes.server.ts` decide:

| Rutas | Modo | Por qué |
|---|---|---|
| `/admin/**` | Cliente | Es privado, pide sesión y no lo indexa nadie |
| Todo lo demás | Servidor | El contenido lo cambia Santiago desde el panel: no se puede congelar al compilar |

### Cuidado al tocar el código

En el servidor **no existen** `window`, `document`, `localStorage` ni `navigator`.
Todo lo que los use tiene que correr solo en el navegador:

- Medir o mirar el DOM → dentro de `afterNextRender()` (ver `poem-bar.ts`, `reveal.ts`).
- Leer `localStorage` → detrás de `isPlatformBrowser()` (ver `community.service.ts`).
- Convertir HTML a texto → `shared/utils/texto-plano.ts` lo hace **sin** el parser del
  navegador, a propósito: si servidor y cliente devolvieran textos distintos, la
  hidratación se rompe.

Lo que se dispara con un clic (compartir, generar la imagen, los diálogos) no necesita
guardas: para entonces ya está en el navegador.

### El interceptor de credenciales

`credentials.interceptor.ts` marca `withCredentials` **solo** en `/api/admin/*`. No es
un detalle menor: Angular no guarda en la caché de transferencia ninguna respuesta
pedida con credenciales, así que marcarlas todas obligaba al navegador a repetir, ya
hidratado, cada petición que el servidor acababa de hacer. Al dejar lo público sin
credenciales, esas respuestas viajan dentro del HTML y el navegador no pide nada.

### robots.txt y sitemap.xml

Los sirve el propio servidor de Angular (`frontend/src/ssr-server.ts`), no son archivos
sueltos. Así el dominio sale de la configuración y **un poema nuevo aparece en el
sitemap sin volver a compilar**.

> El archivo se llama `ssr-server.ts` y no `server.ts`, que es el nombre que pone
> Angular por defecto: Vercel busca un `src/server.ts` para tratarlo como servidor
> propio, y eso competiría con la función de `api/index.mjs`. El nombre está declarado
> en `angular.json` (`ssr.entry`); la salida compilada sigue siendo `server/server.mjs`.

## Pasar a producción

### 1. Base de datos y backend (Railway)

En un mismo proyecto de Railway:

1. **+ New → Database → PostgreSQL.**
2. **+ New → GitHub Repo** apuntando a este repositorio.
   En *Settings → Root Directory* poner `backend`.
   El resto lo lee de `backend/railway.json` (build, arranque y health check).

   > El build corre `npm ci --include=dev` a propósito. Con `NODE_ENV=production`
   > npm se saltea las devDependencies, y ahí viven TypeScript y `tsx`: sin ese
   > `--include=dev` el `tsc` no existe y el despliegue falla. La CLI de `prisma`
   > está en `dependencies` porque se usa en cada arranque, no solo al compilar.
3. **Volumen para las fotos** — *Service → Settings → Volumes → New Volume*, punto de
   montaje **`/app/uploads`**. Sin esto, cada despliegue borra las fotos subidas.
4. **Variables** (*Service → Variables*):

   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   CORS_ORIGIN=https://TU-SITIO.vercel.app
   JWT_SECRET=<48 bytes aleatorios en hex>
   JWT_EXPIRES_IN=2h
   RATING_SALT=<32 bytes aleatorios en hex, distinto al anterior>
   COOKIE_SECURE=true
   ADMIN_USERNAME=santiago
   ADMIN_INITIAL_PASSWORD=<una clave larga, distinta a la de desarrollo>
   ```

   Los aleatorios se generan con:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   `PORT` lo inyecta Railway solo, no hay que definirlo.

5. **Generar el dominio** en *Settings → Networking → Generate Domain* y anotarlo.
6. **Sembrar la base, una sola vez**, desde la consola del servicio:

   ```bash
   npm run db:seed
   ```

   Imprime el **código de recuperación**: guardalo, no vuelve a mostrarse.

   > ⚠️ El seed **pisa** el texto de los poemas que ya existan. Se corre una vez, en el
   > estreno. Después nunca más, o se pierde lo que Santiago haya editado. Por eso el
   > arranque (`start:prod`) solo aplica migraciones y no siembra.

### 2. Frontend (Vercel)

1. Antes de subir, poner las URLs reales en
   `frontend/src/environments/environment.ts`:

   ```ts
   apiUrl: 'https://TU-BACKEND.up.railway.app/api',
   siteUrl: 'https://TU-SITIO.vercel.app',
   ```

   Se compilan dentro del bundle, así que **cambiarlas exige volver a desplegar**.

2. En `frontend/angular.json`, agregar el dominio a `security.allowedHosts` de la
   configuración de producción. Angular rechaza los hosts que no estén declarados
   (protección contra SSRF); `.vercel.app` ya está, pero un dominio propio hay que
   sumarlo.

3. En Vercel: **New Project** → este repositorio → *Root Directory* `frontend`.
   El resto sale de `frontend/vercel.json`: compila, sirve los estáticos desde
   `dist/frontend/browser` y manda todo lo demás a la función de `api/index.mjs`, que
   es la que levanta el servidor de Angular.

4. Cuando Vercel dé el dominio definitivo, volver al paso 1 y a `CORS_ORIGIN` de
   Railway si el que se puso no coincide.

### 3. Comprobar que quedó bien

```bash
curl https://TU-SITIO.vercel.app/robots.txt
curl https://TU-SITIO.vercel.app/sitemap.xml
curl -s https://TU-SITIO.vercel.app/poemas/cicatriz | grep 'og:title'
```

Lo último tiene que devolver el título del poema, no el del sitio. Si devuelve el
genérico, la petición no está pasando por la función y el SSR no se está usando.

Después, en el navegador:

- Entrar al panel y **cambiar la contraseña** desde *Seguridad*.
- Subir una foto, redesplegar y confirmar que sigue ahí (verifica el volumen).
- Pegar el enlace de un poema en WhatsApp y ver la vista previa.
