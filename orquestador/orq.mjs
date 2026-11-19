#!/usr/bin/env node
// Orquestador: Claude dirige, Codex hace la UI y Antigravity (Gemini) hace QA.
//
//   node orquestador/orq.mjs nueva "<título>" [--proyecto <nombre>]
//   node orquestador/orq.mjs contrato <id> | --todo [--proyecto <nombre>]
//   node orquestador/orq.mjs codex <id> [--dry-run]
//   node orquestador/orq.mjs qa <id> [--dry-run] [--abrir] [--esperar[=min]]
//   node orquestador/orq.mjs estado [<id>]
//   node orquestador/orq.mjs doctor
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verificar, rutasBackend } from './contrato.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..');
const TAREAS = path.join(AQUI, 'tareas');
const cfg = JSON.parse(fs.readFileSync(path.join(AQUI, 'config.json'), 'utf8'));

// ---------- utilidades ----------

const args = process.argv.slice(2);
const flag = (n) => args.some((a) => a === `--${n}` || a.startsWith(`--${n}=`));
const valor = (n) => {
  const i = args.findIndex((a) => a === `--${n}` || a.startsWith(`--${n}=`));
  if (i < 0) return null;
  if (args[i].includes('=')) return args[i].split('=').slice(1).join('=');
  const sig = args[i + 1];
  return sig && !sig.startsWith('--') ? sig : true;
};
const posicionales = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--proyecto'));

const morir = (msg, codigo = 1) => { console.error(`✖ ${msg}`); process.exit(codigo); };
const leer = (p, def = '') => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : def);
const escribir = (p, t) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); };
const ahora = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const git = (...a) => spawnSync('git', a, { cwd: REPO, encoding: 'utf8' }).stdout?.trim() ?? '';

const plantilla = (nombre, vars) =>
  leer(path.join(AQUI, 'prompts', nombre)).replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

function proyectoDe(nombre) {
  const n = nombre || cfg.proyectoPorDefecto;
  const p = cfg.proyectos[n];
  if (!p) morir(`Proyecto desconocido: ${n}. Opciones: ${Object.keys(cfg.proyectos).join(', ')}`);
  return { nombre: n, ...p, abs: path.resolve(REPO, p.dir) };
}

function cargarTarea(id) {
  if (!id) morir('Falta el id de la tarea. Usa: node orquestador/orq.mjs estado');
  const dir = path.join(TAREAS, id);
  const f = path.join(dir, 'tarea.json');
  if (!fs.existsSync(f)) morir(`No existe la tarea ${id}`);
  const t = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { ...t, dir, proyecto: proyectoDe(t.proyecto) };
}

function registrar(tarea, evento, detalle = {}) {
  const f = path.join(tarea.dir, 'tarea.json');
  const t = JSON.parse(fs.readFileSync(f, 'utf8'));
  t.historial.push({ fecha: ahora(), evento, ...detalle });
  fs.writeFileSync(f, JSON.stringify(t, null, 2));
  fs.appendFileSync(path.join(tarea.dir, 'bitacora.md'), `- ${ahora()} · **${evento}** ${detalle.nota ?? ''}\n`);
}

const siguienteRonda = (dir, prefijo) => {
  if (!fs.existsSync(dir)) return 1;
  const n = fs.readdirSync(dir).map((f) => f.match(new RegExp(`^${prefijo}-(\\d+)`))?.[1]).filter(Boolean).map(Number);
  return n.length ? Math.max(...n) + 1 : 1;
};

// Fotografía de archivos modificados/no versionados con su hash, para saber qué tocó cada agente.
function fotoCambios() {
  const salida = spawnSync('git', ['status', '--porcelain', '-uall', '-z'], { cwd: REPO, encoding: 'utf8' }).stdout || '';
  const foto = {};
  for (const ent of salida.split('\0').filter(Boolean)) {
    const rel = ent.slice(3);
    const abs = path.join(REPO, rel);
    foto[rel] = fs.existsSync(abs) && fs.statSync(abs).isFile()
      ? crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex')
      : 'borrado';
  }
  return foto;
}
const difFotos = (antes, despues) =>
  [...new Set([...Object.keys(antes), ...Object.keys(despues)])].filter((f) => antes[f] !== despues[f]);

function archivosFrontCambiados(tarea) {
  const front = path.posix.join(tarea.proyecto.dir === '.' ? '' : tarea.proyecto.dir, tarea.proyecto.frontend).replace(/^\//, '');
  const rel = [
    ...git('diff', '--name-only', tarea.base, '--', front).split('\n'),
    ...git('ls-files', '--others', '--exclude-standard', '--', front).split('\n')
  ].filter(Boolean);
  return [...new Set(rel)].map((r) => path.join(REPO, r)).filter((a) => fs.existsSync(a));
}

function encontrarCodex() {
  const c = cfg.agentes.codex.exe;
  if (c && c !== 'auto') return c;
  const enPath = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['codex'], { encoding: 'utf8' });
  if (enPath.status === 0) return enPath.stdout.split(/\r?\n/)[0].trim();
  const base = path.join(process.env.LOCALAPPDATA || '', 'OpenAI', 'Codex', 'bin');
  if (fs.existsSync(base)) {
    const candidatos = fs.readdirSync(base)
      .map((d) => path.join(base, d, 'codex.exe'))
      .filter((p) => fs.existsSync(p))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (candidatos[0]) return candidatos[0];
  }
  return null;
}

function encontrarAntigravity() {
  const c = cfg.agentes.qa.antigravityExe;
  if (c && c !== 'auto') return c;
  const p = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'Antigravity.exe');
  return fs.existsSync(p) ? p : null;
}

// Ejecuta un proceso mostrando la salida y guardándola en un log.
function ejecutar(cmd, argv, { cwd, entrada, log, shell = false }) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const hijo = spawn(cmd, argv, { cwd, env, shell, stdio: ['pipe', 'pipe', 'pipe'] });
    const out = fs.createWriteStream(log);
    const volcar = (d) => { process.stdout.write(d); out.write(d); };
    hijo.stdout.on('data', volcar);
    hijo.stderr.on('data', volcar);
    hijo.on('error', (e) => { volcar(`\n[orquestador] No se pudo iniciar ${cmd}: ${e.message}\n`); });
    hijo.on('close', (codigo) => { out.end(); resolve(codigo ?? 1); });
    if (entrada) hijo.stdin.write(entrada);
    hijo.stdin.end();
  });
}

function imprimirVerificacion(r, titulo) {
  console.log(`\n── ${titulo} ──`);
  console.log(`Rutas en el backend: ${r.rutas.length} · Llamadas revisadas en la UI: ${r.llamadas.length} · Endpoints del contrato: ${r.delContrato.length}`);
  for (const e of r.errores) console.log(`  ✖ ${e}`);
  for (const a of r.avisos) console.log(`  ⚠ ${a}`);
  console.log(r.errores.length ? `Resultado: ${r.errores.length} violación(es) del contrato.` : 'Resultado: la UI respeta el contrato.');
}

// ---------- comandos ----------

function cmdNueva() {
  const titulo = posicionales[1];
  if (!titulo) morir('Uso: node orquestador/orq.mjs nueva "<título>" [--proyecto <nombre>]');
  const proyecto = proyectoDe(valor('proyecto'));
  const slug = titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let id = `${fecha}-${slug}`;
  for (let i = 2; fs.existsSync(path.join(TAREAS, id)); i++) id = `${fecha}-${slug}-${i}`;
  const dir = path.join(TAREAS, id);

  const tarea = { id, titulo, proyecto: proyecto.nombre, base: git('rev-parse', 'HEAD'), rama: git('rev-parse', '--abbrev-ref', 'HEAD'), creada: ahora(), historial: [] };
  escribir(path.join(dir, 'tarea.json'), JSON.stringify(tarea, null, 2));
  escribir(path.join(dir, 'plan.md'), plantilla('plan.plantilla.md', { TITULO: titulo, PROYECTO: proyecto.nombre }));
  escribir(path.join(dir, 'contrato.md'), plantilla('contrato.plantilla.md', { TITULO: titulo, API_BASE: proyecto.apiBase }));
  escribir(path.join(dir, 'bitacora.md'), `# Bitácora · ${titulo}\n\n`);
  registrar({ dir }, 'tarea creada', { nota: `proyecto ${proyecto.nombre}, base ${tarea.base.slice(0, 7)}` });
  console.log(id);
  console.log(`Carpeta: ${dir}`);
  console.log('Siguiente paso (Claude): completar plan.md y contrato.md.');
}

function cmdContrato() {
  if (flag('todo')) {
    const proyecto = proyectoDe(valor('proyecto'));
    const r = verificar({ proyectoDir: proyecto.abs, proyecto });
    imprimirVerificacion(r, `Contrato · todo ${proyecto.nombre}`);
    process.exit(r.errores.length ? 1 : 0);
  }
  const tarea = cargarTarea(posicionales[1]);
  const r = verificar({
    proyectoDir: tarea.proyecto.abs,
    proyecto: tarea.proyecto,
    contrato: leer(path.join(tarea.dir, 'contrato.md')),
    soloArchivos: archivosFrontCambiados(tarea)
  });
  imprimirVerificacion(r, `Contrato · ${tarea.id} (solo archivos de la UI cambiados en esta tarea)`);
  registrar(tarea, 'verificación de contrato', { nota: r.errores.length ? `${r.errores.length} violaciones` : 'ok', errores: r.errores });
  process.exit(r.errores.length ? 1 : 0);
}

async function cmdCodex() {
  const tarea = cargarTarea(posicionales[1]);
  const conf = cfg.agentes.codex;
  const dirCodex = path.join(tarea.dir, 'codex');
  const ronda = siguienteRonda(dirCodex, 'ronda');
  if (ronda > conf.rondasMax && !flag('forzar')) {
    morir(`Codex ya hizo ${conf.rondasMax} rondas. Decide tú (Claude) si haces la UI o usas --forzar.`, 4);
  }

  const contrato = leer(path.join(tarea.dir, 'contrato.md'));
  const pendientes = verificar({ proyectoDir: tarea.proyecto.abs, proyecto: tarea.proyecto, contrato, soloArchivos: [] });
  if (pendientes.errores.length && !flag('forzar')) {
    imprimirVerificacion(pendientes, 'Antes de delegar');
    morir('El backend todavía no implementa todo el contrato. Termínalo antes de pasarle la UI a Codex.', 5);
  }

  const frontAbs = path.join(tarea.proyecto.abs, tarea.proyecto.frontend);
  const rutas = rutasBackend(tarea.proyecto.abs, tarea.proyecto).map((r) => `${r.metodo.padEnd(6)} ${r.ruta}`).join('\n');
  const prompt = plantilla('codex-ui.md', {
    TITULO: tarea.titulo,
    PROYECTO: tarea.proyecto.nombre,
    FRONTEND_DIR: frontAbs,
    API_BASE: tarea.proyecto.apiBase,
    PLAN: leer(path.join(tarea.dir, 'plan.md')),
    CONTRATO: contrato,
    RUTAS: rutas,
    RONDA: String(ronda),
    CORRECCIONES: ronda > 1 ? leer(path.join(tarea.dir, 'correcciones.md'), '(sin correcciones escritas)') : '(primera ronda)'
  });
  const fPrompt = path.join(dirCodex, flag('dry-run') ? 'dry-run-prompt.md' : `ronda-${ronda}-prompt.md`);
  const fSalida = path.join(dirCodex, `ronda-${ronda}-salida.md`);
  const fLog = path.join(dirCodex, `ronda-${ronda}.log`);
  escribir(fPrompt, prompt);

  const exe = encontrarCodex();
  if (!exe) morir('No encontré el CLI de Codex. Instálalo (npm i -g @openai/codex) o pon la ruta en config.json → agentes.codex.exe');
  const argv = ['exec', '-C', frontAbs, '-s', conf.sandbox, '-o', fSalida,
    ...(conf.modelo ? ['-m', conf.modelo] : []), ...(conf.argsExtra || []), '-'];

  if (flag('dry-run')) {
    console.log(`[dry-run] ${exe} ${argv.join(' ')}`);
    console.log(`[dry-run] prompt: ${fPrompt}`);
    return;
  }

  registrar(tarea, `codex ronda ${ronda} iniciada`);
  const antes = fotoCambios();
  const codigo = await ejecutar(exe, argv, { cwd: frontAbs, entrada: prompt, log: fLog });
  const cambios = difFotos(antes, fotoCambios());

  const frontRel = path.relative(REPO, frontAbs).split(path.sep).join('/');
  // orquestador/ lo escriben el script (salida de -o) y el director; el sandbox de Codex no llega ahí.
  const fuera = cambios.filter((f) => !f.startsWith(frontRel + '/') && !f.startsWith('orquestador/'));
  escribir(path.join(dirCodex, `ronda-${ronda}-cambios.json`), JSON.stringify({ codigo, cambios, fueraDeZona: fuera }, null, 2));

  console.log(`\n── Codex ronda ${ronda} terminó (código ${codigo}) ──`);
  console.log(`Archivos que tocó: ${cambios.length}`);
  for (const f of cambios) console.log(`  ${fuera.includes(f) ? '✖ FUERA DE SU ZONA' : '·'} ${f}`);
  console.log(`Resumen de Codex: ${fSalida}`);

  const r = verificar({ proyectoDir: tarea.proyecto.abs, proyecto: tarea.proyecto, contrato, soloArchivos: archivosFrontCambiados(tarea) });
  imprimirVerificacion(r, 'Contrato tras la ronda de Codex');
  registrar(tarea, `codex ronda ${ronda} terminada`, {
    nota: `código ${codigo}, ${cambios.length} archivos, ${fuera.length} fuera de zona, ${r.errores.length} violaciones`,
    codigo, cambios, fueraDeZona: fuera, violaciones: r.errores
  });
  process.exit(codigo !== 0 ? 1 : fuera.length || r.errores.length ? 2 : 0);
}

function veredictoDe(texto) {
  return texto.match(/VEREDICTO:\s*\**\s*(APROBADO|RECHAZADO)/i)?.[1]?.toUpperCase() ?? null;
}

async function esperarReporte(tarea, fReporte, minutos) {
  const limite = Date.now() + minutos * 60_000;
  console.log(`Esperando el reporte de QA en ${fReporte} (hasta ${minutos} min)…`);
  while (Date.now() < limite) {
    const v = veredictoDe(leer(fReporte));
    if (v) {
      registrar(tarea, `qa reporte recibido`, { nota: v, veredicto: v, reporte: path.relative(tarea.dir, fReporte) });
      console.log(`\n── QA: ${v} ──\nReporte: ${fReporte}`);
      process.exit(v === 'APROBADO' ? 0 : 2);
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  registrar(tarea, 'qa sin reporte', { nota: `pasaron ${minutos} min` });
  morir(`No llegó el reporte en ${minutos} minutos.`, 3);
}

async function cmdQa() {
  const tarea = cargarTarea(posicionales[1]);
  const conf = cfg.agentes.qa;
  const dirQa = path.join(tarea.dir, 'qa');

  // --esperar sin lanzar nada nuevo: espera el reporte de la última ronda.
  if (flag('esperar') && !flag('abrir') && fs.existsSync(dirQa) && siguienteRonda(dirQa, 'brief') > 1 && !flag('nueva')) {
    const ronda = siguienteRonda(dirQa, 'brief') - 1;
    const min = Number(valor('esperar')) || conf.esperarMinutos;
    return esperarReporte(tarea, path.join(dirQa, `reporte-${ronda}.md`), min);
  }

  const ronda = siguienteRonda(dirQa, 'brief');
  if (ronda > conf.rondasMax && !flag('forzar')) morir(`QA ya hizo ${conf.rondasMax} rondas. Decide tú si cierras o usas --forzar.`, 4);

  const fBrief = path.join(dirQa, flag('dry-run') ? 'dry-run-brief.md' : `brief-${ronda}.md`);
  const fReporte = path.join(dirQa, `reporte-${ronda}.md`);
  const dirCapturas = path.join(dirQa, `capturas-${ronda}`);
  if (!flag('dry-run')) fs.mkdirSync(dirCapturas, { recursive: true });

  const p = tarea.proyecto;
  const cambiados = archivosFrontCambiados(tarea).map((a) => '- ' + path.relative(REPO, a)).join('\n') || '- (sin cambios en la UI)';
  const creds = Object.entries(p.credencialesQA || {}).map(([rol, c]) => `- ${rol}: ${c}`).join('\n') || '- (pídelas al director)';
  const anterior = ronda > 1 ? leer(path.join(dirQa, `reporte-${ronda - 1}.md`), '') : '';

  escribir(fBrief, plantilla('qa.md', {
    TITULO: tarea.titulo,
    PROYECTO: p.nombre,
    PROYECTO_DIR: p.abs,
    URL_APP: p.urlApp,
    URL_API: p.urlApi,
    CREDENCIALES: creds,
    PLAN: leer(path.join(tarea.dir, 'plan.md')),
    CONTRATO: leer(path.join(tarea.dir, 'contrato.md')),
    CAMBIADOS: cambiados,
    REPORTE: fReporte,
    CAPTURAS: dirCapturas,
    RONDA: String(ronda),
    ANTERIOR: anterior ? `Este es el reporte de la ronda anterior. Comprueba primero que esos hallazgos estén corregidos:\n\n${anterior}` : '(primera ronda)'
  }));

  const instruccion = `Lee el archivo ${fBrief} y sigue sus instrucciones al pie de la letra. Escribe el reporte en ${fReporte}.`;

  if (flag('dry-run')) { console.log(`[dry-run] brief: ${fBrief}\n[dry-run] instrucción: ${instruccion}`); return; }

  const modo = typeof valor('modo') === 'string' ? valor('modo') : conf.modo;
  registrar(tarea, `qa ronda ${ronda} preparada`, { nota: `modo ${modo}` });

  // Modo claude: sin Antigravity, el director hace el QA con el mismo brief y formato de reporte.
  if (modo === 'claude') {
    console.log(`QA ronda ${ronda} a cargo de Claude (sin Antigravity).`);
    console.log(`Brief: ${fBrief}\nEscribe el reporte en: ${fReporte}`);
    console.log(`Luego: node orquestador/orq.mjs qa ${tarea.id} --esperar=1`);
    return;
  }

  if (modo === 'cli') {
    const c = conf.cli;
    const argv = c.args.map((a) => a.replaceAll('{promptFile}', fBrief).replaceAll('{reporte}', fReporte));
    const codigo = await ejecutar(c.cmd, argv, { cwd: p.abs, log: path.join(dirQa, `ronda-${ronda}.log`), shell: c.shell });
    if (codigo !== 0) console.log(`El CLI de QA terminó con código ${codigo}.`);
    return esperarReporte(tarea, fReporte, 1);
  }

  // Modo manual: Antigravity de escritorio con su navegador integrado.
  if (process.platform === 'win32') {
    spawnSync('clip', { input: Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(instruccion, 'utf16le')]) });
  }
  if (flag('abrir')) {
    const exe = encontrarAntigravity();
    if (exe) {
      const env = { ...process.env };
      delete env.ELECTRON_RUN_AS_NODE;
      spawn(exe, [p.abs], { env, detached: true, stdio: 'ignore' }).unref();
      console.log('Abrí Antigravity en el proyecto.');
    } else console.log('No encontré Antigravity.exe; ábrelo a mano.');
  }
  console.log(`\nQA ronda ${ronda} lista para Antigravity.`);
  console.log('En el Agent Manager de Antigravity, abre un agente nuevo en este proyecto y pega esto (ya está en el portapapeles):\n');
  console.log(`  ${instruccion}\n`);
  if (flag('esperar')) return esperarReporte(tarea, fReporte, Number(valor('esperar')) || conf.esperarMinutos);
  console.log(`Luego: node orquestador/orq.mjs qa ${tarea.id} --esperar`);
}

function cmdEstado() {
  const id = posicionales[1];
  if (!id) {
    if (!fs.existsSync(TAREAS)) return console.log('No hay tareas.');
    for (const d of fs.readdirSync(TAREAS).sort()) {
      const f = path.join(TAREAS, d, 'tarea.json');
      if (!fs.existsSync(f)) continue;
      const t = JSON.parse(fs.readFileSync(f, 'utf8'));
      const ult = t.historial[t.historial.length - 1];
      console.log(`${t.id}  [${t.proyecto}]  ${ult ? `${ult.fecha} · ${ult.evento}` : ''}`);
    }
    return;
  }
  const t = cargarTarea(id);
  console.log(`${t.titulo}  (${t.id}, proyecto ${t.proyecto.nombre}, base ${t.base.slice(0, 7)})\n`);
  for (const h of t.historial) console.log(`  ${h.fecha}  ${h.evento}${h.nota ? ' — ' + h.nota : ''}`);
}

function cmdDoctor() {
  const codex = encontrarCodex();
  const ver = codex ? spawnSync(codex, ['--version'], { encoding: 'utf8' }).stdout?.trim() : null;
  console.log(`Codex CLI      : ${codex ? `${ver || '?'}  (${codex})` : '✖ no encontrado'}`);
  const ag = encontrarAntigravity();
  console.log(`Antigravity    : ${ag ? ag : '✖ no encontrado'}`);
  console.log(`QA modo        : ${cfg.agentes.qa.modo}`);
  if (cfg.agentes.qa.modo === 'cli') {
    const w = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cfg.agentes.qa.cli.cmd], { encoding: 'utf8' });
    console.log(`QA CLI         : ${w.status === 0 ? w.stdout.split(/\r?\n/)[0] : `✖ "${cfg.agentes.qa.cli.cmd}" no está en el PATH`}`);
  }
  for (const [n, p] of Object.entries(cfg.proyectos)) {
    const abs = path.resolve(REPO, p.dir);
    try {
      const r = rutasBackend(abs, p);
      console.log(`Proyecto ${n.padEnd(22)}: ${r.length} rutas en el backend`);
    } catch (e) {
      console.log(`Proyecto ${n.padEnd(22)}: ✖ ${e.message}`);
    }
  }
}

const comandos = { nueva: cmdNueva, contrato: cmdContrato, codex: cmdCodex, qa: cmdQa, estado: cmdEstado, doctor: cmdDoctor };
const c = comandos[posicionales[0]];
if (!c) {
  console.log(leer(fileURLToPath(import.meta.url)).split('\n').slice(1, 9).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(posicionales[0] ? 1 : 0);
}
await c();
