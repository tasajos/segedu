import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveFile(archivoPath) {
  if (!archivoPath) return null;
  const name = path.basename(archivoPath);
  const candidates = [
    path.resolve(process.cwd(), 'uploads', name),
    path.resolve(process.cwd(), 'backend', 'uploads', name),
    path.resolve(__dirname, '..', '..', 'uploads', name)
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const extractSlides = async (filePath) => {
  try {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries()
      .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName))
      .sort((a, b) => {
        const n = (x) => parseInt(x.entryName.match(/slide(\d+)/)[1]);
        return n(a) - n(b);
      });

    return entries.map((entry, idx) => {
      const xml = entry.getData().toString('utf8');
      const texts = [];
      const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
      let match;
      while ((match = re.exec(xml)) !== null) {
        const text = match[1].trim();
        if (text) texts.push(text);
      }
      return { numero: idx + 1, textos: texts };
    });
  } catch {
    return [];
  }
};

// ============================================================
// PRESENTACIONES — LISTADO (público para autenticados)
// ============================================================

export async function listarPresentaciones(req, res) {
  try {
    // Intentar query con carpetas (requiere migración ejecutada)
    const [rows] = await pool.query(
      `SELECT p.*,
              u.nombre AS docente_nombre, u.apellido AS docente_apellido,
              d.id     AS docente_id,
              c.nombre AS carpeta_nombre, c.orden AS carpeta_orden
       FROM presentaciones p
       JOIN docentes d  ON p.docente_id  = d.id
       JOIN usuarios u  ON d.usuario_id  = u.id
       LEFT JOIN carpetas_presentaciones c ON p.carpeta_id = c.id
       ORDER BY u.apellido, u.nombre,
                COALESCE(c.orden, 9999), COALESCE(c.nombre, ''),
                p.orden, p.created_at`
    );
    res.json(rows);
  } catch (err) {
    // Fallback: si la migración no se ejecutó aún, usar query sin carpetas
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('carpetas_presentaciones')) {
      try {
        const [rows] = await pool.query(
          `SELECT p.*, u.nombre AS docente_nombre, u.apellido AS docente_apellido, d.id AS docente_id
           FROM presentaciones p
           JOIN docentes d ON p.docente_id = d.id
           JOIN usuarios u ON d.usuario_id = u.id
           ORDER BY p.created_at DESC`
        );
        return res.json(rows);
      } catch (fallbackErr) {
        return res.status(500).json({ error: fallbackErr.message });
      }
    }
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// PRESENTACIONES — VISTA POR MATERIA (para estudiantes)
// ============================================================

export async function listarPresentacionesPorMateria(req, res) {
  try {
    const estudianteId = req.user?.estudiante_id;
    if (!estudianteId) return res.status(403).json({ error: 'Solo para estudiantes' });

    const [rows] = await pool.query(
      `SELECT p.*,
              u.nombre  AS docente_nombre, u.apellido AS docente_apellido,
              d.id      AS docente_id,
              c.nombre  AS carpeta_nombre, c.orden    AS carpeta_orden,
              m.id      AS materia_id,    m.nombre   AS materia_nombre,
              m.codigo  AS materia_codigo, m.grupo   AS materia_grupo,
              m.semestre AS materia_semestre,
              ca.nombre  AS carrera_nombre
       FROM inscripciones i
       JOIN materias m   ON i.materia_id  = m.id
       JOIN carreras ca  ON m.carrera_id  = ca.id
       JOIN docentes d   ON m.docente_id  = d.id
       JOIN usuarios u   ON d.usuario_id  = u.id
       JOIN presentaciones p ON p.docente_id = d.id
       LEFT JOIN carpetas_presentaciones c ON p.carpeta_id = c.id
       WHERE i.estudiante_id = ?
       ORDER BY m.nombre, m.grupo,
                COALESCE(c.orden, 9999), COALESCE(c.nombre, ''),
                p.orden, p.created_at`,
      [estudianteId]
    );
    res.json(rows);
  } catch (err) {
    // Fallback sin carpetas si la migración no se ejecutó aún
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('carpetas_presentaciones')) {
      try {
        const estudianteId = req.user?.estudiante_id;
        const [rows] = await pool.query(
          `SELECT p.*,
                  u.nombre AS docente_nombre, u.apellido AS docente_apellido,
                  d.id AS docente_id,
                  m.id AS materia_id, m.nombre AS materia_nombre,
                  m.codigo AS materia_codigo, m.grupo AS materia_grupo,
                  m.semestre AS materia_semestre,
                  ca.nombre AS carrera_nombre
           FROM inscripciones i
           JOIN materias m  ON i.materia_id = m.id
           JOIN carreras ca ON m.carrera_id = ca.id
           JOIN docentes d  ON m.docente_id = d.id
           JOIN usuarios u  ON d.usuario_id = u.id
           JOIN presentaciones p ON p.docente_id = d.id
           WHERE i.estudiante_id = ?
           ORDER BY m.nombre, m.grupo, p.created_at`,
          [estudianteId]
        );
        return res.json(rows);
      } catch (fallbackErr) {
        return res.status(500).json({ error: fallbackErr.message });
      }
    }
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// PRESENTACIONES — VER / SLIDES (sin cambios)
// ============================================================

export async function verPresentacion(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM presentaciones WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });

    const presentation = rows[0];
    if (presentation.enlace_url) return res.redirect(presentation.enlace_url);

    const filePath = resolveFile(presentation.archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible' });

    const mime = presentation.tipo_archivo === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(presentation.archivo_nombre)}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function slidesPresentacion(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM presentaciones WHERE id = ? AND tipo_archivo = ?', [id, 'pptx']);
    if (!rows.length) return res.status(404).json({ error: 'PPTX no encontrado' });

    const filePath = resolveFile(rows[0].archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible' });

    const slides = await extractSlides(filePath);
    res.json({ slides, titulo: rows[0].titulo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// PRESENTACIONES — DOCENTE (gestión propia)
// ============================================================

export async function listarMisPresentaciones(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const [rows] = await pool.query(
      `SELECT p.*,
              c.nombre AS carpeta_nombre, c.orden AS carpeta_orden
       FROM presentaciones p
       LEFT JOIN carpetas_presentaciones c ON p.carpeta_id = c.id
       WHERE p.docente_id = ?
       ORDER BY COALESCE(c.orden, 9999), COALESCE(c.nombre, ''),
                p.orden, p.created_at`,
      [docenteId]
    );
    res.json(rows);
  } catch (err) {
    // Fallback sin carpetas si la migración no se ejecutó aún
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('carpetas_presentaciones')) {
      try {
        const [rows] = await pool.query(
          'SELECT * FROM presentaciones WHERE docente_id = ? ORDER BY created_at DESC',
          [req.user.docente_id]
        );
        return res.json(rows);
      } catch (fallbackErr) {
        return res.status(500).json({ error: fallbackErr.message });
      }
    }
    res.status(500).json({ error: err.message });
  }
}

export async function crearPresentacion(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { titulo, descripcion, enlace_url, carpeta_id } = req.body;
    const enlaceUrl = enlace_url?.trim() || null;
    const carpetaId = carpeta_id ? parseInt(carpeta_id) : null;

    if (!titulo?.trim()) return res.status(400).json({ error: 'El titulo es obligatorio' });
    if (!req.file && !enlaceUrl) return res.status(400).json({ error: 'Debe adjuntar un archivo PDF/PPTX o un enlace publico' });
    if (req.file && enlaceUrl) return res.status(400).json({ error: 'Use solo archivo o enlace, no ambos' });
    if (enlaceUrl && !isValidHttpUrl(enlaceUrl)) return res.status(400).json({ error: 'El enlace debe ser una URL valida' });

    // Verificar que la carpeta pertenece a este docente si se proporcionó
    if (carpetaId) {
      const [carpetas] = await pool.query(
        'SELECT id FROM carpetas_presentaciones WHERE id = ? AND docente_id = ?',
        [carpetaId, docenteId]
      );
      if (!carpetas.length) return res.status(403).json({ error: 'Carpeta no autorizada' });
    }

    const ext = req.file ? path.extname(req.file.originalname).toLowerCase() : '';
    const tipoArchivo = req.file ? (ext === '.pdf' ? 'pdf' : 'pptx') : 'link';

    const [result] = await pool.query(
      `INSERT INTO presentaciones
         (docente_id, carpeta_id, titulo, descripcion, archivo_nombre, archivo_path, tipo_archivo, enlace_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docenteId,
        carpetaId,
        titulo.trim(),
        descripcion || null,
        req.file?.originalname || null,
        req.file ? `/uploads/${req.file.filename}` : null,
        tipoArchivo,
        enlaceUrl
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Presentacion guardada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function eliminarPresentacion(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM presentaciones WHERE id = ? AND docente_id = ?', [id, docenteId]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado o no autorizado' });

    const filePath = resolveFile(rows[0].archivo_path);
    if (filePath) fs.unlink(filePath, () => {});
    await pool.query('DELETE FROM presentaciones WHERE id = ?', [id]);
    res.json({ message: 'Presentacion eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function moverPresentacion(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { id } = req.params;
    const carpetaId = req.body.carpeta_id ? parseInt(req.body.carpeta_id) : null;

    const [rows] = await pool.query(
      'SELECT id FROM presentaciones WHERE id = ? AND docente_id = ?',
      [id, docenteId]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado o no autorizado' });

    if (carpetaId) {
      const [carpetas] = await pool.query(
        'SELECT id FROM carpetas_presentaciones WHERE id = ? AND docente_id = ?',
        [carpetaId, docenteId]
      );
      if (!carpetas.length) return res.status(403).json({ error: 'Carpeta no autorizada' });
    }

    await pool.query('UPDATE presentaciones SET carpeta_id = ? WHERE id = ?', [carpetaId, id]);
    res.json({ message: 'Presentacion movida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// CARPETAS — CRUD (solo docente sobre sus propias carpetas)
// ============================================================

export async function listarCarpetas(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const [rows] = await pool.query(
      'SELECT * FROM carpetas_presentaciones WHERE docente_id = ? ORDER BY orden, nombre',
      [docenteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function crearCarpeta(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const [result] = await pool.query(
      'INSERT INTO carpetas_presentaciones (docente_id, nombre) VALUES (?, ?)',
      [docenteId, nombre.trim()]
    );
    res.status(201).json({ id: result.insertId, nombre: nombre.trim(), orden: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function actualizarCarpeta(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const [rows] = await pool.query(
      'SELECT id FROM carpetas_presentaciones WHERE id = ? AND docente_id = ?',
      [id, docenteId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Carpeta no encontrada' });

    await pool.query(
      'UPDATE carpetas_presentaciones SET nombre = ? WHERE id = ?',
      [nombre.trim(), id]
    );
    res.json({ message: 'Carpeta actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function eliminarCarpeta(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT id FROM carpetas_presentaciones WHERE id = ? AND docente_id = ?',
      [id, docenteId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Carpeta no encontrada' });

    // La FK ON DELETE SET NULL libera las presentaciones automáticamente
    await pool.query('DELETE FROM carpetas_presentaciones WHERE id = ?', [id]);
    res.json({ message: 'Carpeta eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
