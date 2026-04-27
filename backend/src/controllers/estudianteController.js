import pool from '../config/db.js';
import { ensureStudentPermissionSchema } from '../utils/studentPermissions.js';

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

// ============ SOLICITUDES DE PERMISO ============
export const solicitarPermiso = async (req, res) => {
  try {
    await ensureStudentPermissionSchema();
    const estudianteId = req.user.estudiante_id;
    const { materia_id, tipo, fecha_desde, fecha_hasta, horas_detalle, detalle } = req.body;

    if (!materia_id || !tipo || !fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: 'Materia, tipo y rango de fechas son requeridos' });
    }

    const [inscr] = await pool.query(
      'SELECT id FROM inscripciones WHERE estudiante_id = ? AND materia_id = ?',
      [estudianteId, materia_id]
    );
    if (!inscr.length) return res.status(403).json({ error: 'No estás inscrito en esta materia' });

    const documentoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (tipo === 'carta_permiso' && !documentoUrl) {
      return res.status(400).json({ error: 'Debe adjuntar la carta de permiso en formato Word (.docx)' });
    }
    if (tipo === 'justificacion' && !String(detalle || '').trim()) {
      return res.status(400).json({ error: 'Debe escribir la justificación' });
    }

    const [result] = await pool.query(
      `INSERT INTO student_permission_requests
       (estudiante_id, materia_id, tipo, fecha_desde, fecha_hasta, horas_detalle, detalle, documento_url, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [estudianteId, materia_id, tipo, fecha_desde, fecha_hasta, horas_detalle || null, detalle || null, documentoUrl, req.user.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Solicitud enviada al jefe de carrera' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarMisPermisos = async (req, res) => {
  try {
    await ensureStudentPermissionSchema();
    const estudianteId = req.user.estudiante_id;
    const [rows] = await pool.query(
      `SELECT spr.*, m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo
       FROM student_permission_requests spr
       JOIN materias m ON spr.materia_id = m.id
       WHERE spr.estudiante_id = ?
       ORDER BY spr.created_at DESC`,
      [estudianteId]
    );
    res.json(rows);
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

// ============ EXPEDIENTE COMPLETO (asistencias + disciplina + observaciones) ============
export const miExpediente = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;

    const [asistencias] = await pool.query(
      `SELECT a.*, m.nombre as materia_nombre
       FROM asistencias a
       JOIN materias m ON a.materia_id = m.id
       WHERE a.estudiante_id = ?
       ORDER BY a.fecha DESC`,
      [estudianteId]
    );

    const [disciplina] = await pool.query(
      `SELECT de.*, m.nombre as materia_nombre,
              u.nombre as registrado_nombre, u.apellido as registrado_apellido, u.rol as registrado_rol
       FROM disciplina_estudiantes de
       LEFT JOIN materias m ON de.materia_id = m.id
       JOIN usuarios u ON de.registrado_por = u.id
       WHERE de.estudiante_id = ?
       ORDER BY de.fecha DESC`,
      [estudianteId]
    );

    const [comentarios] = await pool.query(
      `SELECT c.*, m.nombre as materia_nombre,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM comentarios_estudiantes c
       JOIN docentes d ON c.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       LEFT JOIN materias m ON c.materia_id = m.id
       WHERE c.estudiante_id = ?
       ORDER BY c.created_at DESC`,
      [estudianteId]
    );

    res.json({ asistencias, disciplina, comentarios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
