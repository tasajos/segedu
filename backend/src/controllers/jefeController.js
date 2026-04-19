import pool from '../config/db.js';

// Helper: obtener carrera del jefe
const getCarreraJefe = async (usuarioId) => {
  const [rows] = await pool.query('SELECT * FROM carreras WHERE jefe_id = ?', [usuarioId]);
  return rows[0] || null;
};

// ============ MI CARRERA ============
export const miCarrera = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    res.json(carrera || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ PGO – revisar ============
export const listarTodosPGO = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    const whereCarrera = carrera ? 'WHERE m.carrera_id = ?' : '';
    const params = carrera ? [carrera.id] : [];
    const [rows] = await pool.query(
      `SELECT p.*, m.nombre as materia_nombre, m.codigo as materia_codigo,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM pgo p
       JOIN materias m ON p.materia_id = m.id
       JOIN docentes d ON p.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       ${whereCarrera}
       ORDER BY p.fecha_envio DESC`,
      params
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
    const carrera = await getCarreraJefe(req.user.id);
    const whereCarrera = carrera ? 'AND m.carrera_id = ?' : '';
    const params = carrera ? [carrera.id] : [];
    const [rows] = await pool.query(
      `SELECT av.*, m.nombre as materia_nombre, m.codigo as materia_codigo,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM avance_materia av
       JOIN materias m ON av.materia_id = m.id
       JOIN docentes d ON av.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       WHERE 1=1 ${whereCarrera}
       ORDER BY av.fecha DESC`,
      params
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
    const carrera = await getCarreraJefe(req.user.id);
    const carreraFilter = carrera ? 'AND e.carrera_id = ?' : '';
    const carreraParam = carrera ? [carrera.id] : [];

    const [faltas] = await pool.query(
      `SELECT e.id, u.nombre, u.apellido, e.codigo_estudiante,
              COUNT(a.id) as total_faltas
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN asistencias a ON a.estudiante_id = e.id AND a.estado = 'falta'
       WHERE 1=1 ${carreraFilter}
       GROUP BY e.id, u.nombre, u.apellido, e.codigo_estudiante
       ORDER BY total_faltas DESC
       LIMIT 10`,
      carreraParam
    );

    const [comentariosTipo] = await pool.query(
      `SELECT tipo, COUNT(*) as total FROM comentarios_estudiantes GROUP BY tipo`
    );

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
    const carrera = await getCarreraJefe(req.user.id);
    const cWhere = carrera ? 'WHERE carrera_id = ?' : '';
    const cParam = carrera ? [carrera.id] : [];

    const [[totalEstudiantes]] = await pool.query(`SELECT COUNT(*) as total FROM estudiantes ${cWhere}`, cParam);
    const [[totalDocentes]] = await pool.query('SELECT COUNT(*) as total FROM docentes');
    const [[totalMaterias]] = await pool.query(`SELECT COUNT(*) as total FROM materias ${cWhere}`, cParam);
    const [[totalCursos]] = await pool.query('SELECT COUNT(*) as total FROM cursos_capacitacion');

    const [porSemestre] = await pool.query(
      `SELECT semestre, COUNT(*) as total FROM estudiantes ${cWhere} GROUP BY semestre ORDER BY semestre`,
      cParam
    );

    const mWhere = carrera ? 'WHERE m.carrera_id = ?' : '';
    const [avancePorMateria] = await pool.query(
      `SELECT m.id, m.nombre, m.codigo,
              COALESCE(MAX(av.porcentaje_avance), 0) as avance_actual,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM materias m
       LEFT JOIN avance_materia av ON av.materia_id = m.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       ${mWhere}
       GROUP BY m.id, m.nombre, m.codigo, u.nombre, u.apellido`,
      cParam
    );

    const [asistenciaGlobal] = await pool.query(
      `SELECT estado, COUNT(*) as total FROM asistencias GROUP BY estado`
    );

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
      estadoPGO,
      carrera: carrera || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ ESTUDIANTES ============
export const listarEstudiantes = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    const { semestre } = req.query;
    let query = `SELECT e.id, e.codigo_estudiante, e.semestre, u.nombre, u.apellido, u.email, u.ci, u.telefono,
                        c.nombre as carrera_nombre
                 FROM estudiantes e
                 JOIN usuarios u ON e.usuario_id = u.id
                 LEFT JOIN carreras c ON e.carrera_id = c.id
                 WHERE 1=1`;
    const params = [];
    if (carrera) { query += ' AND e.carrera_id = ?'; params.push(carrera.id); }
    if (semestre) { query += ' AND e.semestre = ?'; params.push(semestre); }
    query += ' ORDER BY e.semestre, u.apellido';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
      `SELECT m.*, ud.nombre as docente_nombre, ud.apellido as docente_apellido
       FROM inscripciones i
       JOIN materias m ON i.materia_id = m.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios ud ON d.usuario_id = ud.id
       WHERE i.estudiante_id = ?`,
      [id]
    );

    const [asistencias] = await pool.query(
      `SELECT estado, COUNT(*) as total FROM asistencias WHERE estudiante_id = ? GROUP BY estado`,
      [id]
    );

    const [asistenciasDetalle] = await pool.query(
      `SELECT a.*, m.nombre as materia_nombre
       FROM asistencias a
       JOIN materias m ON a.materia_id = m.id
       WHERE a.estudiante_id = ?
       ORDER BY a.fecha DESC
       LIMIT 30`,
      [id]
    );

    const [cursos] = await pool.query(
      'SELECT * FROM cursos_capacitacion WHERE estudiante_id = ?',
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

    const [disciplina] = await pool.query(
      `SELECT de.*, m.nombre as materia_nombre, u.nombre as registrado_nombre, u.apellido as registrado_apellido
       FROM disciplina_estudiantes de
       LEFT JOIN materias m ON de.materia_id = m.id
       JOIN usuarios u ON de.registrado_por = u.id
       WHERE de.estudiante_id = ?
       ORDER BY de.fecha DESC`,
      [id]
    );

    res.json({ estudiante: est, materias, asistencias, asistenciasDetalle, cursos, comentarios, disciplina });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ DISCIPLINA ESTUDIANTES ============
export const listarDisciplinaEstudiantes = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    const { estudiante_id, tipo } = req.query;
    let query = `
      SELECT de.*, m.nombre as materia_nombre,
             u.nombre as registrado_nombre, u.apellido as registrado_apellido, u.rol as registrado_rol,
             eu.nombre as estudiante_nombre, eu.apellido as estudiante_apellido,
             e.codigo_estudiante
      FROM disciplina_estudiantes de
      JOIN estudiantes e ON de.estudiante_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN materias m ON de.materia_id = m.id
      JOIN usuarios u ON de.registrado_por = u.id
      WHERE 1=1`;
    const params = [];
    if (carrera) { query += ' AND e.carrera_id = ?'; params.push(carrera.id); }
    if (estudiante_id) { query += ' AND de.estudiante_id = ?'; params.push(estudiante_id); }
    if (tipo) { query += ' AND de.tipo = ?'; params.push(tipo); }
    query += ' ORDER BY de.fecha DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearDisciplinaEstudiante = async (req, res) => {
  try {
    const { tipo, estudiante_id, materia_id, fecha, descripcion } = req.body;
    const [result] = await pool.query(
      'INSERT INTO disciplina_estudiantes (tipo, estudiante_id, materia_id, fecha, descripcion, registrado_por) VALUES (?, ?, ?, ?, ?, ?)',
      [tipo, estudiante_id, materia_id || null, fecha, descripcion, req.user.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Registro creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarDisciplinaEstudiante = async (req, res) => {
  try {
    await pool.query('DELETE FROM disciplina_estudiantes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Registro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ DISCIPLINA DOCENTES ============
export const listarDisciplinaDocentes = async (req, res) => {
  try {
    const { docente_id, tipo } = req.query;
    let query = `
      SELECT dd.*, m.nombre as materia_nombre,
             u.nombre as registrado_nombre, u.apellido as registrado_apellido,
             du.nombre as docente_nombre, du.apellido as docente_apellido
      FROM disciplina_docentes dd
      JOIN docentes d ON dd.docente_id = d.id
      JOIN usuarios du ON d.usuario_id = du.id
      LEFT JOIN materias m ON dd.materia_id = m.id
      JOIN usuarios u ON dd.registrado_por = u.id
      WHERE 1=1`;
    const params = [];
    if (docente_id) { query += ' AND dd.docente_id = ?'; params.push(docente_id); }
    if (tipo) { query += ' AND dd.tipo = ?'; params.push(tipo); }
    query += ' ORDER BY dd.fecha DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearDisciplinaDocente = async (req, res) => {
  try {
    const { tipo, docente_id, materia_id, fecha, descripcion } = req.body;
    const [result] = await pool.query(
      'INSERT INTO disciplina_docentes (tipo, docente_id, materia_id, fecha, descripcion, registrado_por) VALUES (?, ?, ?, ?, ?, ?)',
      [tipo, docente_id, materia_id || null, fecha, descripcion, req.user.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Registro creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarDisciplinaDocente = async (req, res) => {
  try {
    await pool.query('DELETE FROM disciplina_docentes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Registro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ HORARIOS ============
export const listarHorarios = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    const whereCarrera = carrera ? 'WHERE m.carrera_id = ?' : '';
    const params = carrera ? [carrera.id] : [];
    const [rows] = await pool.query(
      `SELECT h.*, m.nombre as materia_nombre, m.codigo as materia_codigo,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM horarios h
       JOIN materias m ON h.materia_id = m.id
       JOIN docentes d ON h.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       ${whereCarrera}
       ORDER BY FIELD(h.dia_semana,'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'), h.hora_inicio`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearHorario = async (req, res) => {
  try {
    const { materia_id, docente_id, dia_semana, hora_inicio, hora_fin, aula, periodo } = req.body;
    const [result] = await pool.query(
      'INSERT INTO horarios (materia_id, docente_id, dia_semana, hora_inicio, hora_fin, aula, periodo, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [materia_id, docente_id, dia_semana, hora_inicio, hora_fin, aula, periodo, req.user.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Horario creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarHorario = async (req, res) => {
  try {
    await pool.query('DELETE FROM horarios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Horario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ ASIGNAR DOCENTE A MATERIA ============
export const asignarDocente = async (req, res) => {
  try {
    const { materia_id, docente_id } = req.body;
    await pool.query('UPDATE materias SET docente_id = ? WHERE id = ?', [docente_id || null, materia_id]);
    res.json({ message: 'Docente asignado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ MATERIAS CRUD (jefe scoped) ============
export const listarMaterias = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    const whereCarrera = carrera ? 'WHERE m.carrera_id = ?' : '';
    const params = carrera ? [carrera.id] : [];
    const [rows] = await pool.query(
      `SELECT m.*, c.nombre as carrera_nombre,
              u.nombre as docente_nombre, u.apellido as docente_apellido,
              (SELECT COUNT(*) FROM inscripciones WHERE materia_id = m.id) as total_estudiantes
       FROM materias m
       LEFT JOIN carreras c ON m.carrera_id = c.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       ${whereCarrera}
       ORDER BY m.semestre, m.nombre`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearMateria = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });
    const { nombre, codigo, docente_id, semestre, creditos } = req.body;
    if (!nombre || !codigo || !semestre) {
      return res.status(400).json({ error: 'Nombre, código y semestre son requeridos' });
    }
    const [result] = await pool.query(
      'INSERT INTO materias (nombre, codigo, carrera_id, docente_id, semestre, creditos) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, codigo.toUpperCase(), carrera.id, docente_id || null, semestre, creditos || 4]
    );
    res.status(201).json({ id: result.insertId, message: 'Materia creada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una materia con ese código en esta carrera' });
    res.status(500).json({ error: err.message });
  }
};

export const actualizarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, docente_id, semestre, creditos } = req.body;
    await pool.query(
      'UPDATE materias SET nombre=?, codigo=?, docente_id=?, semestre=?, creditos=? WHERE id=?',
      [nombre, codigo.toUpperCase(), docente_id || null, semestre, creditos || 4, id]
    );
    res.json({ message: 'Materia actualizada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una materia con ese código en esta carrera' });
    res.status(500).json({ error: err.message });
  }
};

export const eliminarMateria = async (req, res) => {
  try {
    await pool.query('DELETE FROM materias WHERE id = ?', [req.params.id]);
    res.json({ message: 'Materia eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarDocentes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.id, u.nombre, u.apellido, u.email, d.especialidad, d.titulo
       FROM docentes d JOIN usuarios u ON d.usuario_id = u.id ORDER BY u.apellido`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
