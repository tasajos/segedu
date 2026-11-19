// Verificador del contrato de API.
// Lee las rutas reales de Express y las llamadas del frontend (api.get('/...'), etc.)
// y avisa cuando la UI llama a un endpoint que el backend no tiene.
import fs from 'node:fs';
import path from 'node:path';

const METODOS = ['get', 'post', 'put', 'patch', 'delete'];

const listarArchivos = (dir, exts) => {
  const salida = [];
  if (!fs.existsSync(dir)) return salida;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...listarArchivos(p, exts));
    else if (exts.includes(path.extname(e.name))) salida.push(p);
  }
  return salida;
};

const unirRuta = (...partes) => {
  const r = ('/' + partes.join('/')).replace(/\/+/g, '/').replace(/\/$/, '');
  return r || '/';
};

const lineaDe = (texto, indice) => texto.slice(0, indice).split('\n').length;

// ---------- Backend ----------

export function rutasBackend(proyectoDir, p) {
  const entrada = path.join(proyectoDir, p.backendEntrada);
  const fuente = fs.readFileSync(entrada, 'utf8');
  const baseEntrada = path.dirname(entrada);

  const importes = new Map();
  for (const m of fuente.matchAll(/import\s+(\w+)\s+from\s+['"](\.[^'"]+)['"]/g)) importes.set(m[1], m[2]);
  for (const m of fuente.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) importes.set(m[1], m[2]);

  const montajes = [];
  for (const m of fuente.matchAll(/\bapp\.use\(\s*['"`]([^'"`]+)['"`]\s*,([^)]*)\)/g)) {
    const ids = m[2].match(/\b[A-Za-z_$][\w$]*\b/g) || [];
    const ultimo = ids[ids.length - 1];
    if (!ultimo || !importes.has(ultimo)) continue;
    let archivo = path.resolve(baseEntrada, importes.get(ultimo));
    if (!path.extname(archivo)) archivo += '.js';
    montajes.push({ prefijo: m[1], archivo });
  }

  const rutas = [];
  // Rutas definidas directamente en la app: app.get('/api/x', ...)
  for (const m of fuente.matchAll(/\bapp\.(get|post|put|patch|delete|all)\(\s*['"`](\/[^'"`*]*)['"`]/g)) {
    rutas.push({ metodo: m[1].toUpperCase(), ruta: unirRuta(m[2]), archivo: path.relative(proyectoDir, entrada), linea: lineaDe(fuente, m.index) });
  }
  for (const { prefijo, archivo } of montajes) {
    if (!fs.existsSync(archivo)) continue;
    const src = fs.readFileSync(archivo, 'utf8');
    const routers = new Set(['router']);
    for (const m of src.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:express\.)?Router\(/g)) routers.add(m[1]);
    const re = /\b([A-Za-z_$][\w$]*)\.(get|post|put|patch|delete|all)\(\s*['"`](\/[^'"`]*)['"`]/g;
    for (const m of src.matchAll(re)) {
      if (!routers.has(m[1])) continue;
      rutas.push({
        metodo: m[2].toUpperCase(),
        ruta: unirRuta(prefijo, m[3]),
        archivo: path.relative(proyectoDir, archivo),
        linea: lineaDe(src, m.index)
      });
    }
  }
  return rutas;
}

// ---------- Frontend ----------

// Lee un literal de cadena ('...', "..." o `...${...}...`) que empieza en `i`.
function leerLiteral(src, i) {
  const q = src[i];
  if (q === "'" || q === '"') {
    let j = i + 1;
    while (j < src.length && src[j] !== q) { if (src[j] === '\\') j++; j++; }
    return { texto: src.slice(i + 1, j), plantilla: false };
  }
  if (q === '`') {
    let j = i + 1, out = '';
    while (j < src.length && src[j] !== '`') {
      if (src[j] === '\\') { out += src[j + 1]; j += 2; continue; }
      if (src[j] === '$' && src[j + 1] === '{') {
        let prof = 1; j += 2;
        while (j < src.length && prof > 0) {
          if (src[j] === '{') prof++;
          else if (src[j] === '}') prof--;
          j++;
        }
        out += '\u0000'; // marcador de expresión
        continue;
      }
      out += src[j++];
    }
    return { texto: out, plantilla: true };
  }
  return null;
}

export function llamadasFrontend(proyectoDir, p, soloArchivos = null) {
  const dir = path.join(proyectoDir, p.frontend, 'src');
  let archivos = listarArchivos(dir, ['.js', '.jsx', '.ts', '.tsx']);
  if (soloArchivos) {
    const set = new Set(soloArchivos.map((a) => path.resolve(a).toLowerCase()));
    archivos = archivos.filter((a) => set.has(path.resolve(a).toLowerCase()));
  }
  const clientes = (p.clientesApi || ['api']).map((c) => c.replace(/[$.]/g, '\\$&')).join('|');
  const re = new RegExp(`\\b(?:${clientes})\\.(${METODOS.join('|')})\\s*\\(\\s*`, 'g');

  // Clientes con otra baseURL: { "src/plataforma/api.js": "/api/plataforma" } (rutas relativas al frontend).
  const bases = Object.entries(p.clientesBase || {}).map(([rel, base]) => [path.resolve(proyectoDir, p.frontend, rel).toLowerCase(), base]);
  const baseDelArchivo = (archivo, src) => {
    for (const m of src.matchAll(/import\s+(\w+)\s+from\s+['"](\.[^'"]+)['"]/g)) {
      if (!(p.clientesApi || ['api']).includes(m[1])) continue;
      const destino = path.resolve(path.dirname(archivo), m[2]).toLowerCase();
      const hit = bases.find(([abs]) => abs === destino || abs.replace(/\.(m?js|jsx|ts|tsx)$/, '') === destino);
      if (hit) return hit[1];
    }
    const propio = bases.find(([abs]) => abs === path.resolve(archivo).toLowerCase());
    return propio ? propio[1] : (p.apiBase || '');
  };

  const llamadas = [];
  for (const archivo of archivos) {
    const src = fs.readFileSync(archivo, 'utf8');
    const baseApi = baseDelArchivo(archivo, src);
    for (const m of src.matchAll(re)) {
      const inicio = m.index + m[0].length;
      const lit = leerLiteral(src, inicio);
      const base = {
        metodo: m[1].toUpperCase(),
        archivo: path.relative(proyectoDir, archivo),
        linea: lineaDe(src, m.index)
      };
      if (!lit) { llamadas.push({ ...base, ruta: null, crudo: src.slice(inicio, inicio + 40).split('\n')[0] }); continue; }
      let ruta = lit.texto.split('?')[0];
      if (/^https?:/.test(ruta)) continue; // URL externa
      if (!ruta.startsWith('/') && !ruta.startsWith('\u0000')) ruta = '/' + ruta;
      llamadas.push({ ...base, ruta: unirRuta(baseApi, ruta), crudo: lit.texto.replace(/\u0000/g, '${…}') });
    }
  }
  return llamadas;
}

// ---------- Comparación ----------

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Compara segmento a segmento. En el front, \u0000 marca una expresión ${…};
// en el backend, ':param' acepta cualquier valor.
function coincide(rutaFront, rutaBack) {
  const a = rutaFront.split('/').filter(Boolean);
  const b = rutaBack.split('/').filter(Boolean);
  if (a.length !== b.length) return false;
  return a.every((seg, i) => {
    if (b[i].startsWith(':')) return true;
    if (!seg.includes('\u0000')) return seg === b[i];
    // Una expresión pegada a texto puede venir vacía o traer el query string: materias${params}.
    return new RegExp('^' + seg.split('\u0000').map(escapar).join('[^/]*') + '$').test(b[i]);
  });
}

export function endpointsDelContrato(textoContrato) {
  const salida = [];
  const bloques = [...textoContrato.matchAll(/```endpoints\s*\n([\s\S]*?)```/g)].map((m) => m[1]);
  for (const bloque of bloques) {
    for (const linea of bloque.split('\n')) {
      const m = linea.match(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+(\/\S+)/i);
      if (m) salida.push({ metodo: m[1].toUpperCase(), ruta: m[2].split('?')[0] });
    }
  }
  return salida;
}

const mismoPatron = (x, y) => {
  const n = (r) => r.split('/').filter(Boolean).map((s) => (s.startsWith(':') || s.startsWith('{') ? ':p' : s)).join('/');
  return n(x) === n(y);
};

export function verificar({ proyectoDir, proyecto, contrato = null, soloArchivos = null }) {
  const rutas = rutasBackend(proyectoDir, proyecto);
  const llamadas = llamadasFrontend(proyectoDir, proyecto, soloArchivos);
  const errores = [], avisos = [];

  for (const c of llamadas) {
    if (!c.ruta) { avisos.push(`No verificable (URL en variable): ${c.metodo} ${c.crudo} — ${c.archivo}:${c.linea}`); continue; }
    const ok = rutas.some((r) => (r.metodo === c.metodo || r.metodo === 'ALL') && coincide(c.ruta, r.ruta));
    if (!ok) errores.push(`La UI llama a un endpoint que no existe: ${c.metodo} ${c.ruta.replace(/\u0000/g, '${…}')} — ${c.archivo}:${c.linea}`);
  }

  const delContrato = contrato ? endpointsDelContrato(contrato) : [];
  for (const e of delContrato) {
    const ok = rutas.some((r) => r.metodo === e.metodo && mismoPatron(r.ruta, e.ruta));
    if (!ok) errores.push(`Endpoint del contrato sin implementar en el backend: ${e.metodo} ${e.ruta}`);
  }

  return { rutas, llamadas, delContrato, errores, avisos };
}
