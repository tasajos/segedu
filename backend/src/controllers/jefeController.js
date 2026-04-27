import pool from '../config/db.js';
import { ensureGradeReportSchema, PASSING_GRADE, GRADE_MODALITIES } from '../utils/gradeReports.js';
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

const normalizeGradeDetail = (row) => {
  const modalidad = row.modalidad || 'regular';
  const config = GRADE_MODALITIES[modalidad] || GRADE_MODALITIES.regular;

  if (modalidad === 'regular') {
    const primer = Number(row.primer_parcial || 0);
    const segundo = Number(row.segundo_parcial || 0);
    const final = Number(row.examen_final || 0);
    const notaFinal = Number((primer + segundo + final).toFixed(2));
    const aprobado = primer >= 18 && notaFinal >= config.passing;
    return {
      modalidad,
      primer_parcial: primer,
      segundo_parcial: segundo,
      examen_final: final,
      examen_recuperacion: null,
      nota_final: notaFinal,
      estado: aprobado ? 'aprobado' : 'reprobado'
    };
  }

  const recuperacion = Number(row.examen_recuperacion || 0);
  const aprobado = recuperacion >= config.passing;
  return {
    modalidad,
    primer_parcial: null,
    segundo_parcial: null,
    examen_final: null,
    examen_recuperacion: recuperacion,
    nota_final: recuperacion,
    estado: aprobado ? 'aprobado' : 'reprobado'
  };
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
             ru.nombre as registrado_nombre, ru.apellido as registrado_apellido, ru.rol as registrado_rol
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

export const cambiarEstadoSolicitudPermiso = async (req, res) => {
  try {
    await ensureStudentPermissionSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const { id } = req.params;
    const { estado, observacion_jefe } = req.body;

    if (!['aprobado', 'rechazado', 'pendiente'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const [[solicitud]] = await pool.query(
      `SELECT spr.id FROM student_permission_requests spr
       JOIN estudiantes e ON spr.estudiante_id = e.id
       WHERE spr.id = ? AND e.carrera_id = ?`,
      [id, carrera.id]
    );
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    await pool.query(
      `UPDATE student_permission_requests SET estado = ?, observacion_jefe = ? WHERE id = ?`,
      [estado, observacion_jefe || null, id]
    );

    res.json({ message: `Solicitud ${estado} correctamente` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarSolicitudPermiso = async (req, res) => {
  try {
    await ensureStudentPermissionSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const { id } = req.params;
    const [[solicitud]] = await pool.query(
      `SELECT spr.id, spr.documento_url
       FROM student_permission_requests spr
       JOIN estudiantes e ON spr.estudiante_id = e.id
       WHERE spr.id = ? AND e.carrera_id = ?`,
      [id, carrera.id]
    );

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada en su carrera' });
    }

    await pool.query('DELETE FROM student_permission_requests WHERE id = ?', [id]);
    if (solicitud.documento_url) {
      await removeUploadedFile(solicitud.documento_url);
    }

    res.json({ message: 'Solicitud eliminada' });
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

export const obtenerActaMateria = async (req, res) => {
  try {
    await ensureGradeReportSchema();
    const carrera = await getCarreraJefe(req.user.id);
    const { id } = req.params;
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const [[materia]] = await pool.query(
      `SELECT m.*, u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM materias m
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE m.id = ? AND m.carrera_id = ?`,
      [id, carrera.id]
    );

    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });

    const [inscritos] = await pool.query(
      `SELECT e.id, e.codigo_estudiante, e.semestre,
              u.nombre, u.apellido, u.email
       FROM inscripciones i
       JOIN estudiantes e ON i.estudiante_id = e.id
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE i.materia_id = ?
       ORDER BY u.apellido, u.nombre`,
      [id]
    );

    const [[acta]] = await pool.query(
      `SELECT * FROM grade_reports WHERE materia_id = ?`,
      [id]
    );

    let detalles = [];
    if (acta) {
      const [rows] = await pool.query(
        `SELECT grd.*, e.codigo_estudiante
         FROM grade_report_details grd
         JOIN estudiantes e ON grd.estudiante_id = e.id
         WHERE grd.acta_id = ?`,
        [acta.id]
      );
      detalles = rows;
    }

    res.json({
      materia,
      inscritos,
      acta: acta || null,
      detalles,
      nota_aprobacion: PASSING_GRADE,
      modalidades: GRADE_MODALITIES,
      reglas: {
        regular: { primer_parcial_max: 35, primer_parcial_minimo: 18, segundo_parcial_max: 35, examen_final_max: 30, nota_minima: 51 },
        segunda_instancia: { maximo: 51, nota_minima: GRADE_MODALITIES.segunda_instancia.passing },
        examen_mesa: { maximo: 51, nota_minima: GRADE_MODALITIES.examen_mesa.passing },
        examen_gracia: { maximo: 100, nota_minima: GRADE_MODALITIES.examen_gracia.passing }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const guardarActaMateria = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await ensureGradeReportSchema();
    await conn.beginTransaction();

    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) {
      await conn.rollback();
      return res.status(403).json({ error: 'Sin carrera asignada' });
    }

    const { materia_id, periodo, observaciones } = req.body;
      const notas = JSON.parse(req.body.notas || '[]');
    const archivoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!materia_id || !Array.isArray(notas) || !notas.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Materia y notas son requeridas' });
    }

    const [[materia]] = await conn.query(
      'SELECT id FROM materias WHERE id = ? AND carrera_id = ?',
      [materia_id, carrera.id]
    );

    if (!materia) {
      await conn.rollback();
      return res.status(404).json({ error: 'Materia no encontrada en su carrera' });
    }

    const [[existing]] = await conn.query(
      'SELECT * FROM grade_reports WHERE materia_id = ?',
      [materia_id]
    );

    let actaId = existing?.id;
    let previousFile = existing?.archivo_url || null;

    if (existing) {
      await conn.query(
        `UPDATE grade_reports
         SET periodo = ?, observaciones = ?, archivo_url = ?, cargado_por = ?
         WHERE id = ?`,
        [periodo || null, observaciones || null, archivoUrl || existing.archivo_url, req.user.id, existing.id]
      );
    } else {
      const [result] = await conn.query(
        `INSERT INTO grade_reports (materia_id, periodo, observaciones, archivo_url, cargado_por)
         VALUES (?, ?, ?, ?, ?)`,
        [materia_id, periodo || null, observaciones || null, archivoUrl, req.user.id]
      );
      actaId = result.insertId;
    }

    await conn.query('DELETE FROM grade_report_details WHERE acta_id = ?', [actaId]);

      for (const row of notas) {
        const normalized = normalizeGradeDetail(row);
        await conn.query(
          `INSERT INTO grade_report_details
           (acta_id, estudiante_id, modalidad, primer_parcial, segundo_parcial, examen_final, examen_recuperacion, nota_final, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            actaId,
            row.estudiante_id,
            normalized.modalidad,
            normalized.primer_parcial,
            normalized.segundo_parcial,
            normalized.examen_final,
            normalized.examen_recuperacion,
            normalized.nota_final,
            normalized.estado
          ]
        );
      }

    await conn.commit();

    if (archivoUrl && previousFile && previousFile !== archivoUrl) {
      await removeUploadedFile(previousFile);
    }

    res.json({ message: 'Acta guardada', id: actaId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

export const indicadoresActas = async (req, res) => {
  try {
    await ensureGradeReportSchema();
    const carrera = await getCarreraJefe(req.user.id);
    if (!carrera) return res.status(403).json({ error: 'Sin carrera asignada' });

    const [porMateria] = await pool.query(
      `SELECT m.id, m.nombre, m.codigo, m.grupo,
              du.nombre as docente_nombre, du.apellido as docente_apellido,
              COUNT(CASE WHEN grd.modalidad = 'regular' AND grd.primer_parcial >= 18 THEN 1 END) as aprobados_primer_parcial,
              COUNT(CASE WHEN grd.modalidad = 'regular' AND grd.primer_parcial < 18 THEN 1 END) as reprobados_primer_parcial,
              COUNT(CASE WHEN grd.modalidad = 'regular' AND grd.segundo_parcial >= 18 THEN 1 END) as aprobados_segundo_parcial,
              COUNT(CASE WHEN grd.modalidad = 'regular' AND grd.segundo_parcial < 18 THEN 1 END) as reprobados_segundo_parcial,
              COUNT(CASE WHEN grd.modalidad = 'regular' AND grd.examen_final >= 15 THEN 1 END) as aprobados_final,
              COUNT(CASE WHEN grd.modalidad = 'regular' AND grd.examen_final < 15 THEN 1 END) as reprobados_final,
              COUNT(CASE WHEN grd.estado = 'aprobado' THEN 1 END) as aprobados,
              COUNT(CASE WHEN grd.estado = 'reprobado' THEN 1 END) as reprobados
       FROM materias m
       LEFT JOIN grade_reports gr ON gr.materia_id = m.id
       LEFT JOIN grade_report_details grd ON grd.acta_id = gr.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios du ON d.usuario_id = du.id
       WHERE m.carrera_id = ?
       GROUP BY m.id, m.nombre, m.codigo, m.grupo, du.nombre, du.apellido
       ORDER BY m.nombre, m.grupo`,
      [carrera.id]
    );

    const [detalleReprobados] = await pool.query(
      `SELECT m.id as materia_id, m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo,
              e.id as estudiante_id, e.codigo_estudiante, u.nombre, u.apellido,
              grd.modalidad, grd.primer_parcial, grd.segundo_parcial, grd.examen_final, grd.nota_final, grd.estado
       FROM materias m
       JOIN grade_reports gr ON gr.materia_id = m.id
       JOIN grade_report_details grd ON grd.acta_id = gr.id
       JOIN estudiantes e ON grd.estudiante_id = e.id
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE m.carrera_id = ?
       ORDER BY m.nombre, m.grupo, u.apellido, u.nombre`,
      [carrera.id]
    );

    const detallePorMateria = new Map();
    detalleReprobados.forEach((row) => {
      if (!detallePorMateria.has(row.materia_id)) {
        detallePorMateria.set(row.materia_id, {
          reprobados_primer_parcial_detalle: [],
          reprobados_segundo_parcial_detalle: [],
          reprobados_final_detalle: [],
          reprobados_total_detalle: []
        });
      }

      const bucket = detallePorMateria.get(row.materia_id);
      const estudiante = {
        estudiante_id: row.estudiante_id,
        codigo_estudiante: row.codigo_estudiante,
        nombre_completo: `${row.apellido} ${row.nombre}`,
        modalidad: row.modalidad,
        primer_parcial: row.primer_parcial,
        segundo_parcial: row.segundo_parcial,
        examen_final: row.examen_final,
        nota_final: row.nota_final,
        estado: row.estado
      };

      if (row.modalidad === 'regular' && Number(row.primer_parcial) < 18) {
        bucket.reprobados_primer_parcial_detalle.push(estudiante);
      }
      if (row.modalidad === 'regular' && Number(row.segundo_parcial) < 18) {
        bucket.reprobados_segundo_parcial_detalle.push(estudiante);
      }
      if (row.modalidad === 'regular' && Number(row.examen_final) < 15) {
        bucket.reprobados_final_detalle.push(estudiante);
      }
      if (row.estado === 'reprobado') {
        bucket.reprobados_total_detalle.push(estudiante);
      }
    });

    const porMateriaConDetalle = porMateria.map((row) => ({
      ...row,
      ...(detallePorMateria.get(row.id) || {
        reprobados_primer_parcial_detalle: [],
        reprobados_segundo_parcial_detalle: [],
        reprobados_final_detalle: [],
        reprobados_total_detalle: []
      })
    }));

    const [reprobadosMasDos] = await pool.query(
      `SELECT e.id, e.codigo_estudiante, u.nombre, u.apellido,
              COUNT(DISTINCT CASE
                WHEN grd.modalidad = 'regular'
                 AND (
                   grd.primer_parcial IS NOT NULL
                   OR grd.segundo_parcial IS NOT NULL
                   OR grd.examen_final IS NOT NULL
                 )
                THEN gr.materia_id
                ELSE NULL
              END) as materias_con_nota,
              COUNT(DISTINCT CASE
                WHEN grd.modalidad = 'regular'
                 AND (
                   COALESCE(grd.primer_parcial, 0) > 0
                   OR COALESCE(grd.segundo_parcial, 0) > 0
                   OR COALESCE(grd.examen_final, 0) > 0
                 )
                THEN gr.materia_id
                ELSE NULL
              END) as materias_con_avance,
              COUNT(DISTINCT CASE
                WHEN grd.modalidad = 'regular' AND grd.primer_parcial IS NOT NULL AND grd.primer_parcial < 18 THEN gr.materia_id
                ELSE NULL
              END) as reprobadas_primer_parcial,
              GROUP_CONCAT(DISTINCT CASE
                WHEN grd.modalidad = 'regular' AND grd.primer_parcial IS NOT NULL AND grd.primer_parcial < 18
                  THEN CONCAT(m.nombre, ' (', m.codigo, ' - G', m.grupo, ')')
                ELSE NULL
              END ORDER BY m.nombre SEPARATOR ' | ') as materias_primer_parcial,
              COUNT(DISTINCT CASE
                WHEN grd.modalidad = 'regular' AND grd.segundo_parcial IS NOT NULL AND grd.segundo_parcial < 18 THEN gr.materia_id
                ELSE NULL
              END) as reprobadas_segundo_parcial,
              GROUP_CONCAT(DISTINCT CASE
                WHEN grd.modalidad = 'regular' AND grd.segundo_parcial IS NOT NULL AND grd.segundo_parcial < 18
                  THEN CONCAT(m.nombre, ' (', m.codigo, ' - G', m.grupo, ')')
                ELSE NULL
              END ORDER BY m.nombre SEPARATOR ' | ') as materias_segundo_parcial,
              COUNT(DISTINCT CASE
                WHEN grd.modalidad = 'regular' AND grd.examen_final IS NOT NULL AND grd.examen_final < 15 THEN gr.materia_id
                ELSE NULL
              END) as reprobadas_final,
              GROUP_CONCAT(DISTINCT CASE
                WHEN grd.modalidad = 'regular' AND grd.examen_final IS NOT NULL AND grd.examen_final < 15
                  THEN CONCAT(m.nombre, ' (', m.codigo, ' - G', m.grupo, ')')
                ELSE NULL
              END ORDER BY m.nombre SEPARATOR ' | ') as materias_final
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN grade_report_details grd ON grd.estudiante_id = e.id
       LEFT JOIN grade_reports gr ON grd.acta_id = gr.id
       LEFT JOIN materias m ON gr.materia_id = m.id
       WHERE e.carrera_id = ?
       GROUP BY e.id, e.codigo_estudiante, u.nombre, u.apellido
       ORDER BY reprobadas_primer_parcial DESC, reprobadas_segundo_parcial DESC, reprobadas_final DESC, u.apellido, u.nombre`,
      [carrera.id]
    );

    const [altoDesempenoRows] = await pool.query(
      `SELECT ranked.*
       FROM (
         SELECT e.id as estudiante_id, e.codigo_estudiante, e.semestre,
                u.nombre, u.apellido,
                m.grupo,
                ROUND(AVG(grd.nota_final), 2) as promedio_general,
                COUNT(DISTINCT gr.materia_id) as materias_evaluadas,
                COUNT(CASE WHEN grd.modalidad = 'regular' AND grd.primer_parcial >= 18 THEN 1 END) as materias_aprobadas_parcial,
                ROW_NUMBER() OVER (
                  PARTITION BY m.grupo
                  ORDER BY AVG(grd.nota_final) DESC, COUNT(CASE WHEN grd.modalidad = 'regular' AND grd.primer_parcial >= 18 THEN 1 END) DESC, u.apellido, u.nombre
                ) as posicion_grupo
         FROM grade_report_details grd
         JOIN grade_reports gr ON grd.acta_id = gr.id
         JOIN materias m ON gr.materia_id = m.id
         JOIN estudiantes e ON grd.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         WHERE e.carrera_id = ?
           AND grd.nota_final IS NOT NULL
         GROUP BY e.id, e.codigo_estudiante, e.semestre, u.nombre, u.apellido, m.grupo
       ) ranked
       WHERE ranked.posicion_grupo <= 10
       ORDER BY ranked.grupo, ranked.posicion_grupo`,
      [carrera.id]
    );

    const altoDesempenoMap = new Map();
    altoDesempenoRows.forEach((row) => {
      const groupKey = row.grupo || 'Sin grupo';
      if (!altoDesempenoMap.has(groupKey)) {
        altoDesempenoMap.set(groupKey, []);
      }
      altoDesempenoMap.get(groupKey).push(row);
    });

    const altoDesempeno = Array.from(altoDesempenoMap.entries())
      .sort(([groupA], [groupB]) => String(groupA).localeCompare(String(groupB)))
      .map(([grupo, estudiantes]) => ({
        grupo,
        estudiantes
      }));

    const resumen = porMateria.reduce((acc, row) => {
      acc.aprobados += Number(row.aprobados || 0);
      acc.reprobados += Number(row.reprobados || 0);
      return acc;
    }, { aprobados: 0, reprobados: 0 });

    res.json({
      nota_aprobacion: PASSING_GRADE,
      modalidades: GRADE_MODALITIES,
      resumen,
      porMateria: porMateriaConDetalle,
      reprobadosMasDos,
      altoDesempeno
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
    await ensureGradeReportSchema();
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

    const [notas] = await pool.query(
      `SELECT m.id as materia_id, m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo,
              gr.periodo, grd.modalidad, grd.primer_parcial, grd.segundo_parcial, grd.examen_final,
              grd.examen_recuperacion, grd.nota_final, grd.estado,
              ud.nombre as docente_nombre, ud.apellido as docente_apellido
       FROM grade_report_details grd
       JOIN grade_reports gr ON grd.acta_id = gr.id
       JOIN materias m ON gr.materia_id = m.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios ud ON d.usuario_id = ud.id
       WHERE grd.estudiante_id = ?
       ORDER BY gr.periodo DESC, m.nombre, m.grupo`,
      [id]
    );

    const resumenNotas = notas.reduce((acc, item) => {
      acc.total_materias += 1;
      if (item.estado === 'aprobado') acc.aprobadas += 1;
      if (item.estado === 'reprobado') acc.reprobadas += 1;
      return acc;
    }, { total_materias: 0, aprobadas: 0, reprobadas: 0 });

    res.json({
      estudiante: est,
      materias,
      materiasDisponibles,
      asistencias,
      asistenciasDetalle,
      cursos,
      comentarios,
      disciplina,
      notas,
      resumenNotas
    });
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
      `SELECT h.*, m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo,
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

export const actualizarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const { materia_id, docente_id, dia_semana, hora_inicio, hora_fin, aula, periodo } = req.body;
    await pool.query(
      `UPDATE horarios
       SET materia_id = ?, docente_id = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?, aula = ?, periodo = ?
       WHERE id = ?`,
      [materia_id, docente_id, dia_semana, hora_inicio, hora_fin, aula, periodo, id]
    );
    res.json({ message: 'Horario actualizado' });
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
