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

export async function listarPresentaciones(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM presentaciones p
       JOIN docentes d ON p.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

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

export async function crearPresentacion(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { titulo, descripcion, enlace_url } = req.body;
    const enlaceUrl = enlace_url?.trim() || null;

    if (!titulo?.trim()) return res.status(400).json({ error: 'El titulo es obligatorio' });
    if (!req.file && !enlaceUrl) return res.status(400).json({ error: 'Debe adjuntar un archivo PDF/PPTX o un enlace publico' });
    if (req.file && enlaceUrl) return res.status(400).json({ error: 'Use solo archivo o enlace, no ambos' });
    if (enlaceUrl && !isValidHttpUrl(enlaceUrl)) return res.status(400).json({ error: 'El enlace debe ser una URL valida' });

    const ext = req.file ? path.extname(req.file.originalname).toLowerCase() : '';
    const tipoArchivo = req.file ? (ext === '.pdf' ? 'pdf' : 'pptx') : 'link';

    const [result] = await pool.query(
      `INSERT INTO presentaciones (docente_id, titulo, descripcion, archivo_nombre, archivo_path, tipo_archivo, enlace_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        docenteId,
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
