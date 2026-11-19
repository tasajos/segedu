# Plan · Corregir cambio de contraseña del estudiante

Proyecto: `segedu-instituciones`

## Objetivo
El estudiante no puede cambiar su contraseña desde **Datos personales**. La UI llama a
`PUT /api/estudiante/cambiar-contraseña` (con ñ). El backend expone `PUT /api/estudiante/cambiar-contrasena`,
así que la petición siempre falla (axios codifica la ñ y Express no encuentra la ruta).

Además, `pages/estudiante/Inicio.jsx` conserva código del módulo **cursos especiales**, que se retiró del
backend en SEGEDU Instituciones: llama a `/estudiante/cursos-especiales` y `/estudiante/cursos-especiales/:id/inscribir`,
que no existen. Ese estado (`cursosEsp`) nunca se carga, así que la sección no se muestra: es código muerto
con llamadas rotas.

## Decisiones de arquitectura
- No se toca el backend: el endpoint correcto ya existe y valida bien (campos obligatorios, mínimo 6
  caracteres, confirmación, contraseña actual). Responde los errores como `{ error }`.
- Se corrige la ruta en la UI y se elimina por completo el código de cursos especiales de `Inicio.jsx`
  (estado, función, sección del panel, componente `CursoQuickModal` y su uso, y los estilos que solo usaba eso).

## Reparto
| Parte | Responsable | Archivos |
|---|---|---|
| Backend | — (sin cambios) | |
| Interfaz | Codex | `frontend/src/pages/estudiante/InfoPersonal.jsx`, `frontend/src/pages/estudiante/Inicio.jsx` |
| QA | Claude (sin Antigravity) | — |

## Criterios de aceptación
- [ ] `InfoPersonal.jsx` llama a `PUT /estudiante/cambiar-contrasena` (sin ñ) con `{ actual, nueva, confirmar }`.
- [ ] Mensaje de éxito: "Contraseña actualizada correctamente" (con tilde y ñ, sin el prefijo "OK").
- [ ] Los errores del backend (`err.response.data.error`) se siguen mostrando tal cual.
- [ ] `Inicio.jsx` ya no contiene ninguna referencia a cursos especiales (`cursosEsp`, `procesandoCurso`, `modalCurso`, `inscribirseEnCurso`, `CursoQuickModal`, `/estudiante/cursos-especiales`).
- [ ] El resto del panel de inicio del estudiante (asistencias, cursos, materias, ranking) queda igual.
- [ ] `npm run build` del frontend pasa.
- [ ] El verificador de contrato no reporta violaciones en los archivos cambiados.

## Flujos E2E para QA
1. Estudiante → Datos personales → cambiar contraseña con la actual correcta y una nueva válida → mensaje de éxito; con la nueva contraseña se puede iniciar sesión.
2. Contraseña actual incorrecta → "La contraseña actual es incorrecta".
3. Nueva con menos de 6 caracteres → "La nueva contraseña debe tener al menos 6 caracteres".
4. Confirmación distinta → "La confirmación no coincide con la nueva contraseña".
5. Estudiante → Inicio → el panel carga sin errores en la consola y sin peticiones 404.

## Fuera de alcance
- Cambiar el backend o los textos de error del backend.
- Otros textos sin tilde en otras pantallas.
