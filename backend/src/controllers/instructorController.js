import pool from '../config/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Obtener el registro de instructor del usuario logueado
const getInstructor = async (userId) => {
  const [[row]] = await pool.query('SELECT * FROM instructores_cursos WHERE usuario_id = ?', [userId]);
  return row ?? null;
};

// ── Mis cursos ────────────────────────────────────────────────────────────────
export const misCursos = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [cursos] = await pool.query(`
      SELECT ce.*,
        (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id=ce.id AND i.estado='aprobado') AS aprobados
      FROM cursos_especiales ce
      WHERE ce.instructor_id = ? AND ce.activo = 1
      ORDER BY ce.created_at DESC
    `, [inst.id]);

    res.json(cursos);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Participantes (estudiantes aprobados) ─────────────────────────────────────
export const participantes = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) return res.status(403).json({ error: 'Curso no asignado a este instructor' });

    const [rows] = await pool.query(`
      SELECT e.id AS estudiante_id, u.nombre, u.apellido, u.email, e.codigo_estudiante, e.semestre,
        i.fecha_inscripcion
      FROM inscripciones_cursos_especiales i
      JOIN estudiantes e ON e.id = i.estudiante_id
      JOIN usuarios u ON u.id = e.usuario_id
      WHERE i.curso_id = ? AND i.estado = 'aprobado'
      ORDER BY u.apellido, u.nombre
    `, [req.params.cursoId]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Material ──────────────────────────────────────────────────────────────────
export const listarMaterial = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) return res.status(403).json({ error: 'Acceso denegado' });

    const [rows] = await pool.query(
      'SELECT * FROM material_cursos_especiales WHERE curso_id=? ORDER BY created_at DESC',
      [req.params.cursoId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const subirMaterial = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const titulo = req.body.titulo?.trim() || req.file.originalname;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const [r] = await pool.query(
      'INSERT INTO material_cursos_especiales (curso_id, titulo, archivo_path, tipo_archivo, creado_por) VALUES (?,?,?,?,?)',
      [req.params.cursoId, titulo, req.file.filename, ext.slice(1), req.user.id]
    );
    const [[row]] = await pool.query('SELECT * FROM material_cursos_especiales WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const agregarEnlace = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) return res.status(403).json({ error: 'Acceso denegado' });

    const { titulo, url } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });
    if (!url?.trim())    return res.status(400).json({ error: 'La URL es obligatoria' });

    const [r] = await pool.query(
      'INSERT INTO material_cursos_especiales (curso_id, titulo, tipo_material, url, creado_por) VALUES (?,?,?,?,?)',
      [req.params.cursoId, titulo.trim(), 'enlace', url.trim(), req.user.id]
    );
    const [[row]] = await pool.query('SELECT * FROM material_cursos_especiales WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const eliminarMaterial = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[mat]] = await pool.query(`
      SELECT m.* FROM material_cursos_especiales m
      JOIN cursos_especiales ce ON ce.id = m.curso_id
      WHERE m.id=? AND ce.instructor_id=?
    `, [req.params.materialId, inst.id]);
    if (!mat) return res.status(404).json({ error: 'Material no encontrado' });

    await fs.unlink(path.resolve('uploads', mat.archivo_path)).catch(() => {});
    await pool.query('DELETE FROM material_cursos_especiales WHERE id=?', [req.params.materialId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Asistencia ────────────────────────────────────────────────────────────────
export const listarFechasAsistencia = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) return res.status(403).json({ error: 'Acceso denegado' });

    const [fechas] = await pool.query(
      'SELECT DISTINCT fecha FROM asistencia_cursos_especiales WHERE curso_id=? ORDER BY fecha DESC',
      [req.params.cursoId]
    );
    res.json(fechas.map(f => f.fecha));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const listarAsistencia = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) return res.status(403).json({ error: 'Acceso denegado' });

    const [estudiantes] = await pool.query(`
      SELECT e.id AS estudiante_id, u.nombre, u.apellido, e.codigo_estudiante
      FROM inscripciones_cursos_especiales i
      JOIN estudiantes e ON e.id = i.estudiante_id
      JOIN usuarios u ON u.id = e.usuario_id
      WHERE i.curso_id=? AND i.estado='aprobado'
      ORDER BY u.apellido, u.nombre
    `, [req.params.cursoId]);

    const fecha = req.query.fecha;
    let asistMap = {};
    if (fecha) {
      const [rows] = await pool.query(
        'SELECT * FROM asistencia_cursos_especiales WHERE curso_id=? AND fecha=?',
        [req.params.cursoId, fecha]
      );
      rows.forEach(a => { asistMap[a.estudiante_id] = a.estado; });
    }

    res.json(estudiantes.map(e => ({ ...e, estado: asistMap[e.estudiante_id] || null })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const registrarAsistencia = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) return res.status(403).json({ error: 'Acceso denegado' });

    const { fecha, registros } = req.body;
    if (!fecha || !Array.isArray(registros)) return res.status(400).json({ error: 'fecha y registros requeridos' });

    for (const r of registros) {
      await pool.query(`
        INSERT INTO asistencia_cursos_especiales (curso_id, estudiante_id, fecha, estado, registrado_por)
        VALUES (?,?,?,?,?)
        ON DUPLICATE KEY UPDATE estado=VALUES(estado), registrado_por=VALUES(registrado_por)
      `, [req.params.cursoId, r.estudiante_id, fecha, r.estado, req.user.id]);
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Notas ─────────────────────────────────────────────────────────────────────
export const listarNotas = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) return res.status(403).json({ error: 'Acceso denegado' });

    const [rows] = await pool.query(`
      SELECT e.id AS estudiante_id, u.nombre, u.apellido, e.codigo_estudiante,
        n.nota, n.descripcion
      FROM inscripciones_cursos_especiales i
      JOIN estudiantes e ON e.id = i.estudiante_id
      JOIN usuarios u ON u.id = e.usuario_id
      LEFT JOIN notas_cursos_especiales n ON n.curso_id=i.curso_id AND n.estudiante_id=i.estudiante_id
      WHERE i.curso_id=? AND i.estado='aprobado'
      ORDER BY u.apellido, u.nombre
    `, [req.params.cursoId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const guardarNotas = async (req, res) => {
  try {
    const inst = await getInstructor(req.user.id);
    if (!inst) return res.status(404).json({ error: 'Instructor no encontrado' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND instructor_id=?', [req.params.cursoId, inst.id]);
    if (!curso) return res.status(403).json({ error: 'Acceso denegado' });

    const { notas } = req.body;
    if (!Array.isArray(notas)) return res.status(400).json({ error: 'notas[] requerido' });

    for (const n of notas) {
      await pool.query(`
        INSERT INTO notas_cursos_especiales (curso_id, estudiante_id, nota, descripcion, registrado_por)
        VALUES (?,?,?,?,?)
        ON DUPLICATE KEY UPDATE nota=VALUES(nota), descripcion=VALUES(descripcion), registrado_por=VALUES(registrado_por)
      `, [req.params.cursoId, n.estudiante_id, n.nota ?? null, n.descripcion || null, req.user.id]);
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
