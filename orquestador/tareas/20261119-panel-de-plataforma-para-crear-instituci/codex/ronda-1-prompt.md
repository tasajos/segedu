Eres el desarrollador de interfaz de un equipo de tres agentes. Claude es el director: decidió la arquitectura, escribió el backend y redactó el contrato de API. Tú construyes solo la interfaz. Antigravity probará tu trabajo en el navegador después.

# Tarea: Panel de plataforma para crear instituciones por subdominio (ronda 1)

Proyecto `segedu-instituciones` · React 18 + Vite. Directorio de trabajo: `C:\chakuysoft\segedu\segedu\segedu-instituciones\frontend`
Cliente HTTP: el `api` de `src/services/api.js` (axios con baseURL `/api` y token JWT). Las rutas que le pasas van **sin** el prefijo `/api`.

## Reglas que no se negocian
1. **Solo modificas archivos dentro de `C:\chakuysoft\segedu\segedu\segedu-instituciones\frontend`.** No tocas el backend, la base de datos, el contrato ni nada fuera de esa carpeta. Puedes leer el resto del repositorio para entenderlo.
2. **Solo llamas a endpoints que aparecen en el contrato o en la lista de rutas existentes de abajo.** No inventes endpoints, parámetros ni campos de respuesta. Si te falta uno, no lo improvises: escríbelo en tu resumen final, en la sección "Bloqueos".
3. Usa siempre el cliente `api`. No uses `fetch` ni URLs con host.
4. Sigue el estilo del proyecto: mira componentes y páginas parecidas antes de crear algo nuevo, y reutiliza los componentes de `src/components` y las clases de `src/styles`. No agregues dependencias.
5. Toda pantalla maneja carga, lista vacía y error (muestra el `message` del backend).
6. Textos de la interfaz en español, claros y cortos.
7. Al terminar, ejecuta `npm run build` en `C:\chakuysoft\segedu\segedu\segedu-instituciones\frontend` y corrige lo que falle.
8. No hagas commits.

## Correcciones pedidas por el director
(primera ronda)

## Plan
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


## Contrato de API
# Contrato de API · Panel de plataforma

Las rutas de la plataforma solo responden en el host `plataforma.<dominio>`. Todas, salvo el login, requieren
`Authorization: Bearer <token de plataforma>`. Los errores vienen como `{ error }`.

```endpoints
GET    /api/contexto                                     público          → 200 { tipo, subdominio, estado, nombre } · 404 { tipo:'desconocida' }
POST   /api/plataforma/auth/login                        público          → 200 { token, superadmin:{id,nombre,email} } · 401 · 429
GET    /api/plataforma/auth/perfil                       superadmin       → 200 { id, nombre, email }
GET    /api/plataforma/config                            superadmin       → 200 { baseDominio, ejemploUrl, modo, subdominioPlataforma }
GET    /api/plataforma/subdominio-disponible             superadmin       → 200 { subdominio, disponible, motivo, url }
GET    /api/plataforma/instituciones                     superadmin       → 200 [Institucion]
POST   /api/plataforma/instituciones                     superadmin       → 201 { institucion, admin:{email,passwordTemporal} } · 400 { error, errores } · 502 { error, paso, institucion }
GET    /api/plataforma/instituciones/:id                 superadmin       → 200 Institucion & { eventos:[{accion,detalle,created_at}] }
PATCH  /api/plataforma/instituciones/:id                 superadmin       → 200 Institucion · 400 · 409
POST   /api/plataforma/instituciones/:id/reintentar      superadmin       → 200 { institucion, admin } · 409 · 502 { error, paso, institucion }
POST   /api/plataforma/instituciones/:id/restablecer-admin superadmin     → 200 { admin:{email,passwordTemporal} } · 400
```

## Tipos

```ts
Institucion = {
  id: number, subdominio: string, url: string,          // url lista para abrir: https://<sub>.<dominio>
  nombre: string, sigla: string|null,
  tipo: 'colegio'|'instituto'|'universidad',
  estado: 'creando'|'activa'|'suspendida'|'error',
  paso: 'base'|'usuario'|'esquema'|'datos'|'subdominio'|'listo'|null,
  error: string|null,
  admin: { nombre, apellido, email },
  created_at: string, updated_at: string
}
```

## Detalle

### POST /api/plataforma/auth/login
Cuerpo `{ email, password }`. 401 `Correo o contraseña incorrectos`. 429 después de 10 intentos fallidos en 15 min.

### GET /api/plataforma/subdominio-disponible?valor=<texto>
`motivo` cuando no está disponible, por ejemplo: «Use de 3 a 30 caracteres…», «Ese subdominio está reservado», «Ese subdominio ya está en uso».

### POST /api/plataforma/instituciones
Cuerpo:
```json
{ "nombre": "Colegio San José", "sigla": "CSJ", "tipo": "colegio", "subdominio": "colegio-san-jose",
  "admin": { "nombre": "Ana", "apellido": "Pérez", "email": "ana@csj.edu.bo" } }
```
- 400: `{ error: 'Revise los datos del formulario', errores: { subdominio?, nombre?, tipo?, 'admin.nombre'?, 'admin.apellido'?, 'admin.email'? } }`
- 502: falló un paso. La institución queda con `estado: 'error'` y se puede reintentar.

### PATCH /api/plataforma/instituciones/:id
Cuerpo `{ estado: 'activa' | 'suspendida' }` o `{ nombre }`. 409 si la institución todavía no terminó de crearse.

## Endpoints existentes que la UI puede reutilizar
Los de la app de institución, sin cambios. `GET /api/auth/institucion` **no** existe en el host de la plataforma.


## Rutas que existen hoy en el backend (completas)
```
GET    /api/health
GET    /api/contexto
POST   /api/plataforma/auth/login
GET    /api/plataforma/auth/perfil
GET    /api/plataforma/config
GET    /api/plataforma/subdominio-disponible
GET    /api/plataforma/instituciones
POST   /api/plataforma/instituciones
GET    /api/plataforma/instituciones/:id
PATCH  /api/plataforma/instituciones/:id
POST   /api/plataforma/instituciones/:id/reintentar
POST   /api/plataforma/instituciones/:id/restablecer-admin
GET    /api/auth/institucion
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile
GET    /api/auth/presentaciones
GET    /api/auth/mis-presentaciones
GET    /api/auth/presentaciones/:id/ver
GET    /api/auth/presentaciones/:id/slides
GET    /api/auth/usuarios-equipo
GET    /api/estudiante/cursos
POST   /api/estudiante/cursos
DELETE /api/estudiante/cursos/:id
PUT    /api/estudiante/info-personal
PUT    /api/estudiante/cambiar-contrasena
GET    /api/estudiante/ranking-grupo
GET    /api/estudiante/materias
GET    /api/estudiante/asistencias/resumen
GET    /api/estudiante/asistencias
GET    /api/estudiante/expediente
GET    /api/estudiante/permisos
POST   /api/estudiante/permisos
GET    /api/estudiante/tareas
GET    /api/estudiante/tareas/:id/ver
GET    /api/estudiante/tareas/:id/slides
POST   /api/estudiante/tareas/:id/entrega
GET    /api/estudiante/tareas/:id/mi-entrega
GET    /api/estudiante/grupos/:tareaId
GET    /api/estudiante/grupos/:tareaId/companeros
POST   /api/estudiante/grupos
DELETE /api/estudiante/grupos/:grupoId/salir
DELETE /api/estudiante/grupos/:grupoId
GET    /api/estudiante/grupos-docente
GET    /api/docente/materias
GET    /api/docente/materias/:materia_id/estudiantes
GET    /api/docente/carpeta-pedagogica/:materia_id
PUT    /api/docente/carpeta-pedagogica/:materia_id
GET    /api/docente/carpeta-pedagogica/:materia_id/evaluacion
PUT    /api/docente/carpeta-pedagogica/:materia_id/asistencia
GET    /api/docente/pgo
POST   /api/docente/pgo
DELETE /api/docente/pgo/:id
GET    /api/docente/avance
POST   /api/docente/avance
GET    /api/docente/pgo-tareas
PUT    /api/docente/pgo-tareas/:id
GET    /api/docente/comentarios
POST   /api/docente/comentarios
POST   /api/docente/asistencia/lista
GET    /api/docente/asistencia/sesiones
GET    /api/docente/asistencia/sesion
GET    /api/docente/asistencia/reporte
GET    /api/docente/asistencia/permisos
GET    /api/docente/notificaciones/pendientes
POST   /api/docente/notificaciones/revisar
GET    /api/docente/mi-disciplina
PUT    /api/docente/info-personal
PUT    /api/docente/cambiar-contrasena
GET    /api/docente/tareas
POST   /api/docente/tareas
DELETE /api/docente/tareas/:id
GET    /api/docente/tareas/:id/entregas
PUT    /api/docente/entregas/:id/calificar
GET    /api/docente/tareas/:id/ver
GET    /api/docente/tareas/:id/slides
GET    /api/docente/entregas/:id/ver
GET    /api/docente/entregas/:id/descargar
GET    /api/docente/mis-presentaciones
POST   /api/docente/presentaciones
PUT    /api/docente/presentaciones/:id/mover
DELETE /api/docente/presentaciones/:id
GET    /api/docente/carpetas
POST   /api/docente/carpetas
PUT    /api/docente/carpetas/:id
DELETE /api/docente/carpetas/:id
GET    /api/docente/grupos-trabajo
POST   /api/docente/grupos-trabajo
PUT    /api/docente/grupos-trabajo/:id
DELETE /api/docente/grupos-trabajo/:id
POST   /api/docente/grupos-trabajo/:id/miembros
DELETE /api/docente/grupos-trabajo/:id/miembros/:estudianteId
POST   /api/docente/grupos-trabajo/:id/tareas
DELETE /api/docente/grupos-trabajo/:id/tareas/:tareaId
GET    /api/jefe/mi-carrera
GET    /api/jefe/pgo
PUT    /api/jefe/pgo/:id
DELETE /api/jefe/pgo/:id
GET    /api/jefe/avances
PUT    /api/jefe/avances/:id
GET    /api/jefe/comportamiento
GET    /api/jefe/dashboard
GET    /api/jefe/asistencias
PUT    /api/jefe/asistencias/:id
GET    /api/jefe/solicitudes-permiso
POST   /api/jefe/solicitudes-permiso
PUT    /api/jefe/solicitudes-permiso/:id/estado
DELETE /api/jefe/solicitudes-permiso/:id
GET    /api/jefe/notificaciones
POST   /api/jefe/notificaciones
GET    /api/jefe/actas/indicadores
GET    /api/jefe/actas/:id
POST   /api/jefe/actas/verificar-password
POST   /api/jefe/actas
GET    /api/jefe/carpetas-pedagogicas
GET    /api/jefe/carpetas-pedagogicas/:materia_id
GET    /api/jefe/estudiantes
GET    /api/jefe/estudiantes-indicadores
PUT    /api/jefe/estudiantes/promocion
GET    /api/jefe/estudiantes/:id/asistencias
GET    /api/jefe/estudiantes/:id
POST   /api/jefe/inscripciones
DELETE /api/jefe/inscripciones/:estudiante_id/:materia_id
GET    /api/jefe/disciplina-estudiantes
POST   /api/jefe/disciplina-estudiantes
DELETE /api/jefe/disciplina-estudiantes/:id
GET    /api/jefe/disciplina-docentes
POST   /api/jefe/disciplina-docentes
DELETE /api/jefe/disciplina-docentes/:id
GET    /api/jefe/horarios
POST   /api/jefe/horarios
PUT    /api/jefe/horarios/:id
DELETE /api/jefe/horarios/:id
POST   /api/jefe/asignar-docente
GET    /api/jefe/materias
GET    /api/jefe/materias/:id/estudiantes
GET    /api/jefe/materias/:id
POST   /api/jefe/materias
PUT    /api/jefe/materias/:id
DELETE /api/jefe/materias/:id
GET    /api/jefe/docentes
GET    /api/admin/dashboard
PUT    /api/admin/institucion
GET    /api/admin/carreras
POST   /api/admin/carreras
PUT    /api/admin/carreras/:id
DELETE /api/admin/carreras/:id
GET    /api/admin/usuarios
POST   /api/admin/usuarios
POST   /api/admin/usuarios/importar-excel
POST   /api/admin/usuarios/importar-csv
PUT    /api/admin/usuarios/bulk-activo
PUT    /api/admin/usuarios/:id
DELETE /api/admin/usuarios/:id
PUT    /api/admin/usuarios/:id/reset-password
PUT    /api/admin/usuarios/:id/toggle-activo
GET    /api/admin/jefes
GET    /api/admin/materias
GET    /api/admin/materias/:id
POST   /api/admin/materias
PUT    /api/admin/materias/:id
DELETE /api/admin/materias/:id
GET    /api/admin/docentes
GET    /api/auditor/carreras
POST   /api/auditor/carrera-activa
GET    /api/auditor/docentes
POST   /api/auditor/docente-activo
GET    /api/auditor/estudiantes
POST   /api/auditor/estudiante-activo
```

## Tu respuesta final
Responde en español, con estas secciones:
- **Archivos**: cada archivo creado o modificado y qué cambió.
- **Endpoints usados**: método y ruta de cada llamada nueva.
- **Build**: resultado de `npm run build`.
- **Bloqueos**: lo que no pudiste hacer y por qué (por ejemplo, un endpoint que falta).
