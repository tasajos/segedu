import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

function resolveFile(archivoPath) {
  if (!archivoPath) return null;
  const name = path.basename(archivoPath);
  const candidates = [
    path.resolve(process.cwd(), 'uploads', name),
    path.resolve(process.cwd(), 'backend', 'uploads', name),
    path.resolve(__dirname, '..', '..', 'uploads', name)
  ];
  return candidates.find(c => fs.existsSync(c)) || null;
}

const extractSlides = async (filePath) => {
  try {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries()
      .filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
      .sort((a, b) => {
        const n = x => parseInt(x.entryName.match(/slide(\d+)/)[1]);
        return n(a) - n(b);
      });
    return entries.map((entry, idx) => {
      const xml = entry.getData().toString('utf8');
      const texts = [];
      const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
      let m;
      while ((m = re.exec(xml)) !== null) {
        const t = m[1].trim();
        if (t) texts.push(t);
      }
      return { numero: idx + 1, textos: texts };
    });
  } catch {
    return [];
  }
};

// ── Listar — todos los roles autenticados ─────────────────────────────────────
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

// ── Ver archivo (stream inline, sin descarga) — todos los roles ───────────────
export async function verPresentacion(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM presentaciones WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });

    const p = rows[0];
    const filePath = resolveFile(p.archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible' });

    const mime = p.tipo_archivo === 'pdf' ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(p.archivo_nombre)}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Extraer slides PPTX — todos los roles ────────────────────────────────────
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

// ── Crear — solo docente ──────────────────────────────────────────────────────
export async function crearPresentacion(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { titulo, descripcion } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });
    if (!req.file)        return res.status(400).json({ error: 'Debe adjuntar un archivo PDF o PPTX' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const tipo_archivo = ext === '.pdf' ? 'pdf' : 'pptx';

    const [result] = await pool.query(
      `INSERT INTO presentaciones (docente_id, titulo, descripcion, archivo_nombre, archivo_path, tipo_archivo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [docenteId, titulo.trim(), descripcion || null,
       req.file.originalname, `/uploads/${req.file.filename}`, tipo_archivo]
    );
    res.status(201).json({ id: result.insertId, message: 'Presentación subida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Eliminar — solo docente propietario ──────────────────────────────────────
export async function eliminarPresentacion(req, res) {
  try {
    const docenteId = req.user.docente_id;
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM presentaciones WHERE id = ? AND docente_id = ?', [id, docenteId]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado o no autorizado' });

    const fp = resolveFile(rows[0].archivo_path);
    if (fp) fs.unlink(fp, () => {});
    await pool.query('DELETE FROM presentaciones WHERE id = ?', [id]);
    res.json({ message: 'Presentación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
