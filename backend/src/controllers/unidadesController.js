import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';

const PROGRAMACION_II = 'Programación II';
const uploadsDir = path.resolve('uploads');

const safeUploadedPath = (storedPath) => {
  const resolved = path.resolve(storedPath);
  return resolved.startsWith(`${uploadsDir}${path.sep}`) ? resolved : null;
};

const removeUploadedFile = (storedPath) => {
  const resolved = safeUploadedPath(storedPath);
  if (resolved && fs.existsSync(resolved)) fs.unlinkSync(resolved);
};

const decodeTitle = (value = '') => value
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ')
  .trim();

const inspectHtml = (filePath) => {
  const html = fs.readFileSync(filePath, 'utf8');
  if (!/<html[\s>]/i.test(html) && !/<!doctype\s+html/i.test(html)) {
    throw new Error('El archivo no contiene un documento HTML válido');
  }
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return { title: decodeTitle(match?.[1]) };
};

export async function ensureUnidadesHtmlSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS unidad_html_archivos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      unidad_id INT NOT NULL,
      docente_id INT NOT NULL,
      titulo VARCHAR(250) NOT NULL,
      descripcion TEXT NULL,
      nombre_original VARCHAR(255) NOT NULL,
      ruta_archivo VARCHAR(500) NOT NULL,
      tamano BIGINT NOT NULL DEFAULT 0,
      orden INT NOT NULL DEFAULT 1,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_unidad_html (unidad_id, activo, orden),
      INDEX idx_docente_html (docente_id),
      CONSTRAINT fk_unidad_html_unidad FOREIGN KEY (unidad_id) REFERENCES unidades_instruccion(id) ON DELETE CASCADE,
      CONSTRAINT fk_unidad_html_docente FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [[existing]] = await pool.query(
    'SELECT id FROM unidades_instruccion WHERE nombre = ? LIMIT 1',
    [PROGRAMACION_II]
  );
  if (!existing) {
    const [[{ siguiente }]] = await pool.query(
      'SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM unidades_instruccion'
    );
    await pool.query(
      `INSERT INTO unidades_instruccion (nombre, descripcion, tipo, orden, activo)
       VALUES (?, ?, 'html', ?, 1)`,
      [PROGRAMACION_II, 'Guías prácticas interactivas de Programación II en formato HTML.', siguiente]
    );
  } else {
    await pool.query(
      `UPDATE unidades_instruccion
       SET activo = 1, tipo = 'html'
       WHERE id = ?`,
      [existing.id]
    );
  }
}

export async function listarUnidades(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT ui.*, u.nombre as creador_nombre, u.apellido as creador_apellido,
              c.nombre as carrera_nombre
       FROM unidades_instruccion ui
       LEFT JOIN usuarios u ON ui.creado_por = u.id
       LEFT JOIN carreras c ON ui.carrera_id = c.id
       WHERE ui.activo = 1
       ORDER BY ui.orden ASC, ui.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function crearUnidad(req, res) {
  const { nombre, descripcion, tipo, carrera_id, orden } = req.body;
  const creado_por = req.user.id;
  try {
    const [result] = await pool.query(
      `INSERT INTO unidades_instruccion (nombre, descripcion, tipo, carrera_id, orden, creado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion || null, tipo || 'simulador', carrera_id || null, orden || 1, creado_por]
    );
    res.status(201).json({ id: result.insertId, message: 'Unidad creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function actualizarUnidad(req, res) {
  const { id } = req.params;
  const { nombre, descripcion, tipo, carrera_id, orden } = req.body;
  try {
    await pool.query(
      `UPDATE unidades_instruccion SET nombre=?, descripcion=?, tipo=?, carrera_id=?, orden=? WHERE id=?`,
      [nombre, descripcion || null, tipo || 'simulador', carrera_id || null, orden || 1, id]
    );
    res.json({ message: 'Unidad actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function eliminarUnidad(req, res) {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE unidades_instruccion SET activo=0 WHERE id=?`, [id]);
    res.json({ message: 'Unidad eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listarGuiasHtml(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.titulo, a.descripcion, a.nombre_original, a.tamano,
              a.orden, a.created_at, a.updated_at,
              CONCAT(u.nombre, ' ', u.apellido) AS docente_nombre,
              CASE WHEN ? = 'docente' AND d.usuario_id = ? THEN 1 ELSE 0 END AS puede_editar
       FROM unidad_html_archivos a
       JOIN unidades_instruccion ui ON ui.id = a.unidad_id
       JOIN docentes d ON d.id = a.docente_id
       JOIN usuarios u ON u.id = d.usuario_id
       WHERE ui.nombre = ? AND ui.activo = 1 AND a.activo = 1
       ORDER BY a.orden, a.created_at`,
      [req.user.rol, req.user.id, PROGRAMACION_II]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function subirGuiaHtml(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Seleccione un archivo HTML' });
  try {
    const metadata = inspectHtml(req.file.path);
    const [[docente]] = await pool.query('SELECT id FROM docentes WHERE usuario_id = ?', [req.user.id]);
    const [[unidad]] = await pool.query(
      'SELECT id FROM unidades_instruccion WHERE nombre = ? AND activo = 1 LIMIT 1',
      [PROGRAMACION_II]
    );
    if (!docente || !unidad) throw new Error('No se encontró la unidad o el perfil docente');

    const [[{ siguiente }]] = await pool.query(
      `SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente
       FROM unidad_html_archivos WHERE unidad_id = ? AND activo = 1`,
      [unidad.id]
    );
    const titulo = String(req.body.titulo || metadata.title || path.parse(req.file.originalname).name).trim();
    const [result] = await pool.query(
      `INSERT INTO unidad_html_archivos
       (unidad_id, docente_id, titulo, descripcion, nombre_original, ruta_archivo, tamano, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [unidad.id, docente.id, titulo, req.body.descripcion || null, req.file.originalname, req.file.path, req.file.size, siguiente]
    );
    res.status(201).json({ id: result.insertId, message: 'Guía HTML publicada', titulo });
  } catch (err) {
    removeUploadedFile(req.file.path);
    res.status(400).json({ error: err.message });
  }
}

export async function reemplazarGuiaHtml(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Seleccione el nuevo archivo HTML' });
  try {
    const metadata = inspectHtml(req.file.path);
    const [[guia]] = await pool.query(
      `SELECT a.* FROM unidad_html_archivos a
       JOIN docentes d ON d.id = a.docente_id
       WHERE a.id = ? AND a.activo = 1 AND d.usuario_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!guia) {
      removeUploadedFile(req.file.path);
      return res.status(404).json({ error: 'Guía no encontrada o sin permiso para editarla' });
    }
    const titulo = String(req.body.titulo || metadata.title || guia.titulo).trim();
    await pool.query(
      `UPDATE unidad_html_archivos
       SET titulo = ?, nombre_original = ?, ruta_archivo = ?, tamano = ?
       WHERE id = ?`,
      [titulo, req.file.originalname, req.file.path, req.file.size, guia.id]
    );
    removeUploadedFile(guia.ruta_archivo);
    res.json({ message: 'Guía HTML reemplazada', titulo });
  } catch (err) {
    removeUploadedFile(req.file.path);
    res.status(400).json({ error: err.message });
  }
}

export async function eliminarGuiaHtml(req, res) {
  try {
    const [[guia]] = await pool.query(
      `SELECT a.* FROM unidad_html_archivos a
       JOIN docentes d ON d.id = a.docente_id
       WHERE a.id = ? AND a.activo = 1 AND d.usuario_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!guia) return res.status(404).json({ error: 'Guía no encontrada o sin permiso para eliminarla' });
    await pool.query('UPDATE unidad_html_archivos SET activo = 0 WHERE id = ?', [guia.id]);
    removeUploadedFile(guia.ruta_archivo);
    res.json({ message: 'Guía eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function verGuiaHtml(req, res) {
  try {
    const [[guia]] = await pool.query(
      `SELECT a.ruta_archivo, a.nombre_original
       FROM unidad_html_archivos a
       JOIN unidades_instruccion ui ON ui.id = a.unidad_id
       WHERE a.id = ? AND a.activo = 1 AND ui.activo = 1 AND ui.nombre = ?`,
      [req.params.id, PROGRAMACION_II]
    );
    const filePath = guia && safeUploadedPath(guia.ruta_archivo);
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo HTML no encontrado' });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(guia.nombre_original).replace(/"/g, '')}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
