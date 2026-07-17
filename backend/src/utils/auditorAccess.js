import pool from '../config/db.js';

let schemaReady = false;

export const ensureAuditorSchema = async () => {
  if (schemaReady) return;
  const [[column]] = await pool.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'rol'`
  );
  if (column && !String(column.COLUMN_TYPE).includes("'auditor'")) {
    await pool.query("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('admin','jefe','docente','estudiante','instructor','auditor') NOT NULL");
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auditor_career_selections (
      usuario_id INT PRIMARY KEY,
      carrera_id INT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE
    )
  `);
  schemaReady = true;
};

export const getCareerForManager = async (userId) => {
  await ensureAuditorSchema();
  const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
  if (user?.rol !== 'auditor') {
    const [[career]] = await pool.query('SELECT * FROM carreras WHERE jefe_id = ?', [userId]);
    return career || null;
  }

  let [[career]] = await pool.query(
    `SELECT c.* FROM auditor_career_selections acs
     JOIN carreras c ON c.id = acs.carrera_id WHERE acs.usuario_id = ?`,
    [userId]
  );
  if (!career) {
    [[career]] = await pool.query('SELECT * FROM carreras ORDER BY nombre LIMIT 1');
    if (career) {
      await pool.query(
        `INSERT INTO auditor_career_selections (usuario_id, carrera_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE carrera_id = VALUES(carrera_id)`,
        [userId, career.id]
      );
    }
  }
  return career || null;
};
