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
       ON DUPLICATE KEY UPDATE carrera_id = VALUES(carrera_id), docente_id = NULL, estudiante_id = NULL`,
      [req.user.id, carrera.id]
    );
    res.json({ message: 'Carrera seleccionada', carrera });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarPersonasAuditoria = (type) => async (req, res) => {
  try {
    const career = await getCareerForManager(req.user.id);
    if (!career) return res.status(404).json({ error: 'No hay carrera activa' });
    const isTeacher = type === 'docente';
    const table = isTeacher ? 'docentes' : 'estudiantes';
    const idColumn = isTeacher ? 'docente_id' : 'estudiante_id';
    const condition = isTeacher
      ? 'EXISTS (SELECT 1 FROM materias m WHERE m.docente_id = p.id AND m.carrera_id = ?)'
      : 'p.carrera_id = ?';
    const [personas] = await pool.query(
      `SELECT p.id, p.usuario_id, u.nombre, u.apellido, u.email, u.ci, u.telefono,
              ${isTeacher ? "p.especialidad, (SELECT COUNT(*) FROM materias m WHERE m.docente_id = p.id AND m.carrera_id = ?) as total_materias" : "p.codigo_estudiante, p.semestre"}
       FROM ${table} p JOIN usuarios u ON u.id = p.usuario_id
       WHERE u.activo = 1 AND ${condition} ORDER BY u.apellido, u.nombre`,
      isTeacher ? [career.id, career.id] : [career.id]
    );
    const [[selection]] = await pool.query(`SELECT ${idColumn} as active_id FROM auditor_career_selections WHERE usuario_id = ?`, [req.user.id]);
    res.json({ personas, active_id: selection?.active_id || null, carrera: career });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const seleccionarPersonaAuditoria = (type) => async (req, res) => {
  try {
    const career = await getCareerForManager(req.user.id);
    const isTeacher = type === 'docente';
    const table = isTeacher ? 'docentes' : 'estudiantes';
    const idColumn = isTeacher ? 'docente_id' : 'estudiante_id';
    const personId = Number(req.body[`${type}_id`]);
    const condition = isTeacher
      ? 'EXISTS (SELECT 1 FROM materias m WHERE m.docente_id = p.id AND m.carrera_id = ?)'
      : 'p.carrera_id = ?';
    const [[person]] = await pool.query(`SELECT p.id FROM ${table} p WHERE p.id = ? AND ${condition}`, [personId, career.id]);
    if (!person) return res.status(404).json({ error: `${type} no disponible en la carrera activa` });
    await pool.query(`UPDATE auditor_career_selections SET ${idColumn} = ? WHERE usuario_id = ?`, [person.id, req.user.id]);
    res.json({ message: `${type} seleccionado`, id: person.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
