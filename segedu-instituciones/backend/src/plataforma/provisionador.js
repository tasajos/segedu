// Alta de una institución: base de datos, usuario MySQL, subdominio, esquema y administrador.
// Cada paso queda registrado en plataforma_instituciones.paso, para poder reintentar desde donde falló.
//
// PROVISION_MODO=cpanel → usa la UAPI de cPanel (producción).
// PROVISION_MODO=local  → CREATE DATABASE con el usuario del .env (desarrollo); el subdominio es *.localhost.
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { plataformaPool, registrarEvento } from './db.js';
import { uapi, restriccionesMysql, idempotente } from './cpanel.js';
import { cifrar, descifrar, contrasenaAleatoria } from '../tenancy/cifrado.js';
import { invalidarCacheInstitucion, baseDominio } from '../tenancy/resolver.js';
import { cerrarPoolDeInstitucion } from '../config/db.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const modoProvision = () => (process.env.PROVISION_MODO || 'local').toLowerCase();

export const PASOS = ['base', 'usuario', 'esquema', 'datos', 'subdominio', 'listo'];

const COLORES_CHAKUY = { color_primario: '#1E73BE', color_acento: '#FFD60A' };

const rutaEsquema = () => {
  const candidatos = [
    process.env.ESQUEMA_SQL,
    path.resolve(AQUI, '..', '..', '..', 'database', 'schema.sql'),
    path.resolve(AQUI, '..', '..', 'database', 'schema.sql'),
    path.resolve(process.cwd(), 'database', 'schema.sql')
  ].filter(Boolean);
  const r = candidatos.find((c) => fs.existsSync(c));
  if (!r) throw new Error('No encontré database/schema.sql. Defina ESQUEMA_SQL en el .env con su ruta.');
  return r;
};

const conexionMysql = (extra = {}) => mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ...extra
});

const conexionInstitucion = (inst) => conexionMysql({
  user: inst.db_usuario || process.env.DB_USER || 'root',
  password: inst.db_password_cifrada ? descifrar(inst.db_password_cifrada) : (process.env.DB_PASSWORD || ''),
  database: inst.db_nombre,
  multipleStatements: true
});

const actualizar = (id, campos) => plataformaPool().query('UPDATE plataforma_instituciones SET ? WHERE id = ?', [campos, id]);
const leer = async (id) => (await plataformaPool().query('SELECT * FROM plataforma_instituciones WHERE id = ?', [id]))[0][0];

// Nombre corto y único: con prefijo de cPanel. Si no cabe, usa el id.
const nombreRecurso = (prefijo, subdominio, id, largo) => {
  const legible = `${prefijo}${subdominio.replace(/-/g, '_')}`;
  const nombre = legible.length <= largo ? legible : `${prefijo}i${id}`;
  // Se usa dentro de SQL (CREATE DATABASE `...`): solo letras, números y guion bajo.
  if (!/^[A-Za-z0-9_]+$/.test(nombre)) throw new Error(`Nombre de base inválido «${nombre}». Revise LOCAL_DB_PREFIJO / el prefijo de cPanel.`);
  return nombre;
};

// ---------- pasos ----------

async function pasoBase(inst) {
  if (modoProvision() === 'cpanel') {
    const r = await restriccionesMysql();
    const db = nombreRecurso(r.prefijo, inst.subdominio, inst.id, r.largoBase);
    await idempotente(() => uapi('Mysql', 'create_database', { name: db }));
    await actualizar(inst.id, { db_nombre: db });
    return;
  }
  const prefijo = process.env.LOCAL_DB_PREFIJO || 'segedu_inst_';
  const db = nombreRecurso(prefijo, inst.subdominio, inst.id, 64);
  const c = await conexionMysql();
  try {
    await c.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally { await c.end(); }
  await actualizar(inst.id, { db_nombre: db });
}

async function pasoUsuario(inst) {
  if (modoProvision() !== 'cpanel') return; // en local se usa el usuario del .env
  const r = await restriccionesMysql();
  const usuario = nombreRecurso(r.prefijo, inst.subdominio, inst.id, r.largoUsuario);
  const password = inst.db_password_cifrada ? descifrar(inst.db_password_cifrada) : contrasenaAleatoria(24);
  await idempotente(() => uapi('Mysql', 'create_user', { name: usuario, password }));
  // Si el usuario ya existía de un intento anterior, se le fija la contraseña que guardamos.
  await uapi('Mysql', 'set_password', { user: usuario, password });
  await uapi('Mysql', 'set_privileges_on_database', { user: usuario, database: inst.db_nombre, privileges: 'ALL PRIVILEGES' });
  await actualizar(inst.id, { db_usuario: usuario, db_password_cifrada: cifrar(password) });
}

async function pasoEsquema(inst) {
  const sql = fs.readFileSync(rutaEsquema(), 'utf8').replace(/^\/\*M!999999\\- enable the sandbox mode \*\/\s*$/m, '');
  const c = await conexionInstitucion(inst);
  try { await c.query(sql); } finally { await c.end(); }
}

// Ficha de la institución y cuenta del administrador (sin contraseña utilizable todavía).
async function pasoDatos(inst) {
  const c = await conexionInstitucion(inst);
  try {
    const [[ya]] = await c.query('SELECT id FROM institucion ORDER BY id LIMIT 1');
    if (!ya) {
      await c.query('INSERT INTO institucion SET ?', [{ nombre: inst.nombre, sigla: inst.sigla, tipo: inst.tipo, ...COLORES_CHAKUY }]);
    }
    const [[admin]] = await c.query('SELECT id FROM usuarios WHERE email = ?', [inst.admin_email]);
    if (!admin) {
      const bloqueada = await bcrypt.hash(contrasenaAleatoria(32), 10);
      await c.query("INSERT INTO usuarios (nombre, apellido, email, password, rol, activo) VALUES (?,?,?,?, 'admin', 1)",
        [inst.admin_nombre, inst.admin_apellido, inst.admin_email, bloqueada]);
    }
  } finally { await c.end(); }
}

// Fija una contraseña temporal nueva al administrador de la institución.
async function fijarPasswordAdmin(inst, password) {
  const c = await conexionInstitucion(inst);
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await c.query("UPDATE usuarios SET password = ?, rol = 'admin', activo = 1 WHERE email = ?", [hash, inst.admin_email]);
    if (!r.affectedRows) throw new Error(`No existe el administrador ${inst.admin_email} en la base de la institución`);
  } finally { await c.end(); }
}

async function pasoSubdominio(inst) {
  if (modoProvision() !== 'cpanel') return; // en local, *.localhost ya resuelve a 127.0.0.1
  const raiz = process.env.CPANEL_DOMINIO_RAIZ || baseDominio();
  const dir = process.env.CPANEL_DIR_SUBDOMINIOS;
  if (!dir) throw new Error('Falta CPANEL_DIR_SUBDOMINIOS: carpeta (relativa al home de cPanel) a la que apuntan los subdominios');
  await idempotente(() => uapi('SubDomain', 'addsubdomain', { domain: inst.subdominio, rootdomain: raiz, dir }));
}

// ---------- orquestación ----------

/**
 * Ejecuta los pasos pendientes. Devuelve la contraseña temporal del admin (solo se conoce aquí).
 * Si falla, deja estado=error con el paso y el mensaje, y se puede reintentar.
 */
export async function provisionar(id, superadminId = null) {
  let inst = await leer(id);
  if (!inst) throw new Error('Institución no encontrada');
  const passwordAdmin = contrasenaAleatoria(12);
  const desde = Math.max(0, PASOS.indexOf(inst.paso || 'base'));

  await actualizar(id, { estado: 'creando', error: null });
  try {
    for (const paso of PASOS.slice(desde, -1)) {
      await actualizar(id, { paso });
      inst = await leer(id);
      if (paso === 'base') await pasoBase(inst);
      if (paso === 'usuario') await pasoUsuario(inst);
      if (paso === 'esquema') await pasoEsquema(inst);
      if (paso === 'datos') await pasoDatos(inst);
      if (paso === 'subdominio') await pasoSubdominio(inst);
    }
    // Siempre al final: así un reintento también entrega una contraseña que se puede usar.
    inst = await leer(id);
    await fijarPasswordAdmin(inst, passwordAdmin);
    await actualizar(id, { paso: 'listo', estado: 'activa', error: null });
    invalidarCacheInstitucion(inst.subdominio);
    await registrarEvento('institucion.creada', { institucionId: id, superadminId, detalle: { modo: modoProvision(), desde: PASOS[desde] } });
    return { passwordAdmin };
  } catch (err) {
    const [[actual]] = await plataformaPool().query('SELECT paso FROM plataforma_instituciones WHERE id = ?', [id]);
    await actualizar(id, { estado: 'error', error: err.message.slice(0, 2000) });
    invalidarCacheInstitucion(inst.subdominio);
    await registrarEvento('institucion.error', { institucionId: id, superadminId, detalle: { paso: actual?.paso, error: err.message } });
    const e = new Error(`Falló el paso «${actual?.paso}»: ${err.message}`);
    e.paso = actual?.paso;
    throw e;
  }
}

/** Nueva contraseña temporal para el administrador de una institución activa. */
export async function restablecerAdmin(id, superadminId = null) {
  const inst = await leer(id);
  if (!inst) throw new Error('Institución no encontrada');
  if (inst.estado !== 'activa') throw new Error('Solo se puede restablecer el administrador de una institución activa');
  const password = contrasenaAleatoria(12);
  await fijarPasswordAdmin(inst, password);
  await registrarEvento('institucion.admin_restablecido', { institucionId: id, superadminId });
  return { email: inst.admin_email, passwordAdmin: password };
}

export const liberarRecursos = async (subdominio) => {
  invalidarCacheInstitucion(subdominio);
  await cerrarPoolDeInstitucion(subdominio);
};
