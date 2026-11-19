# Orquestador de agentes

Claude dirige y los otros dos ejecutan, todo desde una sola terminal de Claude Code.

| Agente | Papel | Cómo se le llama |
|---|---|---|
| **Claude** (Claude Code) | Director: arquitectura, contrato de API, backend, revisión y decisiones | Skill `/orquestar` |
| **Codex** | Interfaz (frontend), siguiendo el contrato al pie de la letra | `codex exec` en sandbox, con el frontend como directorio de trabajo |
| **Antigravity** (Gemini) | QA: flujos E2E, revisión visual y capturas con su navegador integrado | Brief + reporte por archivo (modo `manual`) o un CLI (modo `cli`) |

## Uso

En Claude Code, desde la raíz del repositorio:

```
/orquestar agregar a los docentes un reporte de asistencia mensual por materia
```

Claude crea la tarea, escribe plan y contrato, implementa el backend, delega la UI a Codex, revisa el resultado, prepara la ronda de QA para Antigravity y decide con el reporte.

## Comandos

```bash
node orquestador/orq.mjs doctor                      # qué agentes encuentra
node orquestador/orq.mjs nueva "<título>" [--proyecto segedu]
node orquestador/orq.mjs contrato <id>               # contrato vs backend vs UI cambiada
node orquestador/orq.mjs contrato --todo             # revisa todas las llamadas de la UI
node orquestador/orq.mjs codex <id> [--dry-run]      # una ronda de Codex
node orquestador/orq.mjs qa <id> [--abrir]           # prepara una ronda de QA
node orquestador/orq.mjs qa <id> --esperar[=min]     # espera el reporte de la última ronda
node orquestador/orq.mjs estado [<id>]
```

## Qué evita que Codex invente endpoints

1. El prompt le da el contrato y la lista completa de rutas reales del backend, y le prohíbe usar otras.
2. `codex exec -C <frontend> -s workspace-write`: solo puede escribir dentro del frontend.
3. Después de cada ronda, el script compara el árbol antes y después, marca todo archivo tocado fuera del frontend y ejecuta el verificador de contrato. Este lee las rutas de Express (`app.use` + `router.get/post/...`) y las llamadas `api.get('/...')` de la UI.
4. Claude revisa el diff antes de pasar a QA.

## Una tarea

```
orquestador/tareas/20261119-reporte-mensual/
├── tarea.json            # proyecto, commit base, historial
├── plan.md               # objetivo, arquitectura, criterios, flujos E2E   (Claude)
├── contrato.md           # bloque ```endpoints``` + detalle               (Claude)
├── correcciones.md       # instrucciones para la siguiente ronda de Codex  (Claude)
├── bitacora.md
├── codex/ronda-N-prompt.md · ronda-N.log · ronda-N-salida.md · ronda-N-cambios.json
└── qa/brief-N.md · reporte-N.md · capturas-N/
```

## QA con Antigravity

Esta máquina tiene Antigravity de escritorio, que no trae un CLI de agente. Por eso el modo por defecto es `manual`:
`qa <id> --abrir` abre Antigravity en el proyecto y copia al portapapeles una instrucción de una línea. Se pega en un agente nuevo del Agent Manager. El agente prueba en su navegador y escribe `qa/reporte-N.md`, cuya primera línea es `VEREDICTO: APROBADO|RECHAZADO`. Mientras tanto, `qa <id> --esperar` espera ese archivo y le devuelve el control a Claude.

Para hacerlo sin intervención:
- **Gemini CLI**: `npm i -g @google/gemini-cli` y en `config.json` cambia `agentes.qa.modo` a `"cli"`. Revisa que `agentes.qa.cli.args` coincida con los flags de tu versión. Sin el navegador de Antigravity, la parte visual será más limitada.
- **Plugin de Claude Code para Antigravity**: si lo instalas, la skill puede usar su subagente con el mismo brief y la misma ruta de reporte.

## Ajustes (`config.json`)

- `proyectos.*`: rutas del frontend y del backend, comandos, URLs y credenciales de QA. Reemplaza `<dominio-del-seed>` por el dominio que imprimió `npm run seed`, o deja que Claude lo consulte. No guardes contraseñas reales.
- `agentes.codex`: `exe` (`auto` busca en el PATH y en `%LOCALAPPDATA%\OpenAI\Codex\bin`), `modelo`, `sandbox`, `rondasMax`. Si el sandbox de Windows falla, prueba `"sandbox": "danger-full-access"`; la protección de zona sigue funcionando porque se revisa después de cada ronda.
- `agentes.qa`: `modo` (`manual` o `cli`), `rondasMax`, `esperarMinutos`.

El verificador no entiende `router.route('/x').get(...)` ni URLs guardadas en variables. Estas últimas aparecen como avisos «no verificable».
