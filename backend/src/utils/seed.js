// Script para generar hash de contraseñas y actualizar seed
// Uso: node src/utils/seed.js
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const password = 'password123';

const run = async () => {
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash generado:', hash);
  console.log('\nActualizando contraseñas de usuarios de prueba...');

  await pool.query('UPDATE usuarios SET password = ? WHERE email IN (?, ?, ?, ?, ?, ?)', [
    hash,
    'jefe@uni.edu',
    'docente@uni.edu',
    'docente2@uni.edu',
    'estudiante@uni.edu',
    'estudiante2@uni.edu',
    'estudiante3@uni.edu'
  ]);

  console.log('✓ Contraseñas actualizadas. Todas las cuentas usan: password123');
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
