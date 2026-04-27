import pool from '../config/db.js';

let schemaEnsured = false;

export const ensureStudentPermissionSchema = async () => {
  if (schemaEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_permission_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      estudiante_id INT NOT NULL,
      materia_id INT NOT NULL,
      tipo ENUM('carta_permiso', 'justificacion') NOT NULL DEFAULT 'justificacion',
      fecha_desde DATE NOT NULL,
      fecha_hasta DATE NOT NULL,
      horas_detalle VARCHAR(255) NULL,
      detalle TEXT NULL,
      documento_url VARCHAR(500) NULL,
      registrado_por INT NOT NULL,
      estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
      observacion_jefe TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
      FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
      FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

  // Add columns if the table pre-existed without them (MySQL 8 compatible)
  for (const alter of [
    `ALTER TABLE student_permission_requests ADD COLUMN estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente'`,
    `ALTER TABLE student_permission_requests ADD COLUMN observacion_jefe TEXT NULL`
  ]) {
    try { await pool.query(alter); } catch { /* column already exists */ }
  }

  schemaEnsured = true;
};
