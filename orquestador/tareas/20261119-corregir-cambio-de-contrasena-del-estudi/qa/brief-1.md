Eres el agente de QA de un equipo de tres agentes. Claude es el director y escribió el backend; Codex construyó la interfaz. Tu trabajo es **probar**, no programar: usa el navegador integrado para recorrer la aplicación como lo haría cada rol, y reporta lo que encuentres.

# Tarea a validar: Corregir cambio de contraseña del estudiante (ronda de QA 1)

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
6. Guarda una captura por cada hallazgo en `c:\chakuysoft\segedu\segedu\orquestador\tareas\20261119-corregir-cambio-de-contrasena-del-estudi\qa\capturas-1` con nombres como `H1-descripcion.png`.

## Archivos de la interfaz que cambiaron en esta tarea
- segedu-instituciones\frontend\src\pages\estudiante\InfoPersonal.jsx
- segedu-instituciones\frontend\src\pages\estudiante\Inicio.jsx

## Ronda anterior
(primera ronda)

## Plan (criterios y flujos)
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


## Contrato de API
# Contrato de API · Corregir cambio de contraseña del estudiante

Es la única fuente de verdad entre el backend (Claude) y la UI (Codex). Solo el director lo cambia.

```endpoints
PUT    /api/estudiante/cambiar-contrasena    rol: estudiante   → 200 { message }
GET    /api/auth/profile                     rol: cualquiera   → 200 { nombre, apellido, ci, telefono, ... }
PUT    /api/estudiante/info-personal         rol: estudiante   → 200
```

## Detalle por endpoint

### PUT /api/estudiante/cambiar-contrasena  (ya existe, sin cambios)
- **Rol:** estudiante
- **Cuerpo:** `{ "actual": string, "nueva": string, "confirmar": string }`
- **Respuesta 200:** `{ "message": "..." }`
- **Errores (cuerpo `{ error }`):**
  - 400 `Complete todos los campos de contraseña`
  - 400 `La nueva contraseña debe tener al menos 6 caracteres`
  - 400 `La confirmación no coincide con la nueva contraseña`
  - 400 `La contraseña actual es incorrecta`
  - 401 sin sesión · 404 usuario no encontrado

## Endpoints existentes que la UI puede reutilizar
Los tres de arriba, y los que ya usa `Inicio.jsx` para el panel: `GET /api/estudiante/asistencias/resumen`,
`GET /api/estudiante/cursos`, `GET /api/estudiante/materias`, `GET /api/estudiante/ranking-grupo`.

**No existen** y no deben usarse: `/api/estudiante/cursos-especiales` ni `/api/estudiante/cursos-especiales/:id/inscribir`.


## Reporte
Escribe el reporte en **`c:\chakuysoft\segedu\segedu\orquestador\tareas\20261119-corregir-cambio-de-contrasena-del-estudi\qa\reporte-1.md`**, en español, con este formato exacto. La primera línea debe ser el veredicto: el orquestador la lee para saber que terminaste.

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
