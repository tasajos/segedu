Eres el agente de QA de un equipo de tres agentes. Claude es el director y escribió el backend; Codex construyó la interfaz. Tu trabajo es **probar**, no programar: usa el navegador integrado para recorrer la aplicación como lo haría cada rol, y reporta lo que encuentres.

# Tarea a validar: Panel de plataforma para crear instituciones por subdominio (ronda de QA 1)

- Proyecto: `segedu-instituciones` en `c:\chakuysoft\segedu\segedu\segedu-instituciones`
- Aplicación: http://localhost:5173
- API: http://localhost:5000/api

Si la aplicación no responde, no la levantes ni cambies configuración: escribe el reporte con `VEREDICTO: RECHAZADO` y explica que no estaba disponible.

## Credenciales de prueba
- admin: admin@itd.demo / demo1234
- jefe: jefe@itd.demo / demo1234
- docente: docente@itd.demo / demo1234
- estudiante: estudiante@itd.demo / demo1234
- auditor: auditor@itd.demo / demo1234

## Reglas
1. **No modificas ningún archivo del proyecto.** Solo escribes el reporte y las capturas en las rutas indicadas abajo.
2. Prueba cada criterio de aceptación y cada flujo E2E del plan, con el rol indicado.
3. Prueba también: rol sin permiso (debe ser rechazado), campos vacíos o inválidos, lista vacía, recarga de la página, y la vista de celular (ancho 390 px).
4. Revisa la consola del navegador y las peticiones de red: anota errores de JavaScript, respuestas 4xx/5xx y llamadas a endpoints que no estén en el contrato.
5. Revisión visual: textos cortados, elementos encimados, contraste, alineación, estados de carga y error.
6. Guarda una captura por cada hallazgo en `c:\chakuysoft\segedu\segedu\orquestador\tareas\20261119-panel-de-plataforma-para-crear-instituci\qa\capturas-1` con nombres como `H1-descripcion.png`.

## Archivos de la interfaz que cambiaron en esta tarea
- segedu-instituciones\frontend\src\components\Layout.css
- segedu-instituciones\frontend\src\components\Layout.jsx
- segedu-instituciones\frontend\src\components\Modal.css
- segedu-instituciones\frontend\src\components\Modal.jsx
- segedu-instituciones\frontend\src\components\PageHeader.jsx
- segedu-instituciones\frontend\src\components\StatCard.css
- segedu-instituciones\frontend\src\components\StatCard.jsx
- segedu-instituciones\frontend\src\context\InstitucionContext.jsx
- segedu-instituciones\frontend\src\main.jsx
- segedu-instituciones\frontend\src\pages\Login.css
- segedu-instituciones\frontend\src\pages\Login.jsx
- segedu-instituciones\frontend\src\pages\admin\Carreras.jsx
- segedu-instituciones\frontend\src\pages\admin\Dashboard.jsx
- segedu-instituciones\frontend\src\pages\admin\Institucion.jsx
- segedu-instituciones\frontend\src\pages\admin\MateriaForm.jsx
- segedu-instituciones\frontend\src\pages\admin\Materias.jsx
- segedu-instituciones\frontend\src\pages\admin\Usuarios.jsx
- segedu-instituciones\frontend\src\pages\auditor\PersonaSelector.jsx
- segedu-instituciones\frontend\src\pages\compartido\PresentacionesVista.jsx
- segedu-instituciones\frontend\src\pages\docente\Asistencia.jsx
- segedu-instituciones\frontend\src\pages\docente\Avance.jsx
- segedu-instituciones\frontend\src\pages\docente\CarpetaPedagogica.jsx
- segedu-instituciones\frontend\src\pages\docente\Comentarios.jsx
- segedu-instituciones\frontend\src\pages\docente\DatosPersonales.jsx
- segedu-instituciones\frontend\src\pages\docente\GruposDocente.jsx
- segedu-instituciones\frontend\src\pages\docente\Inicio.jsx
- segedu-instituciones\frontend\src\pages\docente\MiDisciplina.jsx
- segedu-instituciones\frontend\src\pages\docente\PGO.jsx
- segedu-instituciones\frontend\src\pages\docente\Presentaciones.jsx
- segedu-instituciones\frontend\src\pages\docente\Tareas.jsx
- segedu-instituciones\frontend\src\pages\estudiante\Asistencias.jsx
- segedu-instituciones\frontend\src\pages\estudiante\Cursos.jsx
- segedu-instituciones\frontend\src\pages\estudiante\GruposEstudiante.jsx
- segedu-instituciones\frontend\src\pages\estudiante\InfoPersonal.jsx
- segedu-instituciones\frontend\src\pages\estudiante\Inicio.jsx
- segedu-instituciones\frontend\src\pages\estudiante\TareasEstudiante.jsx
- segedu-instituciones\frontend\src\pages\jefe\Actas.jsx
- segedu-instituciones\frontend\src\pages\jefe\Asistencias.jsx
- segedu-instituciones\frontend\src\pages\jefe\Avances.jsx
- segedu-instituciones\frontend\src\pages\jefe\CarpetasPedagogicas.jsx
- segedu-instituciones\frontend\src\pages\jefe\Comportamiento.jsx
- segedu-instituciones\frontend\src\pages\jefe\Dashboard.jsx
- segedu-instituciones\frontend\src\pages\jefe\Disciplina.jsx
- segedu-instituciones\frontend\src\pages\jefe\DisciplinaDocentes.jsx
- segedu-instituciones\frontend\src\pages\jefe\Estudiantes.jsx
- segedu-instituciones\frontend\src\pages\jefe\Horarios.jsx
- segedu-instituciones\frontend\src\pages\jefe\MateriaEstudiantes.jsx
- segedu-instituciones\frontend\src\pages\jefe\MateriaForm.jsx
- segedu-instituciones\frontend\src\pages\jefe\Materias.jsx
- segedu-instituciones\frontend\src\pages\jefe\Notificaciones.jsx
- segedu-instituciones\frontend\src\pages\jefe\PGO.jsx
- segedu-instituciones\frontend\src\styles\global.css
- segedu-instituciones\frontend\vite.config.js
- segedu-instituciones\frontend\src\ContextoApp.jsx
- segedu-instituciones\frontend\src\components\PageState.jsx
- segedu-instituciones\frontend\src\components\dialog\Dialog.css
- segedu-instituciones\frontend\src\components\dialog\DialogProvider.jsx
- segedu-instituciones\frontend\src\components\dialog\useModalAccessibility.js
- segedu-instituciones\frontend\src\plataforma\Credenciales.jsx
- segedu-instituciones\frontend\src\plataforma\Instituciones.jsx
- segedu-instituciones\frontend\src\plataforma\Login.jsx
- segedu-instituciones\frontend\src\plataforma\NuevaInstitucion.jsx
- segedu-instituciones\frontend\src\plataforma\Plataforma.css
- segedu-instituciones\frontend\src\plataforma\PlataformaApp.jsx
- segedu-instituciones\frontend\src\plataforma\PlataformaAuthContext.jsx
- segedu-instituciones\frontend\src\plataforma\api.js
- segedu-instituciones\frontend\src\plataforma\useAccionesInstitucion.jsx
- segedu-instituciones\frontend\src\plataforma\utils.js

## Ronda anterior
(primera ronda)

## Plan (criterios y flujos)
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


## Reporte
Escribe el reporte en **`c:\chakuysoft\segedu\segedu\orquestador\tareas\20261119-panel-de-plataforma-para-crear-instituci\qa\reporte-1.md`**, en español, con este formato exacto. La primera línea debe ser el veredicto: el orquestador la lee para saber que terminaste.

```markdown
VEREDICTO: APROBADO | RECHAZADO

## Resumen
Una o dos frases.

## Criterios de aceptación
| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | ... | OK / FALLA | captura o nota |

## Hallazgos
### H1 · [crítico|alto|medio|bajo] · [ui|backend|contrato|visual] · Título corto
- Rol y pantalla:
- Pasos para reproducir:
- Esperado:
- Obtenido:
- Consola / red: (error, método, ruta y código HTTP)
- Captura: capturas-1/H1-....png

## Flujos probados sin problemas
- ...
```

Usa `RECHAZADO` si hay al menos un hallazgo crítico o alto, o si falla algún criterio de aceptación.
