import pool from '../config/db.js';
import { ensurePgoTaskSchema } from '../utils/pgoTasks.js';
import { ensureStudentPermissionSchema } from '../utils/studentPermissions.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseDateParts = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateParts = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resolveDateRange = ({ periodo, fecha, desde, hasta }) => {
  if (desde && hasta) {
    return { desde, hasta, periodo: periodo || 'rango' };
  }

  const base = parseDateParts(fecha || formatDateParts(new Date()));
  if (!base) return null;

  if (periodo === 'semana') {
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(base);
    start.setDate(base.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { desde: formatDateParts(start), hasta: formatDateParts(end), periodo };
  }

  if (periodo === 'mes') {
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return { desde: formatDateParts(start), hasta: formatDateParts(end), periodo };
  }

  return {
    desde: formatDateParts(base),
    hasta: formatDateParts(base),
    periodo: periodo || 'dia'
  };
};

const resolveUploadCandidates = (archivoUrl) => {
  if (!archivoUrl) return [];
  const fileName = path.basename(archivoUrl);
  return [
    path.resolve(process.cwd(), 'uploads', fileName),
    path.resolve(process.cwd(), 'backend', 'uploads', fileName),
    path.resolve(__dirname, '..', '..', 'uploads', fileName)
  ];
};

const removeUploadedFile = async (archivoUrl) => {
  for (const candidate of resolveUploadCandidates(archivoUrl)) {
    try {
      await fs.unlink(candidate);
      return true;
    } catch {
      continue;
    }
  }
  return false;
};

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
      `SELECT p.*, m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo
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

export const eliminarPGO = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { id } = req.params;

    const [[pgo]] = await pool.query(
      'SELECT id, archivo_url FROM pgo WHERE id = ? AND docente_id = ?',
      [id, docenteId]
    );

    if (!pgo) {
      return res.status(404).json({ error: 'PGO no encontrado' });
    }

    await pool.query('DELETE FROM pgo WHERE id = ? AND docente_id = ?', [id, docenteId]);
    await removeUploadedFile(pgo.archivo_url);

    res.json({ message: 'PGO eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ AVANCE DE MATERIA ============
export const listarAvance = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { materia_id } = req.query;
    let query = `SELECT av.*, m.nombre as materia_nombre, m.grupo as materia_grupo,
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

export const listarPgoTareas = async (req, res) => {
  try {
    await ensurePgoTaskSchema();
    const docenteId = req.user.docente_id;
    const { materia_id } = req.query;

    let query = `
      SELECT t.*, m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo,
             p.periodo, p.estado as pgo_estado
      FROM pgo_tareas t
      JOIN materias m ON t.materia_id = m.id
      JOIN pgo p ON t.pgo_id = p.id
      WHERE t.docente_id = ?
    `;
    const params = [docenteId];

    if (materia_id) {
      query += ' AND t.materia_id = ?';
      params.push(materia_id);
    }

    query += ' ORDER BY m.nombre, m.grupo, t.orden';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const actualizarEstadoPgoTarea = async (req, res) => {
  try {
    await ensurePgoTaskSchema();
    const docenteId = req.user.docente_id;
    const { id } = req.params;
    const completed = !!req.body.completed;

    const [[task]] = await pool.query(
      `SELECT t.*, p.estado as pgo_estado
       FROM pgo_tareas t
       JOIN pgo p ON t.pgo_id = p.id
       WHERE t.id = ? AND t.docente_id = ?`,
      [id, docenteId]
    );

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    if (task.pgo_estado !== 'aprobado') {
      return res.status(409).json({ error: 'El PGO de esta materia aun no esta aprobado' });
    }

    if (completed && task.estado !== 'completado') {
      await pool.query(
        'UPDATE pgo_tareas SET estado = ?, fecha_completado = CURDATE() WHERE id = ?',
        ['completado', id]
      );

      const [[stats]] = await pool.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completadas
         FROM pgo_tareas
         WHERE pgo_id = ?`,
        [task.pgo_id]
      );

      const porcentaje = stats.total ? Number(((stats.completadas * 100) / stats.total).toFixed(2)) : 0;
      const [insertResult] = await pool.query(
        `INSERT INTO avance_materia (materia_id, docente_id, tema, descripcion, porcentaje_avance, fecha)
         VALUES (?, ?, ?, ?, ?, CURDATE())`,
        [
          task.materia_id,
          docenteId,
          task.titulo,
          `Contenido del PGO completado - ${task.unidad_codigo}: ${task.unidad_nombre}`,
          porcentaje
        ]
      );

      await pool.query(
        'UPDATE pgo_tareas SET avance_id = ? WHERE id = ?',
        [insertResult.insertId, id]
      );
    }

    if (!completed && task.estado === 'completado') {
      if (task.avance_id) {
        await pool.query(
          'DELETE FROM avance_materia WHERE id = ? AND docente_id = ?',
          [task.avance_id, docenteId]
        );
      }

      await pool.query(
        'UPDATE pgo_tareas SET estado = ?, fecha_completado = NULL, avance_id = NULL WHERE id = ?',
        ['pendiente', id]
      );
    }

    const [[updated]] = await pool.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completadas
       FROM pgo_tareas
       WHERE pgo_id = ?`,
      [task.pgo_id]
    );

    res.json({
      message: completed ? 'Contenido marcado como completado' : 'Contenido marcado como pendiente',
      resumen: {
        total: updated.total,
        completadas: updated.completadas || 0,
        porcentaje: updated.total ? Number((((updated.completadas || 0) * 100) / updated.total).toFixed(2)) : 0
      }
    });
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

// ============ LISTA DE ASISTENCIA (llamada por sesión) ============
export const registrarListaAsistencia = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const docenteId = req.user.docente_id;
    const { materia_id, fecha, registros } = req.body;
    // registros: [{estudiante_id, estado, justificacion}]
    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un registro' });
    }
    // Verificar que la materia pertenece al docente
    const [[materia]] = await conn.query(
      'SELECT id FROM materias WHERE id = ? AND docente_id = ?',
      [materia_id, docenteId]
    );
    if (!materia) return res.status(403).json({ error: 'Materia no asignada a este docente' });

    const [[existente]] = await conn.query(
      'SELECT COUNT(*) as total FROM asistencias WHERE materia_id = ? AND fecha = ?',
      [materia_id, fecha]
    );
    if (existente.total > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'La lista de asistencia de esta materia ya fue registrada para esa fecha' });
    }

    for (const r of registros) {
      await conn.query(
        `INSERT INTO asistencias (estudiante_id, materia_id, fecha, estado, justificacion)
         VALUES (?, ?, ?, ?, ?)`,
        [r.estudiante_id, materia_id, fecha, r.estado, r.justificacion || null]
      );
    }
    await conn.commit();
    res.status(201).json({ message: `Lista registrada para ${registros.length} estudiantes` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

export const listarSesionesAsistencia = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { materia_id, fecha, desde, hasta, periodo } = req.query;
    const range = resolveDateRange({ periodo, fecha, desde, hasta });
    let query = `
      SELECT a.materia_id, a.fecha, m.nombre as materia_nombre,
             m.grupo,
             COUNT(*) as total_registros,
             COUNT(CASE WHEN a.estado = 'presente' THEN 1 END) as presentes,
             COUNT(CASE WHEN a.estado = 'falta' THEN 1 END) as faltas,
             COUNT(CASE WHEN a.estado = 'permiso' THEN 1 END) as permisos,
             COUNT(CASE WHEN a.estado = 'tarde' THEN 1 END) as tardes
      FROM asistencias a
      JOIN materias m ON a.materia_id = m.id
      WHERE m.docente_id = ?`;
    const params = [docenteId];
    if (materia_id) { query += ' AND a.materia_id = ?'; params.push(materia_id); }
    if (range?.desde && range?.hasta) {
      query += ' AND a.fecha BETWEEN ? AND ?';
      params.push(range.desde, range.hasta);
    }
    query += ' GROUP BY a.materia_id, a.fecha, m.nombre, m.grupo ORDER BY a.fecha DESC';
    const [rows] = await pool.query(query, params);
    res.json({
      rango: range,
      sesiones: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarAsistenciaSesion = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { materia_id, fecha } = req.query;
    const [rows] = await pool.query(
      `SELECT a.*, u.nombre, u.apellido, e.codigo_estudiante
       FROM asistencias a
       JOIN estudiantes e ON a.estudiante_id = e.id
       JOIN usuarios u ON e.usuario_id = u.id
       JOIN materias m ON a.materia_id = m.id
       WHERE m.docente_id = ? AND a.materia_id = ? AND a.fecha = ?
       ORDER BY u.apellido`,
      [docenteId, materia_id, fecha]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarReporteAsistencia = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const { materia_id, estado, fecha, desde, hasta, periodo } = req.query;
    const range = resolveDateRange({ periodo, fecha, desde, hasta });

    let query = `
      SELECT a.fecha, a.estado, a.justificacion, a.estudiante_id, a.materia_id,
             m.nombre as materia_nombre, m.grupo as materia_grupo, m.codigo as materia_codigo,
             u.nombre, u.apellido, e.codigo_estudiante
      FROM asistencias a
      JOIN materias m ON a.materia_id = m.id
      JOIN estudiantes e ON a.estudiante_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE m.docente_id = ?
    `;
    const params = [docenteId];

    if (materia_id) {
      query += ' AND a.materia_id = ?';
      params.push(materia_id);
    }

    if (estado) {
      query += ' AND a.estado = ?';
      params.push(estado);
    }

    if (range?.desde && range?.hasta) {
      query += ' AND a.fecha BETWEEN ? AND ?';
      params.push(range.desde, range.hasta);
    }

    query += ' ORDER BY a.fecha DESC, u.apellido, u.nombre';
    const [rows] = await pool.query(query, params);

    const resumen = rows.reduce((acc, row) => {
      acc.total += 1;
      acc[row.estado] += 1;
      return acc;
    }, { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 });

    res.json({
      rango: range,
      resumen,
      registros: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarSolicitudesPermisoDocente = async (req, res) => {
  try {
    await ensureStudentPermissionSchema();
    const docenteId = req.user.docente_id;
    const { materia_id, fecha } = req.query;

    const [rows] = await pool.query(
      `SELECT spr.*, e.codigo_estudiante, u.nombre, u.apellido
       FROM student_permission_requests spr
       JOIN materias m ON spr.materia_id = m.id
       JOIN estudiantes e ON spr.estudiante_id = e.id
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE m.docente_id = ? AND spr.materia_id = ? AND ? BETWEEN spr.fecha_desde AND spr.fecha_hasta
       ORDER BY spr.created_at DESC, u.apellido, u.nombre`,
      [docenteId, materia_id, fecha]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const misDisciplina = async (req, res) => {
  try {
    const docenteId = req.user.docente_id;
    const [rows] = await pool.query(
      `SELECT dd.*, m.nombre as materia_nombre, u.nombre as registrado_nombre, u.apellido as registrado_apellido
       FROM disciplina_docentes dd
       LEFT JOIN materias m ON dd.materia_id = m.id
       JOIN usuarios u ON dd.registrado_por = u.id
       WHERE dd.docente_id = ?
       ORDER BY dd.fecha DESC`,
      [docenteId]
    );
    res.json(rows);
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
