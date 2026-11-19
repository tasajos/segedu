VEREDICTO: APROBADO

## Resumen
QA de Claude sin navegador: build, revisión del diff y verificación de contrato. El código cumple los criterios;
la revisión visual en el navegador queda pendiente (Antigravity no disponible; Codex intentó abrir Chrome con
computer-use y se lo denegaron, como corresponde).

## Criterios de aceptación
| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | `npm run build` pasa | OK | build en 9,6 s |
| 2 | Sin `alert(`/`confirm(` nativos | OK | grep vacío fuera de `components/dialog` |
| 3 | `useDialog` con promesas y búho | OK | `DialogProvider.jsx`: cola, `alert`/`confirm` → Promise, `/chakuy.png` 64 px con badge por tipo |
| 4 | Peligro con foco inicial en Cancelar | OK | `useModalAccessibility(..., confirm && tipo==='peligro' ? cancelRef : primaryRef)`; botón `btn-danger-solid` |
| 5 | Paleta Azul Chakuy y marca por institución | OK | `--brand #1E73BE`, `--accent #FFD60A`, `--teal #14A3A8`; `InstitucionContext` sigue sobrescribiendo |
| 6 | Texto oscuro sobre acento | OK | token `--on-accent: #0F172A` |
| 7 | Contrato sin violaciones | OK | 194 llamadas revisadas, 0 violaciones; ninguna llamada nueva |
| 8 | Vista celular | NO PROBADO | requiere navegador |

## Hallazgos
### H1 · bajo · ui · La instalación actual seguirá en verde
La base `segedu_instituciones` tiene guardado `color_primario = #1f6f5c` en «Mi institución», y ese color
sobrescribe la paleta nueva. Las instituciones nuevas nacen con azul Chakuy. Para la actual: cambiar los colores
en «Mi institución». No es un defecto del código.

### H2 · bajo · ui · `role="alertdialog"` también en avisos informativos
Aceptable: todos los diálogos requieren respuesta.

## Flujos probados sin problemas
- Confirmaciones de borrado de usuarios y materias: `await dialog.confirm(..., { tipo: 'peligro' })` antes de llamar a la API.
- Mensajes de error del backend: se muestran con `dialog.alert(..., { tipo: 'error' })`.
- Codex editó solo archivos de `segedu-instituciones/frontend` (verificado en su log: 40 rutas, todas en frontend). Los avisos de «fuera de zona» de la ronda eran los cambios de backend que Claude hizo en paralelo.

## No probado
- Aspecto visual, animaciones, vista de celular y consola del navegador.
