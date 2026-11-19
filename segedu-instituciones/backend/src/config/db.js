import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { institucionActual } from '../tenancy/contexto.js';
import { descifrar } from '../tenancy/cifrado.js';

dotenv.config();

const base = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  queueLimit: 0,
  dateStrings: true
};

// Base de la instalación por defecto (la que atiende el dominio principal).
export const poolPorDefecto = mysql.createPool({
  ...base,
  database: process.env.DB_NAME || 'uni_tracking',
  connectionLimit: 10
});

// Un pool pequeño por institución, creado al primer uso. En hosting compartido el
// límite de conexiones por usuario es bajo: por eso pocas conexiones y cierre por inactividad.
const pools = new Map();
const limite = Number(process.env.INSTITUCION_POOL_LIMITE) || 3;

export const poolDeInstitucion = (inst) => {
  if (!inst) return poolPorDefecto;
  const existente = pools.get(inst.subdominio);
  if (existente && existente.db === inst.db_nombre) return existente.pool;
  if (existente) existente.pool.end().catch(() => {});
  const pool = mysql.createPool({
    ...base,
    user: inst.db_usuario || base.user,
    password: inst.db_password_cifrada ? descifrar(inst.db_password_cifrada) : base.password,
    database: inst.db_nombre,
    connectionLimit: limite,
    maxIdle: 1,
    idleTimeout: 60_000
  });
  pools.set(inst.subdominio, { pool, db: inst.db_nombre });
  return pool;
};

export const cerrarPoolDeInstitucion = async (subdominio) => {
  const p = pools.get(subdominio);
  pools.delete(subdominio);
  if (p) await p.pool.end().catch(() => {});
};

const actual = () => poolDeInstitucion(institucionActual());

// Fachada con la misma interfaz que usaban los controladores (query, execute, getConnection, end).
const pool = {
  query: (...args) => actual().query(...args),
  execute: (...args) => actual().execute(...args),
  getConnection: () => actual().getConnection(),
  escape: (v) => poolPorDefecto.escape(v),
  format: (sql, values) => poolPorDefecto.format(sql, values),
  end: async () => {
    await Promise.all([...pools.values()].map((p) => p.pool.end().catch(() => {})));
    pools.clear();
    await poolPorDefecto.end();
  }
};

export default pool;
