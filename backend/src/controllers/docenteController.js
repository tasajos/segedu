import pool from '../config/db.js';

// ============ MATERIAS DEL DOCENTE ============
export const listarMateriasDocente = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const [rows] = await pool.query(
      `SELECT m.*, c.nombre as carrera_nombre,
        (SELECT COUNT(*) FROM inscripciones WHERE materia_id = m.id) as total_estudiantes
       FROM materias m
       LEFT JOIN carreras c ON m.carrera_id = c.id
       WHERE m.docente_id = ?`,
      [docenteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarEstudiantesPorMateria = async (req, res) => {
  try {
    const { materia_id } = req.params;
    const [rows] = await pool.query(
      `SELECT e.id, u.nombre, u.apellido, u.email, e.codigo_estudiante, e.semestre
       FROM inscripciones i
       JOIN estudiantes e ON i.estudiante_id = e.id
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE i.materia_id = ?`,
      [materia_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ PGO ============
export const listarPGO = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const [rows] = await pool.query(
      `SELECT p.*, m.nombre as materia_nombre, m.codigo as materia_codigo
       FROM pgo p
       JOIN materias m ON p.materia_id = m.id
       WHERE p.docente_id = ?
       ORDER BY p.fecha_envio DESC`,
      [docenteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearPGO = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { materia_id, titulo, descripcion, periodo } = req.body;
    const archivo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await pool.query(
      `INSERT INTO pgo (materia_id, docente_id, titulo, descripcion, periodo, archivo_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [materia_id, docenteId, titulo, descripcion, periodo, archivo_url]
    );
    res.status(201).json({ id: result.insertId, message: 'PGO enviado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ AVANCE DE MATERIA ============
export const listarAvance = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { materia_id } = req.query;
    let query = `SELECT av.*, m.nombre as materia_nombre,
                   u.nombre as validador_nombre, u.apellido as validador_apellido
                 FROM avance_materia av
                 JOIN materias m ON av.materia_id = m.id
                 LEFT JOIN usuarios u ON av.validado_por = u.id
                 WHERE av.docente_id = ?`;
    const params = [docenteId];
    if (materia_id) {
      query += ' AND av.materia_id = ?';
      params.push(materia_id);
    }
    query += ' ORDER BY av.fecha DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearAvance = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { materia_id, tema, descripcion, porcentaje_avance, fecha } = req.body;
    const [result] = await pool.query(
      `INSERT INTO avance_materia (materia_id, docente_id, tema, descripcion, porcentaje_avance, fecha)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [materia_id, docenteId, tema, descripcion, porcentaje_avance, fecha]
    );
    res.status(201).json({ id: result.insertId, message: 'Avance registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ COMENTARIOS ============
export const listarComentarios = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const [rows] = await pool.query(
      `SELECT c.*, u.nombre as estudiante_nombre, u.apellido as estudiante_apellido,
              m.nombre as materia_nombre
       FROM comentarios_estudiantes c
       JOIN estudiantes e ON c.estudiante_id = e.id
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN materias m ON c.materia_id = m.id
       WHERE c.docente_id = ?
       ORDER BY c.created_at DESC`,
      [docenteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearComentario = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { estudiante_id, materia_id, tipo, comentario } = req.body;
    const [result] = await pool.query(
      `INSERT INTO comentarios_estudiantes (estudiante_id, docente_id, materia_id, tipo, comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [estudiante_id, docenteId, materia_id, tipo, comentario]
    );
    res.status(201).json({ id: result.insertId, message: 'Comentario registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
