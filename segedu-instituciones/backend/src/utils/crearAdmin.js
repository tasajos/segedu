/**
 * Crea (o restablece) el usuario administrador de una instalación nueva.
 * Uso: npm run crear-admin -- --email=admin@miinstituto.edu.bo --password=ClaveSegura123
 */
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const { email, password, nombre = 'Administrador', apellido = 'General' } = args;

if (!email || !password || password.length < 8) {
  console.error('Indique --email y --password (mínimo 8 caracteres).');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const [[existe]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
if (existe) {
  await pool.query("UPDATE usuarios SET password = ?, rol = 'admin', activo = 1 WHERE id = ?", [hash, existe.id]);
  console.log(`Contraseña restablecida para ${email}.`);
} else {
  await pool.query("INSERT INTO usuarios (nombre, apellido, email, password, rol, activo) VALUES (?,?,?,?,'admin',1)", [nombre, apellido, email, hash]);
  console.log(`Administrador creado: ${email}.`);
}
const [[inst]] = await pool.query('SELECT id FROM institucion LIMIT 1');
if (!inst) await pool.query("INSERT INTO institucion (nombre, sigla, tipo) VALUES ('Mi Institución', 'SEGEDU', 'instituto')");
await pool.end();
