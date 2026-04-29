#!/usr/bin/env node
/**
 * SEGEDU — Deploy packager
 *
 * Compara HEAD contra el último commit desplegado y genera UN ZIP con:
 *   📁 database/   → migraciones SQL nuevas (ejecutar primero en phpMyAdmin)
 *   📁 frontend/   → dist/ completo compilado (subir a public/dist/)
 *   📁 backend/    → archivos src/ modificados (subir a src/)
 *
 * Uso:
 *   node deploy.js              → detecta cambios y genera el ZIP
 *   node deploy.js --frontend   → fuerza solo frontend
 *   node deploy.js --backend    → fuerza solo backend
 */

import { execSync }      from 'child_process';
import AdmZip            from 'adm-zip';
import path              from 'path';
import fs                from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ARGS       = process.argv.slice(2);
const SOLO_FRONT = ARGS.includes('--frontend');
const SOLO_BACK  = ARGS.includes('--backend');
const DO_FRONT   = !SOLO_BACK  || SOLO_FRONT;
const DO_BACK    = !SOLO_FRONT || SOLO_BACK;

const PATHS = {
  frontendRoot: path.join(__dirname, 'frontend'),
  frontendDist: path.join(__dirname, 'frontend', 'dist'),
  backendRoot:  path.join(__dirname, 'backend'),
  backendSrc:   path.join(__dirname, 'backend', 'src'),
  output:       path.join(__dirname, 'deploy_packages'),
  checkpoint:   path.join(__dirname, '.deploy-checkpoint'),
};

const now = new Date();
const TS  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

// ─── Colores ──────────────────────────────────────────────────
const C   = { reset:'\x1b[0m', bold:'\x1b[1m', cyan:'\x1b[36m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', gray:'\x1b[90m' };
const log  = (m) => console.log(`${C.cyan}▶${C.reset} ${m}`);
const ok   = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const warn = (m) => console.log(`${C.yellow}⚠${C.reset} ${m}`);
const fail = (m) => console.error(`${C.red}✗${C.reset} ${m}`);
const sep  = ()  => console.log(`${C.gray}${'─'.repeat(52)}${C.reset}`);

// ─── Git ──────────────────────────────────────────────────────
function git(cmd) {
  try { return execSync(`git ${cmd}`, { cwd: __dirname, stdio: 'pipe' }).toString().trim(); }
  catch { return ''; }
}

// Archivos modificados/añadidos entre dos refs bajo un prefijo
function diffFiles(from, to, prefix, filter = 'ACMR') {
  const out = git(`diff --name-only --diff-filter=${filter} ${from} ${to} -- "${prefix}"`);
  return out ? out.split('\n').filter(Boolean) : [];
}

// ─── Build frontend ───────────────────────────────────────────
function buildFrontend() {
  sep();
  log('Construyendo frontend (vite build)...');
  try {
    execSync('npm run build', { cwd: PATHS.frontendRoot, stdio: 'inherit' });
    ok('Build completado → frontend/dist/');
    return true;
  } catch {
    fail('El build falló.');
    return false;
  }
}

// ─── Agregar carpeta completa al ZIP ─────────────────────────
function addDirToZip(zip, localDir, zipBase) {
  const walk = (dir, base) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full   = path.join(dir, entry.name);
      const zipKey = `${base}/${entry.name}`;
      if (entry.isDirectory()) walk(full, zipKey);
      else zip.addFile(zipKey, fs.readFileSync(full));
    }
  };
  walk(localDir, zipBase);
}

// ─── Main ─────────────────────────────────────────────────────
function main() {
  console.log(`\n${C.bold}${C.cyan}  SEGEDU — Deploy packager${C.reset}\n`);

  fs.mkdirSync(PATHS.output, { recursive: true });

  // ── Refs de comparación ───────────────────────────────────
  const head       = git('rev-parse HEAD');
  const checkpoint = fs.existsSync(PATHS.checkpoint)
    ? fs.readFileSync(PATHS.checkpoint, 'utf-8').trim()
    : null;

  if (!head) { fail('No se pudo leer el commit HEAD. ¿Estás en un repositorio git?'); process.exit(1); }

  // Validar que el checkpoint todavía existe en el historial
  const fromRef = (() => {
    if (!checkpoint) {
      warn('Sin checkpoint previo. Comparando contra el commit anterior (HEAD~1).');
      return git('rev-parse HEAD~1') || null;
    }
    const exists = git(`cat-file -t ${checkpoint}`);
    if (!exists) {
      warn(`Checkpoint ${checkpoint.slice(0,8)} no encontrado. Usando HEAD~1.`);
      return git('rev-parse HEAD~1') || null;
    }
    return checkpoint;
  })();

  if (!fromRef) { fail('No hay commits anteriores para comparar.'); process.exit(1); }

  log(`Desde: ${C.gray}${fromRef.slice(0,8)}${C.reset}  →  Hasta: ${C.bold}${head.slice(0,8)}${C.reset} (HEAD)`);

  if (fromRef === head) {
    warn('HEAD y el checkpoint son el mismo commit. No hay cambios que empaquetar.');
    console.log(`  Haz un commit con tus cambios antes de generar el paquete.\n`);
    process.exit(0);
  }

  // Cambios sin commitear
  if (git('status --porcelain')) {
    warn('Tienes cambios sin commitear — no serán incluidos en el paquete.');
  }

  const zip         = new AdmZip();
  let incluyeFront  = false;
  let incluyeBack   = false;
  let incluyeDB     = false;
  const migraciones = [];

  // ── BASE DE DATOS (migraciones añadidas) ─────────────────
  const sqlFiles = diffFiles(fromRef, head, 'backend', 'A')
    .filter((f) => /migration_v\d+\.sql$/.test(f));

  if (sqlFiles.length > 0) {
    sep();
    log(`Base de datos: ${sqlFiles.length} migración(es) nueva(s):`);
    for (const rel of sqlFiles) {
      const abs = path.join(__dirname, rel);
      const fname = path.basename(rel);
      console.log(`   ${C.gray}· ${fname}${C.reset}`);
      if (fs.existsSync(abs)) {
        zip.addFile(`database/${fname}`, fs.readFileSync(abs));
        migraciones.push(fname);
      }
    }
    incluyeDB = true;
    ok('Migraciones agregadas → database/');
  }

  // ── FRONTEND ─────────────────────────────────────────────
  if (DO_FRONT) {
    const cambios = diffFiles(fromRef, head, 'frontend/src');

    if (cambios.length === 0) {
      sep();
      warn('Frontend: sin cambios desde el último deploy.');
    } else {
      sep();
      log(`Frontend: ${cambios.length} archivo(s) modificado(s):`);
      cambios.forEach((f) => console.log(`   ${C.gray}· ${f.replace('frontend/src/', '')}${C.reset}`));

      const built = buildFrontend();
      if (!built) process.exit(1);

      log('Empaquetando dist/...');
      addDirToZip(zip, PATHS.frontendDist, 'frontend');
      incluyeFront = true;
      ok('Frontend agregado → frontend/');
    }
  }

  // ── BACKEND ──────────────────────────────────────────────
  if (DO_BACK) {
    const cambios = diffFiles(fromRef, head, 'backend/src');

    if (cambios.length === 0) {
      sep();
      warn('Backend: sin cambios desde el último deploy.');
    } else {
      sep();
      log(`Backend: ${cambios.length} archivo(s) modificado(s):`);
      cambios.forEach((f) => console.log(`   ${C.gray}· ${f.replace('backend/src/', '')}${C.reset}`));

      for (const rel of cambios) {
        const abs    = path.join(__dirname, rel);
        if (!fs.existsSync(abs)) { warn(`No encontrado: ${rel}`); continue; }
        const zipKey = rel.replace(/^backend[\\/]/, '').replace(/\\/g, '/');
        zip.addFile(zipKey, fs.readFileSync(abs));
      }
      incluyeBack = true;
      ok('Backend agregado → backend/src/');
    }
  }

  // ── Sin cambios ───────────────────────────────────────────
  if (!incluyeFront && !incluyeBack && !incluyeDB) {
    sep();
    warn('No hay cambios entre los commits. No se generó ningún paquete.');
    process.exit(0);
  }

  // ── Instrucciones dentro del ZIP ─────────────────────────
  const lineas = [
    '╔══════════════════════════════════════════════════════════╗',
    '║          SEGEDU — Instrucciones de deploy                ║',
    '╚══════════════════════════════════════════════════════════╝',
    '',
    `Commits incluidos: ${fromRef.slice(0,8)} → ${head.slice(0,8)}`,
    `Generado: ${new Date().toLocaleString('es-ES')}`,
    '',
  ];
  if (incluyeDB) lineas.push(
    '⚠  BASE DE DATOS — Ejecutar PRIMERO en phpMyAdmin',
    '   Carpeta: database/',
    '   Orden numérico:',
    ...migraciones.map((f) => `     · ${f}`),
    '',
  );
  if (incluyeFront) lineas.push(
    '📁 FRONTEND — Carpeta: frontend/',
    '   → Borrar la carpeta assets/ antigua del servidor',
    '   → Subir TODO el contenido a: public/dist/',
    '',
  );
  if (incluyeBack) lineas.push(
    '📁 BACKEND — Carpeta: backend/src/',
    '   → Subir el contenido a: src/ en la raíz del servidor',
    '   → Hacer RESTART en el panel Node.js',
    '',
  );
  zip.addFile('INSTRUCCIONES.txt', Buffer.from(lineas.join('\n'), 'utf-8'));

  // ── Escribir ZIP ─────────────────────────────────────────
  const zipName = `segedu_deploy_${TS}.zip`;
  const zipPath = path.join(PATHS.output, zipName);
  zip.writeZip(zipPath);

  const kb = Math.round(fs.statSync(zipPath).size / 1024);

  // ── Guardar checkpoint ────────────────────────────────────
  fs.writeFileSync(PATHS.checkpoint, head, 'utf-8');

  // ── Resumen final ─────────────────────────────────────────
  sep();
  console.log(`\n${C.bold}${C.green}  ✓ Paquete listo (${kb} KB)${C.reset}`);
  console.log(`  ${C.bold}deploy_packages/${zipName}${C.reset}\n`);
  if (incluyeDB)    console.log(`  ${C.yellow}database/${C.reset}   → phpMyAdmin        (orden numérico, primero)`);
  if (incluyeFront) console.log(`  ${C.cyan}frontend/${C.reset}   → public/dist/      (reemplazar TODO)`);
  if (incluyeBack)  console.log(`  ${C.cyan}backend/${C.reset}    → src/              (reemplazar + restart Node)`);
  console.log('');
}

main();
