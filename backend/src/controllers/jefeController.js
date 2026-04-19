import pool from '../config/db.js';

// ============ PGO – revisar ============
export const listarTodosPGO = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, m.nombre as materia_nombre, m.codigo as materia_codigo,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM pgo p
       JOIN materias m ON p.materia_id = m.id
       JOIN docentes d ON p.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       ORDER BY p.fecha_envio DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const revisarPGO = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    await pool.query(
      'UPDATE pgo SET estado = ?, observaciones = ?, fecha_revision = NOW() WHERE id = ?',
      [estado, observaciones, id]
    );
    res.json({ message: 'PGO revisado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ AVANCE – validar ============
export const listarTodosAvances = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT av.*, m.nombre as materia_nombre, m.codigo as materia_codigo,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM avance_materia av
       JOIN materias m ON av.materia_id = m.id
       JOIN docentes d ON av.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       ORDER BY av.fecha DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const validarAvance = async (req, res) => {
  try {
    const { id } = req.params;
    const { validado, observaciones } = req.body;
    await pool.query(
      `UPDATE avance_materia SET validado = ?, validado_por = ?, observaciones = ?, fecha_validacion = NOW()
       WHERE id = ?`,
      [validado, req.user.id, observaciones, id]
    );
    res.json({ message: 'Avance revisado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ ANÁLISIS DE COMPORTAMIENTOS ============
export const analisisComportamiento = async (req, res) => {
  try {
    // Estudiantes con más faltas
    const [faltas] = await pool.query(
      `SELECT e.id, u.nombre, u.apellido, e.codigo_estudiante,
              COUNT(a.id) as total_faltas
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN asistencias a ON a.estudiante_id = e.id AND a.estado = 'falta'
       GROUP BY e.id, u.nombre, u.apellido, e.codigo_estudiante
       ORDER BY total_faltas DESC
       LIMIT 10`
    );

    // Comentarios por tipo
    const [comentariosTipo] = await pool.query(
      `SELECT tipo, COUNT(*) as total FROM comentarios_estudiantes GROUP BY tipo`
    );

    // Alertas recientes
    const [alertas] = await pool.query(
      `SELECT c.*, u.nombre as estudiante_nombre, u.apellido as estudiante_apellido,
              ud.nombre as docente_nombre, m.nombre as materia_nombre
       FROM comentarios_estudiantes c
       JOIN estudiantes e ON c.estudiante_id = e.id
       JOIN usuarios u ON e.usuario_id = u.id
       JOIN docentes d ON c.docente_id = d.id
       JOIN usuarios ud ON d.usuario_id = ud.id
       LEFT JOIN materias m ON c.materia_id = m.id
       WHERE c.tipo IN ('alerta', 'observacion')
       ORDER BY c.created_at DESC
       LIMIT 15`
    );

    res.json({ faltas, comentariosTipo, alertas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ DASHBOARD ============
export const dashboard = async (req, res) => {
  try {
    // Totales globales
    const [[totalEstudiantes]] = await pool.query('SELECT COUNT(*) as total FROM estudiantes');
    const [[totalDocentes]] = await pool.query('SELECT COUNT(*) as total FROM docentes');
    const [[totalMaterias]] = await pool.query('SELECT COUNT(*) as total FROM materias');
    const [[totalCursos]] = await pool.query('SELECT COUNT(*) as total FROM cursos_capacitacion');

    // Estudiantes por semestre
    const [porSemestre] = await pool.query(
      `SELECT semestre, COUNT(*) as total FROM estudiantes GROUP BY semestre ORDER BY semestre`
    );

    // Promedio de avance por materia
    const [avancePorMateria] = await pool.query(
      `SELECT m.id, m.nombre, m.codigo,
              COALESCE(MAX(av.porcentaje_avance), 0) as avance_actual,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM materias m
       LEFT JOIN avance_materia av ON av.materia_id = m.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       GROUP BY m.id, m.nombre, m.codigo, u.nombre, u.apellido`
    );

    // Asistencias globales
    const [asistenciaGlobal] = await pool.query(
      `SELECT estado, COUNT(*) as total FROM asistencias GROUP BY estado`
    );

    // Estado de PGO
    const [estadoPGO] = await pool.query(
      `SELECT estado, COUNT(*) as total FROM pgo GROUP BY estado`
    );

    res.json({
      totales: {
        estudiantes: totalEstudiantes.total,
        docentes: totalDocentes.total,
        materias: totalMaterias.total,
        cursos: totalCursos.total
      },
      porSemestre,
      avancePorMateria,
      asistenciaGlobal,
      estadoPGO
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Detalle por estudiante
export const detalleEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const [[est]] = await pool.query(
      `SELECT e.*, u.nombre, u.apellido, u.email, u.ci, u.telefono,
              c.nombre as carrera_nombre
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN carreras c ON e.carrera_id = c.id
       WHERE e.id = ?`,
      [id]
    );
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [materias] = await pool.query(
      `SELECT m.* FROM inscripciones i JOIN materias m ON i.materia_id = m.id WHERE i.estudiante_id = ?`,
      [id]
    );

    const [asistencias] = await pool.query(
      `SELECT estado, COUNT(*) as total FROM asistencias WHERE estudiante_id = ? GROUP BY estado`,
      [id]
    );

    const [cursos] = await pool.query(
      `SELECT * FROM cursos_capacitacion WHERE estudiante_id = ?`,
      [id]
    );

    const [comentarios] = await pool.query(
      `SELECT c.*, u.nombre as docente_nombre, u.apellido as docente_apellido, m.nombre as materia_nombre
       FROM comentarios_estudiantes c
       JOIN docentes d ON c.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       LEFT JOIN materias m ON c.materia_id = m.id
       WHERE c.estudiante_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json({ estudiante: est, materias, asistencias, cursos, comentarios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarEstudiantes = async (req, res) => {
  try {
    const { semestre } = req.query;
    let query = `SELECT e.id, e.codigo_estudiante, e.semestre, u.nombre, u.apellido, u.email,
                        c.nombre as carrera_nombre
                 FROM estudiantes e
                 JOIN usuarios u ON e.usuario_id = u.id
                 LEFT JOIN carreras c ON e.carrera_id = c.id`;
    const params = [];
    if (semestre) {
      query += ' WHERE e.semestre = ?';
      params.push(semestre);
    }
    query += ' ORDER BY e.semestre, u.apellido';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
