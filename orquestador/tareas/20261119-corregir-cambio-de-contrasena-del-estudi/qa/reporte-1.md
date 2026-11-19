VEREDICTO: APROBADO

## Resumen
QA hecho por Claude (sin Antigravity), contra la API real en localhost:5000, con revisión del código y build.
La corrección funciona: la ruta anterior devolvía 404 y la nueva cambia la contraseña. No se probó la
interfaz en un navegador.

## Criterios de aceptación
| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | La UI llama a `PUT /estudiante/cambiar-contrasena` con `{ actual, nueva, confirmar }` | OK | diff de InfoPersonal.jsx; verificador de contrato sin violaciones |
| 2 | Mensaje "Contraseña actualizada correctamente" sin "OK" | OK | diff (el color ahora depende de `passwordSuccess`, no del prefijo "OK") |
| 3 | Los errores del backend se muestran tal cual | OK | se mantiene `err.response?.data?.error`; los 4 mensajes de 400 llegan en `error` |
| 4 | Sin referencias a cursos especiales en Inicio.jsx | OK | grep vacío; se eliminaron 374 líneas, incluido `createPortal` |
| 5 | El resto del panel de inicio queda igual | OK | las 4 peticiones del panel responden 200 para 3 estudiantes y para el auditor |
| 6 | `npm run build` pasa | OK | build en 9,3 s; solo la advertencia de siempre por el tamaño del bundle |
| 7 | Contrato sin violaciones | OK | `orq contrato`: 7 llamadas revisadas, 0 violaciones |

## Hallazgos
### H1 · bajo · ui · Inicio ahora oculta todo el panel si falla una petición
- Antes: cualquier error se ignoraba y el panel se mostraba con lo que hubiera.
- Ahora: si falla cualquiera de las 4 peticiones, se muestra solo un mensaje de error.
- Hoy no ocurre (todas responden 200 para estudiantes y auditor). Es un cambio aceptable: el prompt exige
  manejar errores. Se acepta sin cambios.

## Flujos probados sin problemas
- Antes del arreglo: `PUT /estudiante/cambiar-contrase%C3%B1a` → 404 (bug confirmado).
- Contraseña actual incorrecta → 400 "La contraseña actual es incorrecta".
- Nueva con 3 caracteres → 400 "La nueva contraseña debe tener al menos 6 caracteres".
- Confirmación distinta → 400 "La confirmación no coincide con la nueva contraseña".
- Campos vacíos → 400 "Complete todos los campos de contraseña".
- Cambio válido → 200. La contraseña anterior se rechaza y la nueva entra. Se restauró `demo1234`.
- Docente contra el endpoint del estudiante → 403. Sin token → 401.

## No probado
- Interfaz en el navegador: aspecto, vista de celular y consola. Lo cubriría Antigravity.
