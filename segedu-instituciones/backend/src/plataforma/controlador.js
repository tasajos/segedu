import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { plataformaPool, registrarEvento } from './db.js';
import { provisionar, restablecerAdmin, liberarRecursos, modoProvision } from './provisionador.js';
import { SUBDOMINIOS_RESERVADOS, baseDominio, subdominioPlataforma, invalidarCacheInstitucion } from '../tenancy/resolver.js';

const AUDIENCIA = 'plataforma';
const TIPOS = ['universidad', 'instituto', 'colegio'];
const RE_SUB = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const protocolo = () => (process.env.PLATAFORMA_PROTOCOLO || (baseDominio() === 'localhost' ? 'http' : 'https'));
const puertoUrl = () => (process.env.PLATAFORMA_PUERTO_URL ? `:${process.env.PLATAFORMA_PUERTO_URL}` : '');
export const urlDe = (sub) => `${protocolo()}://${sub}.${baseDominio()}${puertoUrl()}`;

// Lo que ve el panel: nunca credenciales de base de datos.
const publica = (f) => ({
  id: f.id,
  subdominio: f.subdominio,
  url: urlDe(f.subdominio),
  nombre: f.nombre,
  sigla: f.sigla,
  tipo: f.tipo,
  estado: f.estado,
  paso: f.paso,
  error: f.error,
  admin: { nombre: f.admin_nombre, apellido: f.admin_apellido, email: f.admin_email },
  created_at: f.created_at,
  updated_at: f.updated_at
});

const leer = async (id) => (await plataformaPool().query('SELECT * FROM plataforma_instituciones WHERE id = ?', [id]))[0][0];

// ---------- contexto (público, en cualquier host) ----------

export const contexto = (req, res) => {
  const c = req.contexto || { tipo: 'institucion', subdominio: null };
  if (c.tipo === 'desconocida') return res.status(404).json({ tipo: 'desconocida', subdominio: c.subdominio, error: 'Institución no encontrada' });
  res.json({
    tipo: c.tipo,
    subdominio: c.subdominio,
    estado: c.estado || (c.tipo === 'institucion' ? 'activa' : null),
    nombre: c.nombre || null
  });
};

// ---------- autenticación del superadmin ----------

const intentos = new Map(); // ip → { n, hasta }
const VENTANA = 15 * 60_000;
const MAX_INTENTOS = 10;

export const login = async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'desconocida';
  const reg = intentos.get(ip);
  if (reg && reg.hasta > Date.now() && reg.n >= MAX_INTENTOS) {
    return res.status(429).json({ error: 'Demasiados intentos. Espere 15 minutos.' });
  }
  const fallo = () => {
    const r = intentos.get(ip);
    intentos.set(ip, r && r.hasta > Date.now() ? { n: r.n + 1, hasta: r.hasta } : { n: 1, hasta: Date.now() + VENTANA });
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  };

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  const [[s]] = await plataformaPool().query('SELECT * FROM plataforma_superadmins WHERE email = ? AND activo = 1', [String(email).trim().toLowerCase()]);
  if (!s || !(await bcrypt.compare(password, s.password))) return fallo();
  intentos.delete(ip);
  const token = jwt.sign({ id: s.id, email: s.email, tipo: 'superadmin' }, process.env.JWT_SECRET, {
    audience: AUDIENCIA, expiresIn: process.env.PLATAFORMA_JWT_EXPIRA || '8h'
  });
  await registrarEvento('superadmin.login', { superadminId: s.id });
  res.json({ token, superadmin: { id: s.id, nombre: s.nombre, email: s.email } });
};

export const verificarSuperadmin = async (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET, { audience: AUDIENCIA });
    if (d.tipo !== 'superadmin') throw new Error('tipo');
    const [[s]] = await plataformaPool().query('SELECT id, nombre, email FROM plataforma_superadmins WHERE id = ? AND activo = 1', [d.id]);
    if (!s) throw new Error('inactivo');
    req.superadmin = s;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const perfil = (req, res) => res.json(req.superadmin);

// ---------- configuración y validación ----------

export const config = (req, res) => res.json({
  baseDominio: baseDominio(),
  ejemploUrl: urlDe('mi-colegio'),
  modo: modoProvision(),
  subdominioPlataforma: subdominioPlataforma()
});

const motivoSubdominioInvalido = async (sub) => {
  if (!sub) return 'Escriba un subdominio';
  if (!RE_SUB.test(sub)) return 'Use de 3 a 30 caracteres: letras minúsculas, números y guiones (sin guion al inicio ni al final)';
  if (sub.includes('--')) return 'No use dos guiones seguidos';
  if (SUBDOMINIOS_RESERVADOS.has(sub) || sub === subdominioPlataforma()) return 'Ese subdominio está reservado';
  const [[ya]] = await plataformaPool().query('SELECT id FROM plataforma_instituciones WHERE subdominio = ?', [sub]);
  if (ya) return 'Ese subdominio ya está en uso';
  return null;
};

export const subdominioDisponible = async (req, res) => {
  const sub = String(req.query.valor || '').trim().toLowerCase();
  const motivo = await motivoSubdominioInvalido(sub);
  res.json({ subdominio: sub, disponible: !motivo, motivo, url: motivo ? null : urlDe(sub) });
};

// ---------- instituciones ----------

export const listar = async (req, res) => {
  const [filas] = await plataformaPool().query('SELECT * FROM plataforma_instituciones ORDER BY created_at DESC, id DESC');
  res.json(filas.map(publica));
};

export const obtener = async (req, res) => {
  const f = await leer(req.params.id);
  if (!f) return res.status(404).json({ error: 'Institución no encontrada' });
  const [eventos] = await plataformaPool().query(
    'SELECT accion, detalle, created_at FROM plataforma_eventos WHERE institucion_id = ? ORDER BY id DESC LIMIT 20', [f.id]);
  res.json({ ...publica(f), eventos });
};

export const crear = async (req, res) => {
  const b = req.body || {};
  const sub = String(b.subdominio || '').trim().toLowerCase();
  const nombre = String(b.nombre || '').trim();
  const tipo = String(b.tipo || 'colegio');
  const admin = b.admin || {};
  const email = String(admin.email || '').trim().toLowerCase();

  const errores = {};
  const motivo = await motivoSubdominioInvalido(sub);
  if (motivo) errores.subdominio = motivo;
  if (nombre.length < 3) errores.nombre = 'Escriba el nombre de la institución';
  if (!TIPOS.includes(tipo)) errores.tipo = 'Tipo inválido';
  if (!String(admin.nombre || '').trim()) errores['admin.nombre'] = 'Escriba el nombre del administrador';
  if (!String(admin.apellido || '').trim()) errores['admin.apellido'] = 'Escriba el apellido del administrador';
  if (!RE_EMAIL.test(email)) errores['admin.email'] = 'Correo inválido';
  if (Object.keys(errores).length) return res.status(400).json({ error: 'Revise los datos del formulario', errores });

  const [r] = await plataformaPool().query('INSERT INTO plataforma_instituciones SET ?', [{
    subdominio: sub, nombre, sigla: String(b.sigla || '').trim() || null, tipo,
    estado: 'creando', paso: 'base',
    admin_nombre: String(admin.nombre).trim(), admin_apellido: String(admin.apellido).trim(), admin_email: email,
    creado_por: req.superadmin.id
  }]);

  try {
    const { passwordAdmin } = await provisionar(r.insertId, req.superadmin.id);
    const f = await leer(r.insertId);
    res.status(201).json({ institucion: publica(f), admin: { email, passwordTemporal: passwordAdmin } });
  } catch (err) {
    const f = await leer(r.insertId);
    res.status(502).json({ error: err.message, paso: err.paso, institucion: publica(f) });
  }
};

export const reintentar = async (req, res) => {
  const f = await leer(req.params.id);
  if (!f) return res.status(404).json({ error: 'Institución no encontrada' });
  if (f.estado !== 'error') return res.status(409).json({ error: 'Solo se reintenta una institución con error' });
  try {
    const { passwordAdmin } = await provisionar(f.id, req.superadmin.id);
    res.json({ institucion: publica(await leer(f.id)), admin: { email: f.admin_email, passwordTemporal: passwordAdmin } });
  } catch (err) {
    res.status(502).json({ error: err.message, paso: err.paso, institucion: publica(await leer(f.id)) });
  }
};

export const actualizarEstado = async (req, res) => {
  const f = await leer(req.params.id);
  if (!f) return res.status(404).json({ error: 'Institución no encontrada' });
  const cambios = {};
  const b = req.body || {};
  if (b.estado !== undefined) {
    if (!['activa', 'suspendida'].includes(b.estado)) return res.status(400).json({ error: 'Estado inválido: use activa o suspendida' });
    if (!['activa', 'suspendida'].includes(f.estado)) return res.status(409).json({ error: 'La institución todavía no terminó de crearse' });
    cambios.estado = b.estado;
  }
  if (b.nombre !== undefined) {
    if (String(b.nombre).trim().length < 3) return res.status(400).json({ error: 'Escriba el nombre de la institución' });
    cambios.nombre = String(b.nombre).trim();
  }
  if (!Object.keys(cambios).length) return res.status(400).json({ error: 'Nada que actualizar' });
  await plataformaPool().query('UPDATE plataforma_instituciones SET ? WHERE id = ?', [cambios, f.id]);
  if (cambios.estado === 'suspendida') await liberarRecursos(f.subdominio);
  else invalidarCacheInstitucion(f.subdominio);
  await registrarEvento(`institucion.${cambios.estado === 'suspendida' ? 'suspendida' : cambios.estado === 'activa' ? 'reactivada' : 'editada'}`,
    { institucionId: f.id, superadminId: req.superadmin.id, detalle: cambios });
  res.json(publica(await leer(f.id)));
};

export const restablecer = async (req, res) => {
  try {
    const r = await restablecerAdmin(Number(req.params.id), req.superadmin.id);
    res.json({ admin: { email: r.email, passwordTemporal: r.passwordAdmin } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
