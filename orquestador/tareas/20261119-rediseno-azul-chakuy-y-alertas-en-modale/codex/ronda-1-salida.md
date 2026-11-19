**Archivos**

Cambios realizados solo dentro de `frontend`:

- `src/components/dialog/DialogProvider.jsx`, `Dialog.css`, `useModalAccessibility.js`: nuevos diálogos con búho, promesas, cola, foco controlado, Escape y confirmaciones de peligro.
- `src/components/PageState.jsx`: nuevo componente para carga, errores y reintentos.
- `src/main.jsx`: integración del proveedor de diálogos.
- `src/styles/global.css`: paleta azul, tipografías, botones, tablas, skeletons y ajustes móviles.
- `src/context/InstitucionContext.jsx`: nuevos colores predeterminados; personalización institucional conservada.
- `src/components/Layout.jsx`, `Layout.css`: cabecera institucional, navegación móvil y crédito Chakuy.
- `src/components/Modal.jsx`, `Modal.css`: diseño y accesibilidad.
- `src/components/StatCard.jsx`, `StatCard.css`, `PageHeader.jsx`: alineación visual.
- `src/pages/Login.jsx`, `Login.css`: presentación azul y mejoras de accesibilidad.

Páginas modificadas —todos los nombres siguientes son archivos `.jsx`—:

| Carpeta | Archivos | Cambios |
|---|---|---|
| `src/pages/admin` | `Carreras`, `Materias`, `Usuarios` | Diálogos, confirmaciones destructivas, carga y errores. |
| `src/pages/admin` | `Dashboard`, `Institucion`, `MateriaForm` | Marca dinámica, estados y avisos de resultados. |
| `src/pages/docente` | `Asistencia`, `Avance`, `CarpetaPedagogica`, `Comentarios`, `DatosPersonales`, `GruposDocente`, `PGO`, `Presentaciones`, `Tareas` | Migración de avisos, manejo de errores y tablas adaptables según la página. |
| `src/pages/docente` | `Inicio`, `MiDisciplina` | Estados de carga/error y tablas adaptables. |
| `src/pages/estudiante` | `Asistencias`, `Cursos`, `GruposEstudiante`, `InfoPersonal`, `TareasEstudiante` | Diálogos, resultados de acciones, errores y tablas adaptables. |
| `src/pages/estudiante` | `Inicio` | Prioridad al mensaje del backend; cambios previos conservados. |
| `src/pages/jefe` | `Actas`, `Asistencias`, `Avances`, `Disciplina`, `DisciplinaDocentes`, `Estudiantes`, `Horarios`, `MateriaEstudiantes`, `MateriaForm`, `Materias`, `Notificaciones`, `PGO` | Diálogos, confirmaciones, estados y tablas adaptables según la página. |
| `src/pages/jefe` | `CarpetasPedagogicas`, `Comportamiento`, `Dashboard` | Errores, carga y ajustes visuales. |
| `src/pages/auditor` | `PersonaSelector` | Carga y errores de consulta/selección. |
| `src/pages/compartido` | `PresentacionesVista` | Mensajes del backend y colores del sistema. |

**Endpoints usados**

Ninguna llamada nueva. Las **198 llamadas existentes** conservan métodos, rutas y argumentos. Verificador de contrato: **0 errores y 0 avisos**.

**Build**

`npm.cmd run build`: **correcto**. Solo permanece la advertencia de bundles mayores de 500 kB.

Revisión estática: **0 diálogos nativos**; **19 confirmaciones** con `await` y tipo `peligro`. Sin dependencias nuevas ni commits.

**Bloqueos**

Queda pendiente la validación visual/E2E de Antigravity.

La herramienta de control de equipo rechazó el acceso a Google Chrome porque no estaba aprobado; no pude completar la comprobación en navegador.