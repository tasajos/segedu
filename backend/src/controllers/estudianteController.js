import pool from '../config/db.js';

// ============ CURSOS DE CAPACITACIÓN ============
export const listarCursos = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const [rows] = await pool.query(
      'SELECT * FROM cursos_capacitacion WHERE estudiante_id = ? ORDER BY created_at DESC',
      [estudianteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearCurso = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { nombre_curso, institucion, fecha_inicio, fecha_fin, horas, descripcion } = req.body;
    const certificado_url = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await pool.query(
      `INSERT INTO cursos_capacitacion (estudiante_id, nombre_curso, institucion, fecha_inicio, fecha_fin, horas, descripcion, certificado_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [estudianteId, nombre_curso, institucion, fecha_inicio, fecha_fin, horas, descripcion, certificado_url]
    );
    res.status(201).json({ id: result.insertId, message: 'Curso registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cursos_capacitacion WHERE id = ? AND estudiante_id = ?', [id, req.user.estudiante_id]);
    res.json({ message: 'Curso eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ INFORMACIÓN PERSONAL ============
export const actualizarInfoPersonal = async (req, res) => {
  try {
    const { ci, telefono, nombre, apellido } = req.body;
    await pool.query(
      'UPDATE usuarios SET ci = ?, telefono = ?, nombre = ?, apellido = ? WHERE id = ?',
      [ci, telefono, nombre, apellido, req.user.id]
    );
    res.json({ message: 'Información actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ ASISTENCIAS ============
export const listarMateriasEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const [rows] = await pool.query(
      `SELECT m.*, u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM inscripciones i
       JOIN materias m ON i.materia_id = m.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE i.estudiante_id = ?`,
      [estudianteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarAsistenciasEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { materia_id } = req.query;
    let query = `SELECT a.*, m.nombre as materia_nombre FROM asistencias a
                 JOIN materias m ON a.materia_id = m.id
                 WHERE a.estudiante_id = ?`;
    const params = [estudianteId];
    if (materia_id) {
      query += ' AND a.materia_id = ?';
      params.push(materia_id);
    }
    query += ' ORDER BY a.fecha DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const registrarAsistencia = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { materia_id, fecha, estado, justificacion } = req.body;
    const [result] = await pool.query(
      `INSERT INTO asistencias (estudiante_id, materia_id, fecha, estado, justificacion)
       VALUES (?, ?, ?, ?, ?)`,
      [estudianteId, materia_id, fecha, estado, justificacion]
    );
    res.status(201).json({ id: result.insertId, message: 'Asistencia registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resumenAsistencias = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const [rows] = await pool.query(
      `SELECT m.id, m.nombre,
        COUNT(CASE WHEN a.estado = 'presente' THEN 1 END) as presentes,
        COUNT(CASE WHEN a.estado = 'falta' THEN 1 END) as faltas,
        COUNT(CASE WHEN a.estado = 'permiso' THEN 1 END) as permisos,
        COUNT(CASE WHEN a.estado = 'tarde' THEN 1 END) as tardes,
        COUNT(a.id) as total
       FROM inscripciones i
       JOIN materias m ON i.materia_id = m.id
       LEFT JOIN asistencias a ON a.materia_id = m.id AND a.estudiante_id = i.estudiante_id
       WHERE i.estudiante_id = ?
       GROUP BY m.id, m.nombre`,
      [estudianteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
