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
