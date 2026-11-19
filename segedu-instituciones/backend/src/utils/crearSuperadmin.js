// Crea (o reactiva y cambia la contraseña de) un superadministrador de la plataforma.
//   npm run crear-superadmin -- --email tu@chakuy.com --nombre "Tu Nombre" [--password "..."]
// Si no se pasa --password, se genera una y se muestra una sola vez.
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { asegurarEsquemaPlataforma, plataformaPool } from '../plataforma/db.js';
import { contrasenaAleatoria } from '../tenancy/cifrado.js';

dotenv.config();

const arg = (n) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : null;
};

const email = String(arg('email') || '').trim().toLowerCase();
const nombre = String(arg('nombre') || '').trim();
if (!email || !nombre) {
  console.error('Uso: npm run crear-superadmin -- --email tu@correo.com --nombre "Tu Nombre" [--password "..."]');
  process.exit(1);
}
const password = arg('password') || contrasenaAleatoria(16);
if (password.length < 10) {
  console.error('La contraseña debe tener al menos 10 caracteres.');
  process.exit(1);
}

try {
  await asegurarEsquemaPlataforma();
  const hash = await bcrypt.hash(password, 10);
  await plataformaPool().query(
    `INSERT INTO plataforma_superadmins (nombre, email, password, activo) VALUES (?,?,?,1)
     ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password = VALUES(password), activo = 1`,
    [nombre, email, hash]
  );
  console.log(`Superadministrador listo: ${email}`);
  if (!arg('password')) console.log(`Contraseña generada (guárdela ahora, no se vuelve a mostrar): ${password}`);
} catch (err) {
  console.error('No se pudo crear el superadministrador:', err.message);
  process.exitCode = 1;
} finally {
  await plataformaPool().end();
}
