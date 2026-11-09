import path from 'path';
import pool from '../config/db.js';
import {
  DriveError, assertSharedDriveReady, createUploadSession, disableDownloadForViewers, getFile, getFolderId,
  makeViewableByLink, trashFile
} from '../utils/googleDrive.js';

const MAX_BYTES = 3 * 1024 * 1024 * 1024;
const MIME_BY_EXTENSION = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.wmv': 'video/x-ms-wmv',
  '.mpg': 'video/mpeg',
  '.mpeg': 'video/mpeg',
  '.3gp': 'video/3gpp'
};
const DRIVE_FILE_ID = /^[\w-]{10,128}$/;

const sendError = (res, err) => {
  if (err instanceof DriveError) return res.status(err.status >= 500 ? err.status : 502).json({ error: err.message });
  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(503).json({ error: 'Falta ejecutar la migración v20_videotutoriales.sql' });
  }
  console.error('[Videotutoriales]', err);
  res.status(500).json({ error: 'Error interno al procesar el videotutorial' });
};

// Se resuelve por usuario_id para que también funcione en la vista del auditor.
const findTeacherIdForMateria = async (userId, materiaId) => {
  const [[row]] = await pool.query(
    `SELECT d.id FROM materias m
     JOIN docentes d ON m.docente_id = d.id
     WHERE m.id = ? AND d.usuario_id = ?`,
    [materiaId, userId]
  );
  return row?.id ?? null;
};

export const listarVideotutorialesDocente = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.id, v.titulo, v.descripcion, v.drive_file_id, v.nombre_archivo, v.tamano_bytes, v.created_at,
              m.id AS materia_id, m.nombre AS materia_nombre, m.codigo AS materia_codigo, m.grupo AS materia_grupo
       FROM videotutoriales v
       JOIN docentes d ON v.docente_id = d.id
       JOIN materias m ON v.materia_id = m.id
       WHERE d.usuario_id = ?
       ORDER BY m.nombre, m.grupo, v.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
};

export const iniciarSubidaVideotutorial = async (req, res) => {
  try {
    const { materia_id: materiaId, nombre_archivo: fileName, tamano_bytes: size } = req.body;
    if (!materiaId || typeof fileName !== 'string' || !fileName.trim()) {
      return res.status(400).json({ error: 'Materia y archivo son obligatorios' });
    }
    const mimeType = MIME_BY_EXTENSION[path.extname(fileName).toLowerCase()];
    if (!mimeType) return res.status(400).json({ error: 'El archivo debe ser un video (MP4, WebM, MOV, MKV, AVI…)' });
    if (!Number.isSafeInteger(size) || size <= 0) return res.status(400).json({ error: 'Tamaño de archivo inválido' });
    if (size > MAX_BYTES) return res.status(413).json({ error: 'El video supera el máximo de 3 GB' });

    if (!(await findTeacherIdForMateria(req.user.id, materiaId))) {
      return res.status(403).json({ error: 'La materia no pertenece a este docente' });
    }

    // Comprobar ahora lo que haría fallar el registro tras horas de subida.
    await pool.query('SELECT 1 FROM videotutoriales LIMIT 1');
    await assertSharedDriveReady();

    const uploadUrl = await createUploadSession({
      name: fileName,
      mimeType,
      size,
      origin: req.get('origin') || process.env.FRONTEND_URL
    });
    res.json({ upload_url: uploadUrl, mime_type: mimeType });
  } catch (err) {
    sendError(res, err);
  }
};

export const registrarVideotutorial = async (req, res) => {
  try {
    const { materia_id: materiaId, drive_file_id: fileId, descripcion } = req.body;
    const titulo = typeof req.body.titulo === 'string' ? req.body.titulo.trim() : '';
    if (!materiaId || !titulo || titulo.length > 250) {
      return res.status(400).json({ error: 'Materia y título (máx. 250 caracteres) son obligatorios' });
    }
    if (typeof fileId !== 'string' || !DRIVE_FILE_ID.test(fileId)) {
      return res.status(400).json({ error: 'Identificador de archivo inválido' });
    }

    const docenteId = await findTeacherIdForMateria(req.user.id, materiaId);
    if (!docenteId) return res.status(403).json({ error: 'La materia no pertenece a este docente' });

    // Va antes de cualquier limpieza: un video ya publicado nunca debe enviarse a la papelera.
    const [[existing]] = await pool.query('SELECT id FROM videotutoriales WHERE drive_file_id = ?', [fileId]);
    if (existing) return res.status(409).json({ error: 'Este video ya está registrado' });

    const [file, folderId] = await Promise.all([getFile(fileId), getFolderId()]);
    if (file.trashed || !file.parents?.includes(folderId)) {
      return res.status(400).json({ error: 'El archivo no está en la carpeta de videotutoriales' });
    }
    if (!file.mimeType?.startsWith('video/') || Number(file.size) > MAX_BYTES) {
      await trashFile(fileId);
      return res.status(400).json({ error: 'El archivo subido no es un video válido de hasta 3 GB' });
    }

    let result;
    try {
      // En este orden, el archivo nunca queda público con la descarga habilitada.
      await disableDownloadForViewers(fileId);
      await makeViewableByLink(fileId);
      [result] = await pool.query(
        `INSERT INTO videotutoriales
           (materia_id, docente_id, titulo, descripcion, drive_file_id, nombre_archivo, tamano_bytes, mime_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [materiaId, docenteId, titulo, descripcion?.trim() || null, fileId, file.name, Number(file.size), file.mimeType]
      );
    } catch (err) {
      // Dos registros simultáneos del mismo archivo: el otro ya lo publicó.
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Este video ya está registrado' });
      await trashFile(fileId).catch(() => {});
      throw err;
    }
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    sendError(res, err);
  }
};

export const eliminarVideotutorial = async (req, res) => {
  try {
    const [[video]] = await pool.query(
      `SELECT v.id, v.drive_file_id FROM videotutoriales v
       JOIN docentes d ON v.docente_id = d.id
       WHERE v.id = ? AND d.usuario_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!video) return res.status(404).json({ error: 'Videotutorial no encontrado' });

    await trashFile(video.drive_file_id);
    await pool.query('DELETE FROM videotutoriales WHERE id = ?', [video.id]);
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
};

export const listarVideotutorialesEstudiante = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.id, v.titulo, v.descripcion, v.drive_file_id, v.tamano_bytes, v.created_at,
              m.id AS materia_id, m.nombre AS materia_nombre, m.codigo AS materia_codigo, m.grupo AS materia_grupo,
              u.nombre AS docente_nombre, u.apellido AS docente_apellido
       FROM estudiantes e
       JOIN inscripciones i ON i.estudiante_id = e.id
       JOIN videotutoriales v ON v.materia_id = i.materia_id
       JOIN materias m ON v.materia_id = m.id
       JOIN docentes d ON v.docente_id = d.id
       JOIN usuarios u ON d.usuario_id = u.id
       WHERE e.usuario_id = ?
       ORDER BY m.nombre, m.grupo, v.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
};
