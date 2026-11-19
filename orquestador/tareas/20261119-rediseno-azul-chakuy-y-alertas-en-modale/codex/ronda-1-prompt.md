Eres el desarrollador de interfaz de un equipo de tres agentes. Claude es el director: decidió la arquitectura, escribió el backend y redactó el contrato de API. Tú construyes solo la interfaz. Antigravity probará tu trabajo en el navegador después.

# Tarea: Rediseño azul Chakuy y alertas en modales (ronda 1)

Proyecto `segedu-instituciones` · React 18 + Vite. Directorio de trabajo: `c:\chakuysoft\segedu\segedu\segedu-instituciones\frontend`
Cliente HTTP: el `api` de `src/services/api.js` (axios con baseURL `/api` y token JWT). Las rutas que le pasas van **sin** el prefijo `/api`.

## Reglas que no se negocian
1. **Solo modificas archivos dentro de `c:\chakuysoft\segedu\segedu\segedu-instituciones\frontend`.** No tocas el backend, la base de datos, el contrato ni nada fuera de esa carpeta. Puedes leer el resto del repositorio para entenderlo.
2. **Solo llamas a endpoints que aparecen en el contrato o en la lista de rutas existentes de abajo.** No inventes endpoints, parámetros ni campos de respuesta. Si te falta uno, no lo improvises: escríbelo en tu resumen final, en la sección "Bloqueos".
3. Usa siempre el cliente `api`. No uses `fetch` ni URLs con host.
4. Sigue el estilo del proyecto: mira componentes y páginas parecidas antes de crear algo nuevo, y reutiliza los componentes de `src/components` y las clases de `src/styles`. No agregues dependencias.
5. Toda pantalla maneja carga, lista vacía y error (muestra el `message` del backend).
6. Textos de la interfaz en español, claros y cortos.
7. Al terminar, ejecuta `npm run build` en `c:\chakuysoft\segedu\segedu\segedu-instituciones\frontend` y corrige lo que falle.
8. No hagas commits.

## Correcciones pedidas por el director
(primera ronda)

## Plan
# Plan · Rediseño azul Chakuy y alertas en modales

Proyecto: `segedu-instituciones` · solo frontend (`segedu-instituciones/frontend`).

## Objetivo
Que SEGEDU Instituciones se vea como un SaaS educativo profesional y moderno con la identidad de
Chakuy Software (el búho azul de `public/chakuy.png`), y que **ningún mensaje use `alert()` ni `confirm()`
del navegador**: todos pasan a modales propios con el ícono de Chakuy.

## Decisiones de arquitectura (director)

### 1. Paleta base «Azul Chakuy»
Valores por defecto en `src/styles/global.css` y en los defaults de `src/context/InstitucionContext.jsx`:
- `--brand: #1E73BE` (azul del búho) · `--accent: #FFD60A` (amarillo del pico) · nuevo `--teal: #14A3A8` (turquesa de los ojos)
- Fondo `#F5F8FC`, superficies blancas, neutros fríos (slate), texto principal `#0F172A`.
- Semánticos: éxito `#059669`, advertencia `#D97706`, peligro `#E11D48`, info = `--teal`.
- **Se mantiene el branding por institución**: `InstitucionContext` sigue sobrescribiendo `--brand` y `--accent`
  con los colores de «Mi institución». Toda la escala derivada (`--blue-*` con `color-mix`) debe seguir
  dependiendo de `--brand`. No pongas colores fijos donde debería ir la marca.
- **Contraste**: si el color de acento es claro (el amarillo lo es), el texto sobre él va oscuro (`#0F172A`).
  Nunca texto blanco sobre `--accent`.

### 2. Sistema de diálogos con el ícono de Chakuy
Componente nuevo `src/components/dialog/` (por ejemplo `DialogProvider.jsx` + `Dialog.css`):
- `DialogProvider` envuelve la app (en `main.jsx` o `App.jsx`) y expone el hook `useDialog()`:
  - `await dialog.alert(mensaje, { titulo?, tipo? })` → resuelve cuando el usuario cierra.
  - `await dialog.confirm(mensaje, { titulo?, tipo?, textoConfirmar?, textoCancelar? })` → resuelve `true`/`false`.
  - `tipo`: `'exito' | 'error' | 'advertencia' | 'info' | 'peligro'` (peligro = acción destructiva: botón rojo).
  - Si se llama mientras hay otro diálogo abierto, se encola.
- Diseño: tarjeta centrada con overlay difuminado, **el búho `/chakuy.png` (≈64 px) arriba en un círculo**
  con un anillo o badge pequeño del color del `tipo` (✓, ✕, !, i), título, mensaje (admite saltos de línea),
  botones al pie. Animación corta de entrada (respeta `prefers-reduced-motion`).
- Accesibilidad: `role="alertdialog"`, `aria-modal`, `aria-labelledby`/`aria-describedby`, foco inicial en el
  botón principal (en `confirm` de tipo peligro, en Cancelar), Esc = cancelar, Enter = botón con foco,
  el foco no sale del diálogo y vuelve al elemento anterior al cerrar.
- El `Modal.jsx` existente (formularios) se mantiene en API, pero se rediseña visualmente para que combine.

### 3. Reemplazos
- Reemplaza **todas** las llamadas a `alert(...)` (30) y `confirm(...)`/`window.confirm(...)` (13) en `src/`
  por `dialog.alert` / `dialog.confirm`. Los `confirm` que preceden a borrar, rechazar o anular usan `tipo: 'peligro'`.
  Los handlers que usan `confirm` pasan a `async` y hacen `if (!(await dialog.confirm(...))) return;`.
- Los avisos de resultado de una acción (guardado correcto / error al guardar) que hoy son banners temporales
  dentro de la página pasan a `dialog.alert` con `tipo` `exito` o `error`. Los textos de ayuda y la validación
  de campos siguen en línea, junto al campo.
- Al terminar, `grep -rnE "\balert\(|confirm\(" src` solo debe encontrar el sistema de diálogos.

### 4. Rediseño de componentes
Aplica el sistema visual a todo, empezando por lo compartido, para que las 40 páginas lo hereden:
- `global.css`: tokens (colores, radios 10–16 px, sombras suaves en capas, espaciado), tipografía
  (Plus Jakarta Sans para títulos, Inter para texto: ya están cargadas en `index.html`), botones
  (primario, secundario, fantasma, peligro, tamaños, estados hover/focus-visible/disabled/cargando),
  inputs/selects/textarea con foco visible, tablas (cabecera fija suave, filas con hover, zebra ligera),
  badges/estados, tarjetas, estados vacíos y de carga (skeleton simple).
- `Layout.jsx/.css`: barra lateral más limpia (íconos alineados, grupo activo con indicador de color de marca),
  cabecera con nombre y logo de la institución y un pie discreto «con tecnología de Chakuy Software» con el búho.
  Debe seguir funcionando la versión celular (menú desplegable).
- `Login.jsx`: pantalla dividida: panel de marca (logo de la institución o búho, nombre, lema) y formulario limpio.
- `StatCard`, `PageHeader`, `Modal`: alineados al nuevo sistema.
- Sin dependencias nuevas. Sin cambiar rutas, lógica de negocio ni llamadas a la API (salvo envolverlas con diálogos).

## Reparto
| Parte | Responsable |
|---|---|
| Backend | — (sin cambios) |
| Interfaz | Codex |
| QA | Claude (build, contrato, revisión de diff, recorrido por la API) |

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] No queda ningún `alert(` / `confirm(` nativo fuera del sistema de diálogos.
- [ ] `useDialog` existe con `alert` y `confirm` que devuelven promesas, y muestra el búho de Chakuy.
- [ ] Las confirmaciones destructivas usan el estilo peligro y el foco inicial va en Cancelar.
- [ ] La paleta por defecto es la azul Chakuy y los colores de «Mi institución» siguen cambiando la marca.
- [ ] El texto sobre el color de acento es oscuro.
- [ ] El verificador de contrato no reporta llamadas nuevas a endpoints inexistentes.
- [ ] La vista de celular (≤ 768 px) sigue usable: menú, tablas con scroll horizontal y diálogos a ancho completo con margen.

## Flujos E2E para QA
1. Login con cada rol (admin, jefe, docente, estudiante) → la pantalla de login y el layout tienen el nuevo diseño.
2. Admin → Usuarios → eliminar un usuario → aparece un diálogo de peligro con el búho; Cancelar no borra nada.
3. Jefe → Materias → acción que antes usaba `alert` → aparece un diálogo con el búho.
4. Admin → Mi institución → cambiar los colores → la interfaz toma los nuevos colores.
5. Celular (390 px): menú, una tabla larga y un diálogo.

## Fuera de alcance
- Backend, base de datos, rutas nuevas.
- El panel del superadmin y los subdominios (es otra tarea).


## Contrato de API
# Contrato de API · Rediseño azul Chakuy y alertas en modales

Esta tarea **no agrega ni cambia endpoints**. La UI solo puede seguir usando los endpoints que ya usa hoy
(están en la lista de rutas existentes del prompt). No se crean llamadas nuevas.

```endpoints
GET    /api/auth/institucion     rol: público   → datos de marca de la institución (sin cambios)
```

## Endpoints existentes que la UI puede reutilizar
Todos los que ya usa cada página, sin cambiar método, ruta, cuerpo ni manejo de la respuesta.


## Rutas que existen hoy en el backend (completas)
```
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
