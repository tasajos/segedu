# Plan · Panel de plataforma para crear instituciones por subdominio

Proyecto: `segedu-instituciones`. El backend ya está hecho y probado (Claude). Esta tarea es la interfaz.

## Objetivo
Chakuy Software vende SEGEDU a varios colegios y universidades. Cada uno tiene su subdominio
(`colegio-x.segedu.chakuy.online`) y su propia base de datos. Un **superadministrador de Chakuy** entra en
`plataforma.segedu.chakuy.online` y desde ahí crea, suspende y administra las instituciones.

## Arquitectura (ya implementada en el backend)
- El backend decide por el host: `plataforma.<dominio>` = panel de Chakuy; `<sub>.<dominio>` = una institución;
  el dominio principal = la instalación por defecto.
- `GET /api/contexto` (público, en cualquier host) le dice al frontend dónde está:
  `{ tipo: 'plataforma' | 'institucion' | 'desconocida', subdominio, estado, nombre }`.
  En un subdominio inexistente responde **404** con `{ tipo: 'desconocida' }`.
  `estado` de una institución: `activa`, `suspendida`, `creando`, `error`.
- En el host de la plataforma, las rutas de institución (`/api/auth/*`, `/api/admin/*`…) responden 404.
- El superadmin tiene su propio login y token (`/api/plataforma/auth/login`). Ese token no sirve en las
  instituciones, y el de una institución no sirve en la plataforma.
- Crear una institución tarda entre 1 y 30 s: base, usuario, esquema, admin y subdominio en cPanel.
  La respuesta trae la **contraseña temporal del administrador, que no se vuelve a mostrar**.

## Qué construir (Codex)

### 1. Arranque según el contexto (`App.jsx` / `main.jsx`)
- Antes de montar las rutas, pide `GET /contexto` (con el cliente `api`, ruta sin `/api`) y muestra un estado de carga.
- `tipo === 'plataforma'` → monta la **app de plataforma** (punto 2). No debe montar `InstitucionProvider` ni `AuthProvider` de la institución, ni pedir `/auth/institucion`.
- `tipo === 'desconocida'` (404) → página «Institución no encontrada» con el búho de Chakuy y un texto breve.
- `tipo === 'institucion'` con `estado` distinto de `activa` → página de estado: `suspendida` = «Acceso suspendido, comuníquese con Chakuy Software»; `creando` o `error` = «Esta institución se está configurando».
- `tipo === 'institucion'` y `activa` → la app actual, sin cambios.
- Si `/contexto` falla por red, intenta seguir con la app actual (compatibilidad con backends sin multi-institución).

### 2. App de plataforma (`src/plataforma/`)
- Cliente propio `src/plataforma/api.js`: axios con baseURL `/api/plataforma`. El token se guarda en
  `localStorage` con la clave `plataforma_token`; un 401 lleva a `/login` de la plataforma.
- Contexto de sesión propio (`PlataformaAuthContext`): login, logout y `GET /auth/perfil` al cargar.
- **Login** con la marca Chakuy (búho, «SEGEDU · Plataforma Chakuy»), usando el diseño nuevo.
- **Layout** propio y simple: barra superior con búho, nombre del superadmin y «Cerrar sesión».
- **Instituciones** (`/`):
  - Tarjetas de resumen: total, activas, suspendidas, con error.
  - Tabla o lista con búsqueda: nombre (y sigla), enlace al subdominio (`url`, abre en pestaña nueva),
    tipo, estado (badge de color), administrador (email) y fecha de alta.
  - Acciones por fila: **Ver**, **Suspender**/**Reactivar** (confirmación con `useDialog`, tipo peligro para
    suspender), **Restablecer administrador** (confirmación y luego el diálogo de credenciales) y
    **Reintentar** solo si `estado === 'error'` (con el `error` y el `paso` visibles).
  - Botón **Nueva institución**.
- **Nueva institución** (modal con el `Modal` del sistema):
  - Campos: nombre, sigla (opcional), tipo (colegio / instituto / universidad), subdominio, y del
    administrador: nombre, apellido y correo.
  - El subdominio se sugiere a partir del nombre (minúsculas, sin tildes, espacios a guiones, máximo 30) y se puede editar.
    Mientras se escribe, con 400 ms de espera, consulta `GET /subdominio-disponible?valor=` y muestra
    «✓ disponible: https://…» o el `motivo`.
  - Errores del backend por campo (`errores` en la respuesta 400) bajo cada campo.
  - Al enviar: botón deshabilitado y mensaje «Creando base de datos y subdominio… puede tardar hasta un minuto».
  - Si responde 201: diálogo de credenciales con la URL, el correo del admin y la contraseña temporal,
    botones **Copiar** para cada uno y el aviso «Guarde esta contraseña: no se vuelve a mostrar». Después refresca la lista.
  - Si responde 502: diálogo de error con el mensaje y el paso, y la opción **Reintentar** (`POST /instituciones/:id/reintentar`).
- **Detalle** (`/instituciones/:id`): datos, estado, administrador e historial (`eventos`: acción y fecha),
  con las mismas acciones.

### 3. Desarrollo local
- `vite.config.js`: en el proxy de `/api` y `/uploads` agrega `xfwd: true` (manteniendo `changeOrigin: true`)
  para que el backend reciba el host original en `X-Forwarded-Host`. Así funcionan `plataforma.localhost:5173`
  y `colegio-x.localhost:5173`.

## Reparto
| Parte | Responsable |
|---|---|
| Backend (resolución por subdominio, plataforma, provisión cPanel/local, aislamiento) | Claude ✔ hecho y probado |
| Interfaz de plataforma y arranque por contexto | Codex |
| QA | Claude |

## Criterios de aceptación
- [ ] En `plataforma.localhost:5173` se ve el login de la plataforma; con superadmin se entra al panel.
- [ ] Se crea una institución desde el formulario y se muestran URL, correo y contraseña temporal con botones Copiar.
- [ ] El subdominio se valida en vivo y los errores del backend aparecen junto a cada campo.
- [ ] Suspender pide confirmación de peligro; reactivar y restablecer funcionan.
- [ ] Una institución con error muestra el paso y permite reintentar.
- [ ] En `<sub>.localhost:5173` se entra a la institución con su admin; en un subdominio inexistente aparece «Institución no encontrada».
- [ ] En el dominio principal (`localhost:5173`) la app funciona igual que antes.
- [ ] `npm run build` pasa y el contrato no tiene violaciones.

## Flujos E2E para QA
1. Superadmin → login → Nueva institución «Colegio Demo», subdominio sugerido `colegio-demo` → crear → copiar la contraseña.
2. Abrir `colegio-demo.localhost:5173` → login del admin con la contraseña temporal → ver «Mi institución» con el nombre.
3. Superadmin → Suspender «Colegio Demo» → recargar el subdominio → página de acceso suspendido.
4. Reactivar → restablecer administrador → entrar con la nueva contraseña.
5. `no-existe.localhost:5173` → «Institución no encontrada».

## Fuera de alcance
- Borrar instituciones (por seguridad, solo se suspenden).
- Facturación o planes.
