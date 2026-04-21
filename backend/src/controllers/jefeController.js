import pool from '../config/db.js';
import { generarTareasDesdePgo } from '../utils/pgoTasks.js';
import { ensureNotificationSchema } from '../utils/notifications.js';
import { ensureStudentPermissionSchema } from '../utils/studentPermissions.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let attendanceSchemaEnsured = false;

const ensureAttendanceSupportSchema = async () => {
  if (attendanceSchemaEnsured) return;

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias'`
  );

  const existing = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existing.has('respaldo_url')) {
    await pool.query('ALTER TABLE asistencias ADD COLUMN respaldo_url VARCHAR(500) NULL');
  }
  if (!existing.has('editado_por')) {
    await pool.query('ALTER TABLE asistencias ADD COLUMN editado_por INT NULL');
  }
  if (!existing.has('updated_at')) {
    await pool.query('ALTER TABLE asistencias ADD COLUMN updated_at DATETIME NULL');
  }

  attendanceSchemaEnsured = true;
};

const buildAttendanceDateRange = ({ periodo, fecha, desde, hasta }) => {
  const format = (date) => date.toISOString().slice(0, 10);
  const parse = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  if (desde && hasta) {
    return { desde, hasta };
  }

  const base = parse(fecha) || new Date();
  if (periodo === 'semana') {
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(base);
    start.setDate(base.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { desde: format(start), hasta: format(end) };
  }

  if (periodo === 'mes') {
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return { desde: format(start), hasta: format(end) };
  }

  return { desde: format(base), hasta: format(base) };
};

// Helper: obtener carrera del jefe
const getCarreraJefe = async (usuarioId) => {
  const [rows] = await pool.query('SELECT * FROM carreras WHERE jefe_id = ?', [usuarioId]);
  return rows[0] || null;
};

const getEstudianteCarrera = async (estudianteId) => {
  const [[estudiante]] = await pool.query(
    'SELECT id, carrera_id, semestre FROM estudiantes WHERE id = ?',
    [estudianteId]
  );
  return estudiante || null;
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

    let tareas = null;
    if (estado === 'aprobado') {
      try {
        tareas = await generarTareasDesdePgo(id);
      } catch (taskErr) {
        console.error('Error generando tareas del PGO:', taskErr);
      }
    }

    res.json({ message: 'PGO revisado', tareas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarPGO = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const { id } = req.params;
    const [[pgo]] = await pool.query(
      `SELECT p.id, p.archivo_url
       FROM pgo p
       JOIN materias m ON p.materia_id = m.id
       WHERE p.id = ? AND m.carrera_id = ?`,
      [id, carrera.id]
    );

    if (!pgo) {
      return res.status(404).json({ error: 'PGO no encontrado en su carrera' });
    }

    await pool.query('DELETE FROM pgo WHERE id = ?', [id]);
    await removeUploadedFile(pgo.archivo_url);

    res.json({ message: 'PGO eliminado' });
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

// ============ ASISTENCIAS DOCENTES ============ 
export const listarReportesAsistenciaDocentes = async (req, res) => {
  try {
    await ensureAttendanceSupportSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const { docente_id, materia_id, estado, periodo = 'dia', fecha, desde, hasta } = req.query;
    const range = buildAttendanceDateRange({ periodo, fecha, desde, hasta });

    let resumenQuery = `
      SELECT a.id, a.fecha, a.estado, a.justificacion, a.respaldo_url, a.updated_at,
             a.estudiante_id, a.materia_id,
             m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo,
             du.nombre as docente_nombre, du.apellido as docente_apellido, d.id as docente_id,
             u.nombre, u.apellido, e.codigo_estudiante,
             eu.nombre as editado_nombre, eu.apellido as editado_apellido
      FROM asistencias a
      JOIN materias m ON a.materia_id = m.id
      JOIN estudiantes e ON a.estudiante_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN docentes d ON m.docente_id = d.id
      LEFT JOIN usuarios du ON d.usuario_id = du.id
      LEFT JOIN usuarios eu ON a.editado_por = eu.id
      WHERE m.carrera_id = ? AND a.fecha BETWEEN ? AND ?
    `;
    const params = [carrera.id, range.desde, range.hasta];

    if (docente_id) {
      resumenQuery += ' AND d.id = ?';
      params.push(docente_id);
    }
    if (materia_id) {
      resumenQuery += ' AND m.id = ?';
      params.push(materia_id);
    }
    if (estado) {
      resumenQuery += ' AND a.estado = ?';
      params.push(estado);
    }

    resumenQuery += ' ORDER BY a.fecha DESC, du.apellido, m.nombre, u.apellido, u.nombre';
    const [registros] = await pool.query(resumenQuery, params);

    const sesionesMap = new Map();
    registros.forEach((row) => {
      const key = `${row.materia_id}-${row.fecha}`;
      if (!sesionesMap.has(key)) {
        sesionesMap.set(key, {
          materia_id: row.materia_id,
          fecha: row.fecha,
          materia_nombre: row.materia_nombre,
          materia_codigo: row.materia_codigo,
          materia_grupo: row.materia_grupo,
          docente_id: row.docente_id,
          docente_nombre: row.docente_nombre,
          docente_apellido: row.docente_apellido,
          total_registros: 0,
          presentes: 0,
          faltas: 0,
          permisos: 0,
          tardes: 0
        });
      }
      const session = sesionesMap.get(key);
      session.total_registros += 1;
      if (row.estado === 'presente') session.presentes += 1;
      if (row.estado === 'falta') session.faltas += 1;
      if (row.estado === 'permiso') session.permisos += 1;
      if (row.estado === 'tarde') session.tardes += 1;
    });

    const resumen = registros.reduce((acc, row) => {
      acc.total += 1;
      acc[row.estado] += 1;
      return acc;
    }, { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 });

    res.json({
      rango: range,
      resumen,
      sesiones: Array.from(sesionesMap.values()),
      registros
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const actualizarAsistenciaDocente = async (req, res) => {
  try {
    await ensureAttendanceSupportSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const { id } = req.params;
    const { estado, justificacion } = req.body;
    const respaldoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!['permiso', 'tarde'].includes(estado)) {
      return res.status(400).json({ error: 'Solo se puede editar la asistencia a permiso o tarde' });
    }
    if (estado === 'permiso' && !respaldoUrl) {
      return res.status(400).json({ error: 'Debe adjuntar un documento de respaldo para registrar permiso' });
    }
    if (estado === 'tarde' && !String(justificacion || '').trim()) {
      return res.status(400).json({ error: 'Debe registrar un justificativo para marcar tarde' });
    }

    const [[attendance]] = await pool.query(
      `SELECT a.id, a.respaldo_url
       FROM asistencias a
       JOIN materias m ON a.materia_id = m.id
       WHERE a.id = ? AND m.carrera_id = ?`,
      [id, carrera.id]
    );

    if (!attendance) {
      return res.status(404).json({ error: 'Registro de asistencia no encontrado en su carrera' });
    }

    const nextRespaldo = estado === 'permiso' ? respaldoUrl : null;
    await pool.query(
      `UPDATE asistencias
       SET estado = ?, justificacion = ?, respaldo_url = ?, editado_por = ?, updated_at = NOW()
       WHERE id = ?`,
      [estado, justificacion || null, nextRespaldo, req.user.id, id]
    );

    if (attendance.respaldo_url && attendance.respaldo_url !== nextRespaldo) {
      await removeUploadedFile(attendance.respaldo_url);
    }

    res.json({ message: 'Asistencia actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const indicadoresEstudiantes = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const [totalesPorEstado] = await pool.query(
      `SELECT a.estado, COUNT(*) as total
       FROM asistencias a
       JOIN estudiantes e ON a.estudiante_id = e.id
       WHERE e.carrera_id = ?
       GROUP BY a.estado`,
      [carrera.id]
    );

    const [topAsistencia] = await pool.query(
      `SELECT e.id, e.codigo_estudiante, u.nombre, u.apellido,
              COUNT(CASE WHEN a.estado = 'presente' THEN 1 END) as total_presentes
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN asistencias a ON a.estudiante_id = e.id
       WHERE e.carrera_id = ?
       GROUP BY e.id, e.codigo_estudiante, u.nombre, u.apellido
       ORDER BY total_presentes DESC, u.apellido, u.nombre
       LIMIT 5`,
      [carrera.id]
    );

    const [topFaltas] = await pool.query(
      `SELECT e.id, e.codigo_estudiante, u.nombre, u.apellido,
              COUNT(CASE WHEN a.estado = 'falta' THEN 1 END) as total_faltas,
              COUNT(CASE WHEN a.estado = 'permiso' THEN 1 END) as total_permisos,
              COUNT(CASE WHEN a.estado = 'tarde' THEN 1 END) as total_tardes
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN asistencias a ON a.estudiante_id = e.id
       WHERE e.carrera_id = ?
       GROUP BY e.id, e.codigo_estudiante, u.nombre, u.apellido
       ORDER BY total_faltas DESC, total_tardes DESC, u.apellido, u.nombre
       LIMIT 5`,
      [carrera.id]
    );

    const resumen = { falta: 0, permiso: 0, tarde: 0 };
    totalesPorEstado.forEach((item) => {
      if (item.estado in resumen) resumen[item.estado] = item.total;
    });

    res.json({
      resumen,
      topAsistencia,
      topFaltas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarSolicitudesPermiso = async (req, res) => {
  try {
    await ensureStudentPermissionSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const { estudiante_id, materia_id, fecha } = req.query;
    let query = `
      SELECT spr.*, e.codigo_estudiante, u.nombre as estudiante_nombre, u.apellido as estudiante_apellido,
             m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo,
             ru.nombre as registrado_nombre, ru.apellido as registrado_apellido
      FROM student_permission_requests spr
      JOIN estudiantes e ON spr.estudiante_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      JOIN materias m ON spr.materia_id = m.id
      JOIN usuarios ru ON spr.registrado_por = ru.id
      WHERE e.carrera_id = ?
    `;
    const params = [carrera.id];

    if (estudiante_id) {
      query += ' AND spr.estudiante_id = ?';
      params.push(estudiante_id);
    }
    if (materia_id) {
      query += ' AND spr.materia_id = ?';
      params.push(materia_id);
    }
    if (fecha) {
      query += ' AND ? BETWEEN spr.fecha_desde AND spr.fecha_hasta';
      params.push(fecha);
    }

    query += ' ORDER BY spr.fecha_desde DESC, spr.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearSolicitudPermiso = async (req, res) => {
  try {
    await ensureStudentPermissionSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const { estudiante_id, materia_id, tipo, fecha_desde, fecha_hasta, horas_detalle, detalle } = req.body;
    const documentoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!estudiante_id || !materia_id || !fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: 'Estudiante, materia y rango de fechas son requeridos' });
    }
    if (!['carta_permiso', 'justificacion'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de solicitud no valido' });
    }
    if (tipo === 'carta_permiso' && !documentoUrl) {
      return res.status(400).json({ error: 'Debe adjuntar la carta de permiso' });
    }
    if (tipo === 'justificacion' && !String(detalle || '').trim()) {
      return res.status(400).json({ error: 'Debe escribir la justificacion' });
    }

    const estudiante = await getEstudianteCarrera(estudiante_id);
    if (!estudiante || estudiante.carrera_id !== carrera.id) {
      return res.status(404).json({ error: 'Estudiante no encontrado en su carrera' });
    }

    const [[materia]] = await pool.query(
      `SELECT m.id
       FROM materias m
       JOIN inscripciones i ON i.materia_id = m.id
       WHERE m.id = ? AND m.carrera_id = ? AND i.estudiante_id = ?`,
      [materia_id, carrera.id, estudiante_id]
    );

    if (!materia) {
      return res.status(404).json({ error: 'La materia no pertenece al estudiante o a su carrera' });
    }

    const [result] = await pool.query(
      `INSERT INTO student_permission_requests
       (estudiante_id, materia_id, tipo, fecha_desde, fecha_hasta, horas_detalle, detalle, documento_url, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [estudiante_id, materia_id, tipo, fecha_desde, fecha_hasta, horas_detalle || null, detalle || null, documentoUrl, req.user.id]
    );

    res.status(201).json({ id: result.insertId, message: 'Solicitud registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarNotificaciones = async (req, res) => {
  try {
    await ensureNotificationSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const [rows] = await pool.query(
      `SELECT n.*, u.nombre as creado_nombre, u.apellido as creado_apellido
       FROM notifications n
       JOIN usuarios u ON n.creado_por = u.id
       WHERE n.carrera_id = ?
       ORDER BY n.created_at DESC`,
      [carrera.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearNotificacion = async (req, res) => {
  try {
    await ensureNotificationSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const { tipo, titulo, mensaje } = req.body;
    if (!['informativa', 'emergencia', 'institucional'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de notificacion no valido' });
    }
    if (!titulo || !mensaje) {
      return res.status(400).json({ error: 'Titulo y mensaje son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO notifications (carrera_id, tipo, titulo, mensaje, creado_por)
       VALUES (?, ?, ?, ?, ?)`,
      [carrera.id, tipo, titulo, mensaje, req.user.id]
    );

    res.status(201).json({ id: result.insertId, message: 'Notificacion creada' });
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
    const carrera = await getCarreraJefe(req.user.id);
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
    if (carrera && est.carrera_id !== carrera.id) {
      return res.status(403).json({ error: 'No autorizado para ver este estudiante' });
    }

    const [materias] = await pool.query(
      `SELECT m.*, ud.nombre as docente_nombre, ud.apellido as docente_apellido
       FROM inscripciones i
       JOIN materias m ON i.materia_id = m.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios ud ON d.usuario_id = ud.id
       WHERE i.estudiante_id = ?`,
      [id]
    );

    const [materiasDisponibles] = await pool.query(
      `SELECT m.*, ud.nombre as docente_nombre, ud.apellido as docente_apellido,
              EXISTS(
                SELECT 1 FROM inscripciones i
                WHERE i.estudiante_id = ? AND i.materia_id = m.id
              ) as inscrito
       FROM materias m
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios ud ON d.usuario_id = ud.id
       WHERE m.carrera_id = ?
       ORDER BY m.semestre, m.nombre, m.grupo`,
      [id, est.carrera_id]
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

    res.json({ estudiante: est, materias, materiasDisponibles, asistencias, asistenciasDetalle, cursos, comentarios, disciplina });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const inscribirEstudianteMateria = async (req, res) => {
  try {
    const { estudiante_id, materia_id } = req.body;
    if (!estudiante_id || !materia_id) {
      return res.status(400).json({ error: 'Estudiante y materia son requeridos' });
    }

    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const estudiante = await getEstudianteCarrera(estudiante_id);
    if (!estudiante || estudiante.carrera_id !== carrera.id) {
      return res.status(404).json({ error: 'Estudiante no encontrado en su carrera' });
    }

    const [[materia]] = await pool.query(
      'SELECT id, carrera_id FROM materias WHERE id = ?',
      [materia_id]
    );
    if (!materia || materia.carrera_id !== carrera.id) {
      return res.status(404).json({ error: 'Materia no encontrada en su carrera' });
    }

    const [result] = await pool.query(
      'INSERT INTO inscripciones (estudiante_id, materia_id) VALUES (?, ?)',
      [estudiante_id, materia_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Estudiante inscrito' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El estudiante ya está inscrito en esta materia' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const retirarEstudianteMateria = async (req, res) => {
  try {
    const { estudiante_id, materia_id } = req.params;
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const estudiante = await getEstudianteCarrera(estudiante_id);
    if (!estudiante || estudiante.carrera_id !== carrera.id) {
      return res.status(404).json({ error: 'Estudiante no encontrado en su carrera' });
    }

    const [[materia]] = await pool.query(
      'SELECT id, carrera_id FROM materias WHERE id = ?',
      [materia_id]
    );
    if (!materia || materia.carrera_id !== carrera.id) {
      return res.status(404).json({ error: 'Materia no encontrada en su carrera' });
    }

    await pool.query(
      'DELETE FROM inscripciones WHERE estudiante_id = ? AND materia_id = ?',
      [estudiante_id, materia_id]
    );
    res.json({ message: 'Inscripción eliminada' });
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

export const obtenerMateria = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    const { id } = req.params;
    const params = [id];
    let carreraFilter = '';

    if (carrera) {
      carreraFilter = ' AND m.carrera_id = ?';
      params.push(carrera.id);
    }

    const [[materia]] = await pool.query(
      `SELECT m.*, c.nombre as carrera_nombre,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM materias m
       LEFT JOIN carreras c ON m.carrera_id = c.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE m.id = ?${carreraFilter}`,
      params
    );

    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    res.json(materia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const detalleMateriaEstudiantes = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    const { id } = req.params;
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const [[materia]] = await pool.query(
      `SELECT m.*, c.nombre as carrera_nombre,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM materias m
       LEFT JOIN carreras c ON m.carrera_id = c.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE m.id = ? AND m.carrera_id = ?`,
      [id, carrera.id]
    );

    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    const [inscritos] = await pool.query(
      `SELECT e.id, e.codigo_estudiante, e.semestre,
              u.nombre, u.apellido, u.email, u.ci, u.telefono
       FROM inscripciones i
       JOIN estudiantes e ON i.estudiante_id = e.id
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE i.materia_id = ?
       ORDER BY u.apellido, u.nombre`,
      [id]
    );

    const [disponibles] = await pool.query(
      `SELECT e.id, e.codigo_estudiante, e.semestre,
              u.nombre, u.apellido, u.email
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE e.carrera_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM inscripciones i
           WHERE i.estudiante_id = e.id AND i.materia_id = ?
         )
       ORDER BY e.semestre, u.apellido, u.nombre`,
      [carrera.id, id]
    );

    res.json({ materia, inscritos, disponibles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearMateria = async (req, res) => {
  try {
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });
    const { nombre, codigo, grupo, docente_id, semestre, creditos } = req.body;
    if (!nombre || !codigo || !semestre) {
      return res.status(400).json({ error: 'Nombre, código y semestre son requeridos' });
    }
    const [result] = await pool.query(
      'INSERT INTO materias (nombre, codigo, grupo, carrera_id, docente_id, semestre, creditos) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, codigo.toUpperCase(), (grupo || 'A').toUpperCase(), carrera.id, docente_id || null, semestre, creditos || 4]
    );
    res.status(201).json({ id: result.insertId, message: 'Materia creada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe ese código/grupo en esta carrera' });
    res.status(500).json({ error: err.message });
  }
};

export const actualizarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, grupo, docente_id, semestre, creditos } = req.body;
    await pool.query(
      'UPDATE materias SET nombre=?, codigo=?, grupo=?, docente_id=?, semestre=?, creditos=? WHERE id=?',
      [nombre, codigo.toUpperCase(), (grupo || 'A').toUpperCase(), docente_id || null, semestre, creditos || 4, id]
    );
    res.json({ message: 'Materia actualizada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe ese código/grupo en esta carrera' });
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
