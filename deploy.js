#!/usr/bin/env node
/**
 * SEGEDU — Deploy packager
 *
 * Genera UN solo ZIP con dos carpetas:
 *   📁 frontend/   → sube su contenido a  public/dist/  (reemplaza TODO)
 *   📁 backend/    → sube su contenido a  src/           (reemplaza archivos)
 *
 * Uso:
 *   node deploy.js             → últimas 10 horas
 *   node deploy.js --horas 24
 *   node deploy.js --frontend  → solo incluye frontend
 *   node deploy.js --backend   → solo incluye backend
 */

import { execSync }      from 'child_process';
import AdmZip            from 'adm-zip';
import path              from 'path';
import fs                from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Argumentos ───────────────────────────────────────────────
const args       = process.argv.slice(2);
const horasIdx   = args.indexOf('--horas');
const HORAS      = horasIdx !== -1 ? Number(args[horasIdx + 1]) || 10 : 10;
const SOLO_FRONT = args.includes('--frontend');
const SOLO_BACK  = args.includes('--backend');
const DO_FRONT   = !SOLO_BACK  || SOLO_FRONT;
const DO_BACK    = !SOLO_FRONT || SOLO_BACK;
const LIMITE_MS  = Date.now() - HORAS * 60 * 60 * 1000;

const PATHS = {
  frontendSrc:  path.join(__dirname, 'frontend', 'src'),
  frontendRoot: path.join(__dirname, 'frontend'),
  frontendDist: path.join(__dirname, 'frontend', 'dist'),
  backendSrc:   path.join(__dirname, 'backend', 'src'),
  output:       path.join(__dirname, 'deploy_packages'),
};

const now = new Date();
const TS  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
const ZIP_NAME = `segedu_deploy_${TS}.zip`;

// ─── Consola ──────────────────────────────────────────────────
const C    = { reset:'\x1b[0m', bold:'\x1b[1m', cyan:'\x1b[36m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', gray:'\x1b[90m' };
const log  = (m) => console.log(`${C.cyan}▶${C.reset} ${m}`);
const ok   = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const warn = (m) => console.log(`${C.yellow}⚠${C.reset} ${m}`);
const fail = (m) => console.error(`${C.red}✗${C.reset} ${m}`);
const sep  = ()  => console.log(`${C.gray}${'─'.repeat(52)}${C.reset}`);

// ─── Escanear archivos modificados en las últimas N horas ─────
function scanModified(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  const walk = (cur) => {
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (fs.statSync(full).mtimeMs >= LIMITE_MS) result.push(full);
    }
  };
  walk(dir);
  return result;
}

// ─── Agregar carpeta completa al ZIP ──────────────────────────
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

// ─── Build del frontend ───────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────
function main() {
  console.log(`\n${C.bold}${C.cyan}  SEGEDU — Deploy packager${C.reset}`);
  console.log(`  ${C.gray}Cambios de las últimas ${HORAS} horas → ${ZIP_NAME}${C.reset}\n`);

  fs.mkdirSync(PATHS.output, { recursive: true });

  const zip          = new AdmZip();
  let   incluyeFront = false;
  let   incluyeBack  = false;

  // ── FRONTEND ─────────────────────────────────────────────────
  if (DO_FRONT) {
    const modificados = scanModified(PATHS.frontendSrc);

    if (modificados.length === 0) {
      sep();
      warn(`Frontend: sin cambios en las últimas ${HORAS}h — no se incluye.`);
    } else {
      sep();
      log(`Frontend: ${modificados.length} archivo(s) modificado(s):`);
      modificados.forEach(f =>
        console.log(`   ${C.gray}· ${path.relative(path.join(__dirname, 'frontend'), f)}${C.reset}`)
      );

      const built = buildFrontend();
      if (!built) process.exit(1);

      if (!fs.existsSync(PATHS.frontendDist)) {
        fail('No existe frontend/dist/ tras el build.');
        process.exit(1);
      }

      log('Agregando dist/ al paquete...');
      // frontend/ en el ZIP corresponde al contenido de public/dist/ en el servidor
      addDirToZip(zip, PATHS.frontendDist, 'frontend');
      incluyeFront = true;
      ok('Frontend agregado al ZIP como frontend/');
    }
  }

  // ── BACKEND ──────────────────────────────────────────────────
  if (DO_BACK) {
    const modificados = scanModified(PATHS.backendSrc);

    if (modificados.length === 0) {
      sep();
      warn(`Backend: sin cambios en las últimas ${HORAS}h — no se incluye.`);
    } else {
      sep();
      log(`Backend: ${modificados.length} archivo(s) modificado(s):`);
      modificados.forEach(f =>
        console.log(`   ${C.gray}· ${path.relative(PATHS.backendSrc, f)}${C.reset}`)
      );

      log('Agregando archivos al paquete...');
      for (const absPath of modificados) {
        // src/controllers/foo.js → backend/src/controllers/foo.js en el ZIP
        const rel    = path.relative(PATHS.backendSrc, absPath).replace(/\\/g, '/');
        const zipKey = `backend/src/${rel}`;
        zip.addFile(zipKey, fs.readFileSync(absPath));
      }
      incluyeBack  = true;
      ok('Backend agregado al ZIP como backend/src/');
    }
  }

  // ── Nada que empaquetar ───────────────────────────────────────
  if (!incluyeFront && !incluyeBack) {
    sep();
    warn(`Sin cambios en las últimas ${HORAS}h. No se generó ningún paquete.`);
    console.log(`  Prueba: ${C.cyan}node deploy.js --horas 48${C.reset}\n`);
    return;
  }

  // ── Instrucciones dentro del ZIP ──────────────────────────────
  const instrucciones = [
    '╔══════════════════════════════════════════════════════════╗',
    '║          SEGEDU — Instrucciones de deploy                ║',
    '╚══════════════════════════════════════════════════════════╝',
    '',
    incluyeFront ? [
      '📁 FRONTEND  (carpeta: frontend/)',
      '   → Sube TODO el contenido a:  public/dist/',
      '   → IMPORTANTE: borra primero la carpeta assets/ antigua',
      '     antes de subir la nueva para evitar archivos viejos.',
      '',
    ].join('\n') : '',
    incluyeBack ? [
      '📁 BACKEND   (carpeta: backend/src/)',
      '   → Sube el contenido a:  src/',
      '   → Reemplaza solo los archivos que trae el ZIP.',
      '   → Después de subir: haz RESTART en el panel Node.js.',
      '',
    ].join('\n') : '',
    `Generado: ${new Date().toLocaleString('es-ES')}`,
  ].join('\n');

  zip.addFile('INSTRUCCIONES.txt', Buffer.from(instrucciones, 'utf-8'));

  // ── Escribir ZIP ──────────────────────────────────────────────
  const zipPath = path.join(PATHS.output, ZIP_NAME);
  zip.writeZip(zipPath);

  const kb = Math.round(fs.statSync(zipPath).size / 1024);

  sep();
  console.log(`\n${C.bold}${C.green}  ✓ Paquete generado (${kb} KB)${C.reset}`);
  console.log(`  ${C.bold}${path.join(PATHS.output, ZIP_NAME)}${C.reset}\n`);
  console.log(`  Contenido del ZIP:`);
  if (incluyeFront) console.log(`  ${C.cyan}frontend/${C.reset}   → subir a  ${C.bold}public/dist/${C.reset}  (reemplazar TODO)`);
  if (incluyeBack)  console.log(`  ${C.cyan}backend/${C.reset}    → subir a  ${C.bold}src/${C.reset}           (reemplazar archivos)`);
  console.log('');
}

main();
