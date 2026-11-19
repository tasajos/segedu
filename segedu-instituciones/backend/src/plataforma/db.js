// Base de la plataforma: registro de instituciones (subdominio → base de datos) y superadministradores.
import mysql from 'mysql2/promise';

export const nombreBasePlataforma = () => process.env.PLATAFORMA_DB_NAME || 'segedu_plataforma';

let poolPlataforma = null;
export const plataformaPool = () => {
  if (!poolPlataforma) {
    poolPlataforma = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.PLATAFORMA_DB_USER || process.env.DB_USER || 'root',
      password: process.env.PLATAFORMA_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '',
      database: nombreBasePlataforma(),
      waitForConnections: true,
      connectionLimit: 3,
      dateStrings: true
    });
  }
  return poolPlataforma;
};

const TABLAS = [
  `CREATE TABLE IF NOT EXISTS plataforma_superadmins (
     id INT AUTO_INCREMENT PRIMARY KEY,
     nombre VARCHAR(150) NOT NULL,
     email VARCHAR(150) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     activo TINYINT(1) NOT NULL DEFAULT 1,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS plataforma_instituciones (
     id INT AUTO_INCREMENT PRIMARY KEY,
     subdominio VARCHAR(40) NOT NULL UNIQUE,
     nombre VARCHAR(200) NOT NULL,
     sigla VARCHAR(30) NULL,
     tipo ENUM('universidad','instituto','colegio') NOT NULL DEFAULT 'colegio',
     estado ENUM('creando','activa','suspendida','error') NOT NULL DEFAULT 'creando',
     paso VARCHAR(40) NULL,
     error TEXT NULL,
     db_nombre VARCHAR(64) NULL,
     db_usuario VARCHAR(64) NULL,
     db_password_cifrada VARCHAR(255) NULL,
     admin_nombre VARCHAR(100) NOT NULL,
     admin_apellido VARCHAR(100) NOT NULL,
     admin_email VARCHAR(150) NOT NULL,
     creado_por INT NULL,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS plataforma_eventos (
     id INT AUTO_INCREMENT PRIMARY KEY,
     institucion_id INT NULL,
     superadmin_id INT NULL,
     accion VARCHAR(60) NOT NULL,
     detalle TEXT NULL,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     KEY (institucion_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

/**
 * Crea las tablas de la plataforma. En modo local también crea la base si falta;
 * en cPanel la base debe existir (se crea una sola vez desde el panel de cPanel).
 */
export const asegurarEsquemaPlataforma = async () => {
  if ((process.env.PROVISION_MODO || 'local') === 'local') {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    await c.query(`CREATE DATABASE IF NOT EXISTS \`${nombreBasePlataforma()}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await c.end();
  }
  for (const sql of TABLAS) await plataformaPool().query(sql);
};

export const registrarEvento = (accion, { institucionId = null, superadminId = null, detalle = null } = {}) =>
  plataformaPool()
    .query('INSERT INTO plataforma_eventos (institucion_id, superadmin_id, accion, detalle) VALUES (?,?,?,?)',
      [institucionId, superadminId, accion, detalle ? JSON.stringify(detalle) : null])
    .catch((e) => console.error('No se pudo registrar el evento de plataforma:', e.message));
