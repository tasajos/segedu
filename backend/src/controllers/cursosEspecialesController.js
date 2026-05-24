import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Auto-create tables if needed ────────────────────────────────────────────
let schemaReady = false;
export const initSchema = async () => { try { await ready(); } catch (e) { console.error('initSchema error:', e.message); } };
const ready = async () => {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cursos_especiales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(200) NOT NULL,
      descripcion TEXT,
      requisitos TEXT,
      max_estudiantes INT NOT NULL DEFAULT 30,
      carrera_id INT NULL,
      instructor_id INT NULL,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      creado_por INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id)
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS instructores_cursos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100),
      email VARCHAR(150),
      especialidad VARCHAR(200),
      carrera_id INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inscripciones_cursos_especiales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      curso_id INT NOT NULL,
      estudiante_id INT NOT NULL,
      estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
      fecha_inscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (curso_id)      REFERENCES cursos_especiales(id) ON DELETE CASCADE,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
      UNIQUE KEY uq_inscripcion (curso_id, estudiante_id)
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS material_cursos_especiales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      curso_id INT NOT NULL,
      titulo VARCHAR(200) NOT NULL,
      tipo_material ENUM('archivo','enlace') NOT NULL DEFAULT 'archivo',
      url VARCHAR(500) NULL,
      archivo_path VARCHAR(500) NULL,
      tipo_archivo VARCHAR(50) NULL,
      creado_por INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (curso_id)   REFERENCES cursos_especiales(id) ON DELETE CASCADE,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id)
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS asistencia_cursos_especiales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      curso_id INT NOT NULL,
      estudiante_id INT NOT NULL,
      fecha DATE NOT NULL,
      estado ENUM('presente','falta','permiso') NOT NULL DEFAULT 'presente',
      registrado_por INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_asist (curso_id, estudiante_id, fecha),
      FOREIGN KEY (curso_id)       REFERENCES cursos_especiales(id) ON DELETE CASCADE,
      FOREIGN KEY (estudiante_id)  REFERENCES estudiantes(id) ON DELETE CASCADE,
      FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notas_cursos_especiales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      curso_id INT NOT NULL,
      estudiante_id INT NOT NULL,
      nota DECIMAL(5,2),
      descripcion TEXT,
      registrado_por INT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_nota (curso_id, estudiante_id),
      FOREIGN KEY (curso_id)       REFERENCES cursos_especiales(id) ON DELETE CASCADE,
      FOREIGN KEY (estudiante_id)  REFERENCES estudiantes(id) ON DELETE CASCADE,
      FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
    )`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tareas_cursos_especiales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      curso_id INT NOT NULL,
      titulo VARCHAR(200) NOT NULL,
      descripcion TEXT,
      fecha_entrega DATETIME NULL,
      archivo_nombre VARCHAR(300) NULL,
      archivo_path VARCHAR(500) NULL,
      tipo_archivo ENUM('pdf','word') NULL,
      creado_por INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (curso_id) REFERENCES cursos_especiales(id) ON DELETE CASCADE,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id)
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS entregas_tareas_cursos_especiales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tarea_id INT NOT NULL,
      estudiante_id INT NOT NULL,
      archivo_nombre VARCHAR(300) NOT NULL,
      archivo_path VARCHAR(500) NOT NULL,
      fecha_entrega DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      calificacion DECIMAL(4,2) NULL,
      comentario_calificacion TEXT NULL,
      fecha_calificacion DATETIME NULL,
      visto_por_instructor TINYINT(1) NOT NULL DEFAULT 0,
      UNIQUE KEY uq_entrega_esp (tarea_id, estudiante_id),
      FOREIGN KEY (tarea_id) REFERENCES tareas_cursos_especiales(id) ON DELETE CASCADE,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
    )`);

  // Add columns if missing (idempotent upgrades)
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inscripciones_cursos_especiales'`
  );
  const colSet = new Set(cols.map(c => c.COLUMN_NAME));
  if (!colSet.has('estado')) {
    await pool.query(`ALTER TABLE inscripciones_cursos_especiales
      ADD COLUMN estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente'
      AFTER estudiante_id`);
  }
  const [ceCol] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos_especiales'`
  );
  const ceSet = new Set(ceCol.map(c => c.COLUMN_NAME));
  if (!ceSet.has('instructor_id')) {
    await pool.query(`ALTER TABLE cursos_especiales ADD COLUMN instructor_id INT NULL AFTER carrera_id`);
  }
  if (!ceSet.has('publico_general')) {
    await pool.query(`ALTER TABLE cursos_especiales ADD COLUMN publico_general TINYINT(1) NOT NULL DEFAULT 0 AFTER activo`);
  }

  // Columnas de enlace en material
  const [matCol] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'material_cursos_especiales'`
  );
  const matSet = new Set(matCol.map(c => c.COLUMN_NAME));
  if (!matSet.has('tipo_material')) {
    await pool.query(`ALTER TABLE material_cursos_especiales
      ADD COLUMN tipo_material ENUM('archivo','enlace') NOT NULL DEFAULT 'archivo' AFTER titulo,
      ADD COLUMN url VARCHAR(500) NULL AFTER tipo_material`);
  }

  schemaReady = true;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const resolveFilePath = (archivoPath) => {
  if (!archivoPath) return null;
  const fileName = path.basename(archivoPath);
  const candidates = [
    path.resolve(process.cwd(), 'uploads', fileName),
    path.resolve(process.cwd(), 'backend', 'uploads', fileName),
    path.resolve(__dirname, '..', '..', 'uploads', fileName),
  ];
  return candidates.find(c => existsSync(c)) || null;
};

const getCarreraJefe = async (userId) => {
  const [[row]] = await pool.query('SELECT id FROM carreras WHERE jefe_id = ?', [userId]);
  return row?.id ?? null;
};
const getEstudiante = async (userId) => {
  const [[row]] = await pool.query('SELECT id, carrera_id FROM estudiantes WHERE usuario_id = ?', [userId]);
  return row ?? null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// JEFE
// ═══════════════════════════════════════════════════════════════════════════════

export const listarCursosJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [cursos] = await pool.query(`
      SELECT ce.*,
        ic.nombre AS instructor_nombre, ic.apellido AS instructor_apellido,
        (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id = ce.id) AS inscritos,
        (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id = ce.id AND i.estado = 'pendiente') AS pendientes,
        (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id = ce.id AND i.estado = 'aprobado') AS aprobados
      FROM cursos_especiales ce
      LEFT JOIN instructores_cursos ic ON ic.id = ce.instructor_id
      WHERE ce.carrera_id = ?
      ORDER BY ce.created_at DESC
    `, [carreraId]);

    res.json(cursos);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const detalleCursoJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query(`
      SELECT ce.*,
        ic.nombre AS instructor_nombre, ic.apellido AS instructor_apellido,
        ic.email AS instructor_email, ic.especialidad AS instructor_especialidad,
        (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id = ce.id) AS inscritos,
        (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id = ce.id AND i.estado = 'aprobado') AS aprobados
      FROM cursos_especiales ce
      LEFT JOIN instructores_cursos ic ON ic.id = ce.instructor_id
      WHERE ce.id = ? AND ce.carrera_id = ?
    `, [req.params.id, carreraId]);

    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(curso);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const crearCursoJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const { nombre, descripcion, requisitos, max_estudiantes, publico_general } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const [r] = await pool.query(
      `INSERT INTO cursos_especiales (nombre, descripcion, requisitos, max_estudiantes, carrera_id, publico_general, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), descripcion || null, requisitos || null, max_estudiantes || 30, carreraId, publico_general ? 1 : 0, req.user.id]
    );
    const [[curso]] = await pool.query('SELECT * FROM cursos_especiales WHERE id = ?', [r.insertId]);
    res.status(201).json(curso);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const actualizarCursoJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const { id } = req.params;
    const [[curso]] = await pool.query('SELECT * FROM cursos_especiales WHERE id = ? AND carrera_id = ?', [id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const { nombre, descripcion, requisitos, max_estudiantes, activo, publico_general } = req.body;
    await pool.query(`
      UPDATE cursos_especiales
      SET nombre=?, descripcion=?, requisitos=?, max_estudiantes=?, activo=?, publico_general=?
      WHERE id=?
    `, [
      nombre?.trim() ?? curso.nombre,
      descripcion !== undefined ? descripcion : curso.descripcion,
      requisitos  !== undefined ? requisitos  : curso.requisitos,
      max_estudiantes ?? curso.max_estudiantes,
      activo !== undefined ? activo : curso.activo,
      publico_general !== undefined ? (publico_general ? 1 : 0) : curso.publico_general,
      id
    ]);

    const [[updated]] = await pool.query(`
      SELECT ce.*, (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id=ce.id) AS inscritos
      FROM cursos_especiales ce WHERE ce.id=?
    `, [id]);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const eliminarCursoJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [r] = await pool.query('DELETE FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Inscritos ────────────────────────────────────────────────────────────────

export const listarInscritosJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const [rows] = await pool.query(`
      SELECT i.id, i.estado, i.fecha_inscripcion,
        e.id AS estudiante_id, u.nombre, u.apellido, u.email,
        e.semestre, e.codigo_estudiante
      FROM inscripciones_cursos_especiales i
      JOIN estudiantes e ON e.id = i.estudiante_id
      JOIN usuarios u ON u.id = e.usuario_id
      WHERE i.curso_id = ?
      ORDER BY i.fecha_inscripcion
    `, [req.params.id]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const actualizarInscripcionJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const { estado } = req.body;
    if (!['aprobado','rechazado','pendiente'].includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const [[ins]] = await pool.query(`
      SELECT i.id FROM inscripciones_cursos_especiales i
      JOIN cursos_especiales ce ON ce.id = i.curso_id
      WHERE i.id = ? AND ce.carrera_id = ?
    `, [req.params.inscripcionId, carreraId]);
    if (!ins) return res.status(404).json({ error: 'Inscripción no encontrada' });

    await pool.query('UPDATE inscripciones_cursos_especiales SET estado=? WHERE id=?', [estado, req.params.inscripcionId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Instructores ─────────────────────────────────────────────────────────────

export const listarInstructoresJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [rows] = await pool.query(
      'SELECT * FROM instructores_cursos WHERE carrera_id=? ORDER BY nombre',
      [carreraId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const crearInstructorJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const { nombre, apellido, email, especialidad, password } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!email?.trim()) return res.status(400).json({ error: 'El email es obligatorio' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    // Verificar email único
    const [[existe]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email.trim()]);
    if (existe) return res.status(400).json({ error: 'Ya existe un usuario con ese email' });

    // Crear usuario con rol instructor
    const hash = await bcrypt.hash(password, 10);
    const [uResult] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES (?,?,?,?,?)',
      [nombre.trim(), apellido || null, email.trim(), hash, 'instructor']
    );
    const usuarioId = uResult.insertId;

    // Crear registro de instructor
    const [r] = await pool.query(
      'INSERT INTO instructores_cursos (usuario_id, nombre, apellido, email, especialidad, carrera_id) VALUES (?,?,?,?,?,?)',
      [usuarioId, nombre.trim(), apellido || null, email.trim(), especialidad || null, carreraId]
    );
    const [[row]] = await pool.query('SELECT * FROM instructores_cursos WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const asignarInstructorJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const { instructor_id } = req.body;
    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    await pool.query('UPDATE cursos_especiales SET instructor_id=? WHERE id=?', [instructor_id || null, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Material ─────────────────────────────────────────────────────────────────

export const listarMaterialJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const [rows] = await pool.query(
      'SELECT * FROM material_cursos_especiales WHERE curso_id=? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const subirMaterialJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) { if (req.file) await fs.unlink(req.file.path).catch(()=>{}); return res.status(404).json({ error: 'Curso no encontrado' }); }

    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const titulo = req.body.titulo?.trim() || req.file.originalname;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const [r] = await pool.query(
      'INSERT INTO material_cursos_especiales (curso_id, titulo, archivo_path, tipo_archivo, creado_por) VALUES (?,?,?,?,?)',
      [req.params.id, titulo, req.file.filename, ext.slice(1), req.user.id]
    );
    const [[row]] = await pool.query('SELECT * FROM material_cursos_especiales WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const agregarEnlaceJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const { titulo, url } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });
    if (!url?.trim())    return res.status(400).json({ error: 'La URL es obligatoria' });

    const [r] = await pool.query(
      'INSERT INTO material_cursos_especiales (curso_id, titulo, tipo_material, url, creado_por) VALUES (?,?,?,?,?)',
      [req.params.id, titulo.trim(), 'enlace', url.trim(), req.user.id]
    );
    const [[row]] = await pool.query('SELECT * FROM material_cursos_especiales WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const eliminarMaterialJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[mat]] = await pool.query(`
      SELECT m.* FROM material_cursos_especiales m
      JOIN cursos_especiales ce ON ce.id = m.curso_id
      WHERE m.id=? AND ce.carrera_id=?
    `, [req.params.materialId, carreraId]);
    if (!mat) return res.status(404).json({ error: 'Material no encontrado' });

    await fs.unlink(path.resolve('uploads', mat.archivo_path)).catch(() => {});
    await pool.query('DELETE FROM material_cursos_especiales WHERE id=?', [req.params.materialId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Asistencia ───────────────────────────────────────────────────────────────

export const listarFechasAsistenciaJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const [fechas] = await pool.query(
      'SELECT DISTINCT fecha FROM asistencia_cursos_especiales WHERE curso_id=? ORDER BY fecha DESC',
      [req.params.id]
    );
    res.json(fechas.map(f => f.fecha));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const listarAsistenciaJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    // Approved students
    const [estudiantes] = await pool.query(`
      SELECT e.id AS estudiante_id, u.nombre, u.apellido, e.codigo_estudiante
      FROM inscripciones_cursos_especiales i
      JOIN estudiantes e ON e.id = i.estudiante_id
      JOIN usuarios u ON u.id = e.usuario_id
      WHERE i.curso_id=? AND i.estado='aprobado'
      ORDER BY u.apellido, u.nombre
    `, [req.params.id]);

    // Attendance for the selected date or all
    const fecha = req.query.fecha;
    let asistencias = [];
    if (fecha) {
      const [rows] = await pool.query(
        'SELECT * FROM asistencia_cursos_especiales WHERE curso_id=? AND fecha=?',
        [req.params.id, fecha]
      );
      asistencias = rows;
    }

    const asistMap = {};
    asistencias.forEach(a => { asistMap[a.estudiante_id] = a.estado; });

    res.json(estudiantes.map(e => ({
      ...e,
      estado: asistMap[e.estudiante_id] || null
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const registrarAsistenciaJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const { fecha, registros } = req.body;
    if (!fecha || !Array.isArray(registros)) return res.status(400).json({ error: 'fecha y registros son requeridos' });

    for (const r of registros) {
      await pool.query(`
        INSERT INTO asistencia_cursos_especiales (curso_id, estudiante_id, fecha, estado, registrado_por)
        VALUES (?,?,?,?,?)
        ON DUPLICATE KEY UPDATE estado=VALUES(estado), registrado_por=VALUES(registrado_por)
      `, [req.params.id, r.estudiante_id, fecha, r.estado, req.user.id]);
    }

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Notas ────────────────────────────────────────────────────────────────────

export const listarNotasJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const [estudiantes] = await pool.query(`
      SELECT e.id AS estudiante_id, u.nombre, u.apellido, e.codigo_estudiante,
        n.nota, n.descripcion
      FROM inscripciones_cursos_especiales i
      JOIN estudiantes e ON e.id = i.estudiante_id
      JOIN usuarios u ON u.id = e.usuario_id
      LEFT JOIN notas_cursos_especiales n ON n.curso_id=i.curso_id AND n.estudiante_id=i.estudiante_id
      WHERE i.curso_id=? AND i.estado='aprobado'
      ORDER BY u.apellido, u.nombre
    `, [req.params.id]);

    res.json(estudiantes);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const guardarNotasJefe = async (req, res) => {
  try {
    await ready();
    const carreraId = await getCarreraJefe(req.user.id);
    if (!carreraId) return res.status(404).json({ error: 'Sin carrera asignada' });

    const [[curso]] = await pool.query('SELECT id FROM cursos_especiales WHERE id=? AND carrera_id=?', [req.params.id, carreraId]);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const { notas } = req.body;
    if (!Array.isArray(notas)) return res.status(400).json({ error: 'notas[] requerido' });

    for (const n of notas) {
      await pool.query(`
        INSERT INTO notas_cursos_especiales (curso_id, estudiante_id, nota, descripcion, registrado_por)
        VALUES (?,?,?,?,?)
        ON DUPLICATE KEY UPDATE nota=VALUES(nota), descripcion=VALUES(descripcion), registrado_por=VALUES(registrado_por)
      `, [req.params.id, n.estudiante_id, n.nota ?? null, n.descripcion || null, req.user.id]);
    }

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ESTUDIANTE
// ═══════════════════════════════════════════════════════════════════════════════

export const listarCursosEstudiante = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [cursos] = await pool.query(`
      SELECT ce.*,
        ic.nombre AS instructor_nombre, ic.apellido AS instructor_apellido, ic.especialidad AS instructor_especialidad,
        (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id=ce.id AND i.estado='aprobado') AS inscritos,
        (SELECT COUNT(*) FROM inscripciones_cursos_especiales i WHERE i.curso_id=ce.id AND i.estudiante_id=? ) AS inscrito_yo,
        (SELECT i.estado FROM inscripciones_cursos_especiales i WHERE i.curso_id=ce.id AND i.estudiante_id=? LIMIT 1) AS mi_estado
      FROM cursos_especiales ce
      LEFT JOIN instructores_cursos ic ON ic.id = ce.instructor_id
      WHERE ce.activo=1 AND (ce.carrera_id=? OR ce.publico_general=1)
      ORDER BY ce.created_at DESC
    `, [est.id, est.id, est.carrera_id]);

    res.json(cursos);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const inscribirseEnCurso = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [[curso]] = await pool.query('SELECT * FROM cursos_especiales WHERE id=? AND activo=1 AND (carrera_id=? OR publico_general=1)', [req.params.id, est.carrera_id]);
    if (!curso) return res.status(404).json({ error: 'Curso no disponible' });

    // Verificar registro existente antes de insertar
    const [[existing]] = await pool.query(
      'SELECT estado FROM inscripciones_cursos_especiales WHERE curso_id=? AND estudiante_id=?',
      [req.params.id, est.id]
    );

    if (existing) {
      if (existing.estado === 'aprobado') return res.status(400).json({ error: 'Ya estás inscrito y aprobado en este curso' });
      if (existing.estado === 'pendiente') return res.status(400).json({ error: 'Ya tienes una solicitud pendiente de aprobación' });
      // estado === 'rechazado': permitir re-solicitud
      await pool.query(
        'UPDATE inscripciones_cursos_especiales SET estado=? WHERE curso_id=? AND estudiante_id=?',
        ['pendiente', req.params.id, est.id]
      );
    } else {
      const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM inscripciones_cursos_especiales WHERE curso_id=? AND estado != ?', [req.params.id, 'rechazado']);
      if (total >= curso.max_estudiantes) return res.status(400).json({ error: 'Curso lleno' });

      await pool.query(
        'INSERT INTO inscripciones_cursos_especiales (curso_id, estudiante_id, estado) VALUES (?,?,?)',
        [req.params.id, est.id, 'pendiente']
      );
    }

    res.status(201).json({ ok: true, estado: 'pendiente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelarInscripcion = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [r] = await pool.query(
      'DELETE FROM inscripciones_cursos_especiales WHERE curso_id=? AND estudiante_id=?',
      [req.params.id, est.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Inscripción no encontrada' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const misCursosAprobados = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [cursos] = await pool.query(`
      SELECT ce.*,
        ic.nombre AS instructor_nombre, ic.apellido AS instructor_apellido, ic.especialidad AS instructor_especialidad
      FROM inscripciones_cursos_especiales i
      JOIN cursos_especiales ce ON ce.id = i.curso_id
      LEFT JOIN instructores_cursos ic ON ic.id = ce.instructor_id
      WHERE i.estudiante_id=? AND i.estado='aprobado'
      ORDER BY i.fecha_inscripcion DESC
    `, [est.id]);

    res.json(cursos);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const materialCursoEstudiante = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    // Verify student is approved
    const [[ins]] = await pool.query(
      `SELECT id FROM inscripciones_cursos_especiales WHERE curso_id=? AND estudiante_id=? AND estado='aprobado'`,
      [req.params.id, est.id]
    );
    if (!ins) return res.status(403).json({ error: 'No tienes acceso a este curso' });

    const [rows] = await pool.query(
      'SELECT * FROM material_cursos_especiales WHERE curso_id=? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const miAsistenciaCurso = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [[ins]] = await pool.query(
      `SELECT id FROM inscripciones_cursos_especiales WHERE curso_id=? AND estudiante_id=? AND estado='aprobado'`,
      [req.params.id, est.id]
    );
    if (!ins) return res.status(403).json({ error: 'No tienes acceso a este curso' });

    const [rows] = await pool.query(
      'SELECT fecha, estado FROM asistencia_cursos_especiales WHERE curso_id=? AND estudiante_id=? ORDER BY fecha DESC',
      [req.params.id, est.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const misNotasCurso = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [[ins]] = await pool.query(
      `SELECT id FROM inscripciones_cursos_especiales WHERE curso_id=? AND estudiante_id=? AND estado='aprobado'`,
      [req.params.id, est.id]
    );
    if (!ins) return res.status(403).json({ error: 'No tienes acceso a este curso' });

    const [[nota]] = await pool.query(
      'SELECT nota, descripcion FROM notas_cursos_especiales WHERE curso_id=? AND estudiante_id=?',
      [req.params.id, est.id]
    );
    res.json(nota || { nota: null, descripcion: null });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ESTUDIANTE — TAREAS DE CURSOS ESPECIALES
// ═══════════════════════════════════════════════════════════════════════════════

export const listarTareasEspecialEst = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [[ins]] = await pool.query(
      `SELECT id FROM inscripciones_cursos_especiales WHERE curso_id=? AND estudiante_id=? AND estado='aprobado'`,
      [req.params.id, est.id]
    );
    if (!ins) return res.status(403).json({ error: 'No tienes acceso a este curso' });

    const [rows] = await pool.query(`
      SELECT t.*,
        e.id AS entrega_id, e.calificacion, e.fecha_entrega AS fecha_mi_entrega,
        e.comentario_calificacion, e.archivo_nombre AS entrega_nombre
      FROM tareas_cursos_especiales t
      LEFT JOIN entregas_tareas_cursos_especiales e ON e.tarea_id=t.id AND e.estudiante_id=?
      WHERE t.curso_id=?
      ORDER BY t.created_at DESC
    `, [est.id, req.params.id]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const verArchivoTareaEspecialEst = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [[ins]] = await pool.query(
      `SELECT id FROM inscripciones_cursos_especiales WHERE curso_id=? AND estudiante_id=? AND estado='aprobado'`,
      [req.params.id, est.id]
    );
    if (!ins) return res.status(403).json({ error: 'No tienes acceso a este curso' });

    const [[tarea]] = await pool.query(
      'SELECT * FROM tareas_cursos_especiales WHERE id=? AND curso_id=?',
      [req.params.tareaId, req.params.id]
    );
    if (!tarea || !tarea.archivo_path) return res.status(404).json({ error: 'Archivo no encontrado' });

    const filePath = resolveFilePath(tarea.archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible' });

    const ext = path.extname(tarea.archivo_nombre).toLowerCase();
    const mime = ext === '.pdf' ? 'application/pdf'
      : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/msword';

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(tarea.archivo_nombre)}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    createReadStream(filePath).pipe(res);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const entregarTareaEspecialEst = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [[ins]] = await pool.query(
      `SELECT id FROM inscripciones_cursos_especiales WHERE curso_id=? AND estudiante_id=? AND estado='aprobado'`,
      [req.params.id, est.id]
    );
    if (!ins) return res.status(403).json({ error: 'No tienes acceso a este curso' });

    const [[tarea]] = await pool.query(
      'SELECT id FROM tareas_cursos_especiales WHERE id=? AND curso_id=?',
      [req.params.tareaId, req.params.id]
    );
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    if (!req.file) return res.status(400).json({ error: 'Debe adjuntar un archivo Word (.doc/.docx) o PDF' });

    await pool.query(
      `INSERT INTO entregas_tareas_cursos_especiales
         (tarea_id, estudiante_id, archivo_nombre, archivo_path, visto_por_instructor)
       VALUES (?,?,?,?,0)
       ON DUPLICATE KEY UPDATE
         archivo_nombre=VALUES(archivo_nombre), archivo_path=VALUES(archivo_path),
         fecha_entrega=NOW(), calificacion=NULL, comentario_calificacion=NULL,
         fecha_calificacion=NULL, visto_por_instructor=0`,
      [req.params.tareaId, est.id, req.file.originalname, `/uploads/${req.file.filename}`]
    );
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const miEntregaTareaEspecialEst = async (req, res) => {
  try {
    await ready();
    const est = await getEstudiante(req.user.id);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const [[row]] = await pool.query(
      'SELECT * FROM entregas_tareas_cursos_especiales WHERE tarea_id=? AND estudiante_id=?',
      [req.params.tareaId, est.id]
    );
    res.json(row || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
