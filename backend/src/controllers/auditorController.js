import pool from '../config/db.js';
import { ensureAuditorSchema, getCareerForManager } from '../utils/auditorAccess.js';

export const listarCarrerasAuditor = async (req, res) => {
  try {
    await ensureAuditorSchema();
    const [carreras] = await pool.query(
      `SELECT c.id, c.nombre, c.codigo, u.nombre as jefe_nombre, u.apellido as jefe_apellido,
              (SELECT COUNT(*) FROM estudiantes e WHERE e.carrera_id = c.id) as total_estudiantes,
              (SELECT COUNT(*) FROM materias m WHERE m.carrera_id = c.id) as total_materias
       FROM carreras c LEFT JOIN usuarios u ON u.id = c.jefe_id ORDER BY c.nombre`
    );
    const activa = await getCareerForManager(req.user.id);
    res.json({ carreras, carrera_activa_id: activa?.id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const seleccionarCarreraAuditor = async (req, res) => {
  try {
    await ensureAuditorSchema();
    const { carrera_id } = req.body;
    const [[carrera]] = await pool.query('SELECT id, nombre, codigo FROM carreras WHERE id = ?', [carrera_id]);
    if (!carrera) return res.status(404).json({ error: 'Carrera no encontrada' });
    await pool.query(
      `INSERT INTO auditor_career_selections (usuario_id, carrera_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE carrera_id = VALUES(carrera_id)`,
      [req.user.id, carrera.id]
    );
    res.json({ message: 'Carrera seleccionada', carrera });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
