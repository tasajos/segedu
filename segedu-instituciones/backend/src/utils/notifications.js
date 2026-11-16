import pool from '../config/db.js';

let notificationsSchemaEnsured = false;

export const ensureNotificationSchema = async () => {
  if (notificationsSchemaEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      carrera_id INT NOT NULL,
      tipo ENUM('informativa', 'emergencia', 'institucional') NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      mensaje TEXT NOT NULL,
      creado_por INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      notification_id INT NOT NULL,
      docente_id INT NOT NULL,
      reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_notification_review (notification_id, docente_id),
      FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
      FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
    )
  `);

  notificationsSchemaEnsured = true;
};
