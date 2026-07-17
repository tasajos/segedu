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
      docente_id INT NULL,
      estudiante_id INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE
    )
  `);
  const [selectionColumns] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditor_career_selections'`
  );
  const selectionSet = new Set(selectionColumns.map((item) => item.COLUMN_NAME));
  if (!selectionSet.has('docente_id')) {
    await pool.query('ALTER TABLE auditor_career_selections ADD COLUMN docente_id INT NULL AFTER carrera_id');
  }
  if (!selectionSet.has('estudiante_id')) {
    await pool.query('ALTER TABLE auditor_career_selections ADD COLUMN estudiante_id INT NULL AFTER docente_id');
  }
  schemaReady = true;
};

export const impersonateAuditorAs = (type) => async (req, res, next) => {
  if (req.user?.rol !== 'auditor') return next();
  try {
    const career = await getCareerForManager(req.user.id);
    if (!career) return res.status(404).json({ error: 'No existen carreras disponibles para auditar' });
    const auditorId = req.user.id;
    const isTeacher = type === 'docente';
    const idColumn = isTeacher ? 'docente_id' : 'estudiante_id';
    const profileTable = isTeacher ? 'docentes' : 'estudiantes';
    const careerCondition = isTeacher
      ? 'EXISTS (SELECT 1 FROM materias m WHERE m.docente_id = p.id AND m.carrera_id = ?)'
      : 'p.carrera_id = ?';

    let [[profile]] = await pool.query(
      `SELECT p.id, p.usuario_id FROM auditor_career_selections acs
       JOIN ${profileTable} p ON p.id = acs.${idColumn}
       WHERE acs.usuario_id = ? AND acs.carrera_id = ? AND ${careerCondition}`,
      [auditorId, career.id, career.id]
    );
    if (!profile) {
      [[profile]] = await pool.query(
        `SELECT p.id, p.usuario_id FROM ${profileTable} p
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE u.activo = 1 AND ${careerCondition}
         ORDER BY u.apellido, u.nombre LIMIT 1`,
        [career.id]
      );
      if (profile) {
        await pool.query(`UPDATE auditor_career_selections SET ${idColumn} = ? WHERE usuario_id = ?`, [profile.id, auditorId]);
      }
    }
    if (!profile) return res.status(404).json({ error: `No hay ${type}s disponibles en esta carrera` });

    req.user = {
      ...req.user,
      auditor_id: auditorId,
      id: profile.usuario_id,
      rol: type,
      ...(isTeacher ? { docente_id: profile.id } : { estudiante_id: profile.id })
    };
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const auditorReadOnly = (req, res, next) => {
  if (req.user?.rol === 'auditor' && !['GET', 'HEAD'].includes(req.method)) {
    return res.status(403).json({ error: 'El auditor tiene acceso de solo lectura' });
  }
  next();
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
