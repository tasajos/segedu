import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const _storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'qa');
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const _multer = multer({
  storage: _storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
}).array('images', 10);

export const uploadBugImages = (req, res, next) =>
  _multer(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });

let schemaReady = false;

export const initQASchema = async () => {
  try { await ensureSchema(); } catch (e) { console.error('initQASchema error:', e.message); }
};

const ensureSchema = async () => {
  if (schemaReady) return;

  // ── Migraciones ENUM ──────────────────────────────────────────────────────
  await pool.query(`ALTER TABLE qa_test_cases MODIFY COLUMN estado ENUM('no_ejecutado','pasado','fallido','bloqueado','na') NOT NULL DEFAULT 'no_ejecutado'`).catch(() => {});
  await pool.query(`ALTER TABLE qa_bugs MODIFY COLUMN estado ENUM('nuevo','abierto','en_progreso','pending_testing','resuelto','cerrado','rechazado') NOT NULL DEFAULT 'nuevo'`).catch(() => {});

  // ── Nuevas columnas en qa_bugs ─────────────────────────────────────────────
  await pool.query(`ALTER TABLE qa_bugs ADD COLUMN asignado_qa_id INT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE qa_bugs ADD COLUMN enviado_testing_por INT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE qa_bugs ADD CONSTRAINT fk_bug_asignado_qa FOREIGN KEY (asignado_qa_id) REFERENCES usuarios(id) ON DELETE SET NULL`).catch(() => {});
  await pool.query(`ALTER TABLE qa_bugs ADD CONSTRAINT fk_bug_enviado_testing FOREIGN KEY (enviado_testing_por) REFERENCES usuarios(id) ON DELETE SET NULL`).catch(() => {});

  // ── Tablas principales ────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qa_bugs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(300) NOT NULL,
      descripcion TEXT,
      pasos_reproduccion TEXT,
      resultado_esperado TEXT,
      resultado_actual TEXT,
      severidad ENUM('critica','alta','media','baja') NOT NULL DEFAULT 'media',
      prioridad ENUM('alta','media','baja') NOT NULL DEFAULT 'media',
      estado ENUM('nuevo','abierto','en_progreso','pending_testing','resuelto','cerrado','rechazado') NOT NULL DEFAULT 'nuevo',
      tipo ENUM('funcional','ui','rendimiento','seguridad','usabilidad','otro') NOT NULL DEFAULT 'funcional',
      ambiente ENUM('desarrollo','qa','staging','produccion') NOT NULL DEFAULT 'qa',
      reportado_por INT NOT NULL,
      asignado_qa_id INT NULL,
      enviado_testing_por INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reportado_por) REFERENCES usuarios(id),
      FOREIGN KEY (asignado_qa_id) REFERENCES usuarios(id) ON DELETE SET NULL,
      FOREIGN KEY (enviado_testing_por) REFERENCES usuarios(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qa_test_cases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(300) NOT NULL,
      descripcion TEXT,
      precondiciones TEXT,
      pasos JSON NOT NULL,
      resultado_esperado TEXT NOT NULL,
      prioridad ENUM('alta','media','baja') NOT NULL DEFAULT 'media',
      categoria VARCHAR(100),
      estado ENUM('no_ejecutado','pasado','fallido','bloqueado','na') NOT NULL DEFAULT 'no_ejecutado',
      resultado_actual TEXT NULL,
      creado_por INT NOT NULL,
      ejecutado_por INT NULL,
      ejecutado_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id),
      FOREIGN KEY (ejecutado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qa_bug_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bug_id INT NOT NULL,
      usuario_id INT NOT NULL,
      rol_sesion VARCHAR(10) NOT NULL DEFAULT 'QA',
      comentario TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bug_id) REFERENCES qa_bugs(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qa_equipos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(200) NOT NULL,
      descripcion TEXT,
      creado_por INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qa_bug_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bug_id INT NOT NULL,
      filename VARCHAR(300) NOT NULL,
      original_name VARCHAR(300) NOT NULL,
      subido_por INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bug_id) REFERENCES qa_bugs(id) ON DELETE CASCADE,
      FOREIGN KEY (subido_por) REFERENCES usuarios(id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qa_equipo_miembros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      equipo_id INT NOT NULL,
      usuario_id INT NOT NULL,
      rol_equipo ENUM('QA','DEV') NOT NULL DEFAULT 'QA',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipo_id) REFERENCES qa_equipos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE KEY uq_miembro (equipo_id, usuario_id)
    )
  `);
  schemaReady = true;
};

// ─── Helper SELECT ────────────────────────────────────────────────────────────
const BUG_SELECT = `
  SELECT b.*,
    CONCAT(ur.nombre, ' ', COALESCE(ur.apellido, '')) AS reportado_por_nombre,
    CONCAT(uqa.nombre, ' ', COALESCE(uqa.apellido, '')) AS asignado_qa_nombre,
    CONCAT(ut.nombre, ' ', COALESCE(ut.apellido, '')) AS enviado_testing_por_nombre
  FROM qa_bugs b
  JOIN usuarios ur ON ur.id = b.reportado_por
  LEFT JOIN usuarios uqa ON uqa.id = b.asignado_qa_id
  LEFT JOIN usuarios ut ON ut.id = b.enviado_testing_por
`;

// ─── Bugs ─────────────────────────────────────────────────────────────────────

export const listarBugs = async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await pool.query(`${BUG_SELECT} ORDER BY b.created_at DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const crearBug = async (req, res) => {
  try {
    await ensureSchema();
    const { titulo, descripcion, pasos_reproduccion, resultado_esperado, resultado_actual,
            severidad, prioridad, estado, tipo, ambiente } = req.body;
    if (!titulo) return res.status(400).json({ error: 'El título es requerido' });

    const [r] = await pool.query(`
      INSERT INTO qa_bugs (titulo, descripcion, pasos_reproduccion, resultado_esperado, resultado_actual,
        severidad, prioridad, estado, tipo, ambiente, reportado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [titulo, descripcion || null, pasos_reproduccion || null, resultado_esperado || null,
        resultado_actual || null, severidad || 'media', prioridad || 'media', estado || 'nuevo',
        tipo || 'funcional', ambiente || 'qa', req.user.id]);

    const [[bug]] = await pool.query(`${BUG_SELECT} WHERE b.id = ?`, [r.insertId]);
    res.status(201).json(bug);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const actualizarBug = async (req, res) => {
  try {
    await ensureSchema();
    const { id } = req.params;
    const { titulo, descripcion, pasos_reproduccion, resultado_esperado, resultado_actual,
            severidad, prioridad, estado, tipo, ambiente } = req.body;

    // Registra quién envió a pending_testing
    const testingField = estado === 'pending_testing' ? ', enviado_testing_por = ?' : '';
    const testingVal   = estado === 'pending_testing' ? [req.user.id] : [];

    await pool.query(`
      UPDATE qa_bugs SET
        titulo=?, descripcion=?, pasos_reproduccion=?, resultado_esperado=?,
        resultado_actual=?, severidad=?, prioridad=?, estado=?, tipo=?, ambiente=?
        ${testingField}
      WHERE id=?
    `, [titulo, descripcion || null, pasos_reproduccion || null, resultado_esperado || null,
        resultado_actual || null, severidad, prioridad, estado, tipo, ambiente,
        ...testingVal, id]);

    const [[bug]] = await pool.query(`${BUG_SELECT} WHERE b.id = ?`, [id]);
    res.json(bug);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const eliminarBug = async (req, res) => {
  try {
    await ensureSchema();
    await pool.query('DELETE FROM qa_bugs WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const asignarQA = async (req, res) => {
  try {
    await ensureSchema();
    const { id } = req.params;
    const { asignado_qa_id } = req.body;
    await pool.query('UPDATE qa_bugs SET asignado_qa_id=? WHERE id=?', [asignado_qa_id || null, id]);
    const [[bug]] = await pool.query(`${BUG_SELECT} WHERE b.id = ?`, [id]);
    res.json(bug);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ─── Test Cases ───────────────────────────────────────────────────────────────

export const listarTestCases = async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await pool.query(`
      SELECT tc.*,
        CONCAT(uc.nombre, ' ', COALESCE(uc.apellido, '')) AS creado_por_nombre,
        CONCAT(ue.nombre, ' ', COALESCE(ue.apellido, '')) AS ejecutado_por_nombre
      FROM qa_test_cases tc
      JOIN usuarios uc ON uc.id = tc.creado_por
      LEFT JOIN usuarios ue ON ue.id = tc.ejecutado_por
      ORDER BY tc.created_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const crearTestCase = async (req, res) => {
  try {
    await ensureSchema();
    const { titulo, descripcion, precondiciones, pasos, resultado_esperado, prioridad, categoria } = req.body;
    if (!titulo || !pasos || !resultado_esperado)
      return res.status(400).json({ error: 'Título, pasos y resultado esperado son requeridos' });

    const [r] = await pool.query(`
      INSERT INTO qa_test_cases (titulo, descripcion, precondiciones, pasos, resultado_esperado, prioridad, categoria, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [titulo, descripcion || null, precondiciones || null, JSON.stringify(pasos),
        resultado_esperado, prioridad || 'media', categoria || null, req.user.id]);

    const [[tc]] = await pool.query(`
      SELECT tc.*, CONCAT(uc.nombre, ' ', COALESCE(uc.apellido, '')) AS creado_por_nombre,
        CONCAT(ue.nombre, ' ', COALESCE(ue.apellido, '')) AS ejecutado_por_nombre
      FROM qa_test_cases tc
      JOIN usuarios uc ON uc.id = tc.creado_por
      LEFT JOIN usuarios ue ON ue.id = tc.ejecutado_por
      WHERE tc.id = ?
    `, [r.insertId]);
    res.status(201).json(tc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const actualizarTestCase = async (req, res) => {
  try {
    await ensureSchema();
    const { id } = req.params;
    const { titulo, descripcion, precondiciones, pasos, resultado_esperado, prioridad, categoria } = req.body;

    await pool.query(`
      UPDATE qa_test_cases SET titulo=?, descripcion=?, precondiciones=?, pasos=?,
        resultado_esperado=?, prioridad=?, categoria=? WHERE id=?
    `, [titulo, descripcion || null, precondiciones || null, JSON.stringify(pasos),
        resultado_esperado, prioridad, categoria || null, id]);

    const [[tc]] = await pool.query(`
      SELECT tc.*, CONCAT(uc.nombre, ' ', COALESCE(uc.apellido, '')) AS creado_por_nombre,
        CONCAT(ue.nombre, ' ', COALESCE(ue.apellido, '')) AS ejecutado_por_nombre
      FROM qa_test_cases tc
      JOIN usuarios uc ON uc.id = tc.creado_por
      LEFT JOIN usuarios ue ON ue.id = tc.ejecutado_por
      WHERE tc.id = ?
    `, [id]);
    res.json(tc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const ejecutarTestCase = async (req, res) => {
  try {
    await ensureSchema();
    const { id } = req.params;
    const { estado, resultado_actual } = req.body;
    if (!['pasado', 'fallido', 'bloqueado', 'na'].includes(estado))
      return res.status(400).json({ error: 'Estado inválido' });

    await pool.query(`
      UPDATE qa_test_cases SET estado=?, resultado_actual=?, ejecutado_por=?, ejecutado_at=NOW() WHERE id=?
    `, [estado, resultado_actual || null, req.user.id, id]);

    const [[tc]] = await pool.query(`
      SELECT tc.*, CONCAT(uc.nombre, ' ', COALESCE(uc.apellido, '')) AS creado_por_nombre,
        CONCAT(ue.nombre, ' ', COALESCE(ue.apellido, '')) AS ejecutado_por_nombre
      FROM qa_test_cases tc
      JOIN usuarios uc ON uc.id = tc.creado_por
      LEFT JOIN usuarios ue ON ue.id = tc.ejecutado_por
      WHERE tc.id = ?
    `, [id]);
    res.json(tc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const eliminarTestCase = async (req, res) => {
  try {
    await ensureSchema();
    await pool.query('DELETE FROM qa_test_cases WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ─── Bug Comments ─────────────────────────────────────────────────────────────

export const listarComentariosBug = async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await pool.query(`
      SELECT c.*, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS autor
      FROM qa_bug_comments c
      JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.bug_id = ? ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const crearComentarioBug = async (req, res) => {
  try {
    await ensureSchema();
    const { id } = req.params;
    const { comentario, rol_sesion } = req.body;
    if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario no puede estar vacío' });

    const [r] = await pool.query(`
      INSERT INTO qa_bug_comments (bug_id, usuario_id, rol_sesion, comentario) VALUES (?, ?, ?, ?)
    `, [id, req.user.id, rol_sesion || 'QA', comentario.trim()]);

    const [[comment]] = await pool.query(`
      SELECT c.*, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS autor
      FROM qa_bug_comments c JOIN usuarios u ON u.id = c.usuario_id WHERE c.id = ?
    `, [r.insertId]);
    res.status(201).json(comment);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ─── Equipos ──────────────────────────────────────────────────────────────────

export const listarEquipos = async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await pool.query(`
      SELECT e.*,
        CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS creado_por_nombre,
        (SELECT COUNT(*) FROM qa_equipo_miembros m WHERE m.equipo_id = e.id) AS total_miembros
      FROM qa_equipos e
      JOIN usuarios u ON u.id = e.creado_por
      ORDER BY e.created_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const crearEquipo = async (req, res) => {
  try {
    await ensureSchema();
    const { nombre, descripcion } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });

    const [r] = await pool.query(`
      INSERT INTO qa_equipos (nombre, descripcion, creado_por) VALUES (?, ?, ?)
    `, [nombre.trim(), descripcion || null, req.user.id]);

    const [[equipo]] = await pool.query(`
      SELECT e.*, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS creado_por_nombre, 0 AS total_miembros
      FROM qa_equipos e JOIN usuarios u ON u.id = e.creado_por WHERE e.id = ?
    `, [r.insertId]);
    res.status(201).json(equipo);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const eliminarEquipo = async (req, res) => {
  try {
    await ensureSchema();
    await pool.query('DELETE FROM qa_equipos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const listarMiembrosEquipo = async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await pool.query(`
      SELECT m.*, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS nombre_completo, u.email, u.rol AS rol_sistema
      FROM qa_equipo_miembros m
      JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.equipo_id = ?
      ORDER BY m.rol_equipo, u.nombre
    `, [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const agregarMiembroEquipo = async (req, res) => {
  try {
    await ensureSchema();
    const { id } = req.params;
    const { usuario_id, rol_equipo } = req.body;
    if (!usuario_id) return res.status(400).json({ error: 'usuario_id es requerido' });

    await pool.query(`
      INSERT INTO qa_equipo_miembros (equipo_id, usuario_id, rol_equipo) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE rol_equipo = VALUES(rol_equipo)
    `, [id, usuario_id, rol_equipo || 'QA']);

    const [rows] = await pool.query(`
      SELECT m.*, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS nombre_completo, u.email, u.rol AS rol_sistema
      FROM qa_equipo_miembros m
      JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.equipo_id = ? ORDER BY m.rol_equipo, u.nombre
    `, [id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const eliminarMiembroEquipo = async (req, res) => {
  try {
    await ensureSchema();
    await pool.query('DELETE FROM qa_equipo_miembros WHERE equipo_id=? AND usuario_id=?', [req.params.id, req.params.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ─── Usuarios (para selects) ──────────────────────────────────────────────────

export const listarUsuariosQA = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id, nombre, apellido, email, rol FROM usuarios ORDER BY nombre`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ─── Bug Images ───────────────────────────────────────────────────────────────

export const listarImagenesBug = async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await pool.query(
      'SELECT * FROM qa_bug_images WHERE bug_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const subirImagenesBug = async (req, res) => {
  try {
    await ensureSchema();
    const { id } = req.params;
    if (!req.files?.length) return res.status(400).json({ error: 'No se recibieron imágenes' });

    for (const file of req.files) {
      await pool.query(
        'INSERT INTO qa_bug_images (bug_id, filename, original_name, subido_por) VALUES (?, ?, ?, ?)',
        [id, file.filename, file.originalname, req.user.id]
      );
    }

    const [rows] = await pool.query(
      'SELECT * FROM qa_bug_images WHERE bug_id = ? ORDER BY created_at ASC',
      [id]
    );
    res.status(201).json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const eliminarImagenBug = async (req, res) => {
  try {
    await ensureSchema();
    const { bugId, imageId } = req.params;
    const [[img]] = await pool.query(
      'SELECT * FROM qa_bug_images WHERE id = ? AND bug_id = ?',
      [imageId, bugId]
    );
    if (!img) return res.status(404).json({ error: 'Imagen no encontrada' });

    await pool.query('DELETE FROM qa_bug_images WHERE id = ?', [imageId]);
    await unlink(path.join(__dirname, '..', '..', 'uploads', 'qa', img.filename)).catch(() => {});
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = async (req, res) => {
  try {
    await ensureSchema();

    const [[bugTotals]] = await pool.query(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN estado='nuevo' THEN 1 ELSE 0 END) AS nuevos,
        SUM(CASE WHEN estado='en_progreso' THEN 1 ELSE 0 END) AS en_progreso,
        SUM(CASE WHEN estado='pending_testing' THEN 1 ELSE 0 END) AS pending_testing,
        SUM(CASE WHEN estado='resuelto' THEN 1 ELSE 0 END) AS resueltos,
        SUM(CASE WHEN estado='rechazado' THEN 1 ELSE 0 END) AS rechazados
      FROM qa_bugs
    `);

    const [[tcTotals]] = await pool.query(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN estado='no_ejecutado' THEN 1 ELSE 0 END) AS no_ejecutados,
        SUM(CASE WHEN estado='pasado' THEN 1 ELSE 0 END) AS pasados,
        SUM(CASE WHEN estado='fallido' THEN 1 ELSE 0 END) AS fallidos,
        SUM(CASE WHEN estado='bloqueado' THEN 1 ELSE 0 END) AS bloqueados
      FROM qa_test_cases
    `);

    const [bugsPorUsuario] = await pool.query(`
      SELECT CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS nombre, COUNT(b.id) AS total
      FROM qa_bugs b JOIN usuarios u ON u.id = b.reportado_por
      GROUP BY b.reportado_por ORDER BY total DESC LIMIT 10
    `);

    const [resueltoPorDev] = await pool.query(`
      SELECT CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS nombre,
        COUNT(b.id) AS total_enviados,
        SUM(CASE WHEN b.estado = 'resuelto' THEN 1 ELSE 0 END) AS resueltos
      FROM qa_bugs b JOIN usuarios u ON u.id = b.enviado_testing_por
      WHERE b.enviado_testing_por IS NOT NULL
      GROUP BY b.enviado_testing_por ORDER BY resueltos DESC LIMIT 10
    `);

    const [[equipoStats]] = await pool.query(`
      SELECT COUNT(*) AS total_equipos,
        (SELECT COUNT(*) FROM qa_equipo_miembros) AS total_miembros
      FROM qa_equipos
    `);

    res.json({ bugTotals, tcTotals, bugsPorUsuario, resueltoPorDev, equipoStats });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
