import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveFilePath = (archivoPath) => {
  if (!archivoPath) return null;
  const fileName = path.basename(archivoPath);
  const candidates = [
    path.resolve(process.cwd(), 'uploads', fileName),
    path.resolve(process.cwd(), 'backend', 'uploads', fileName),
    path.resolve(__dirname, '..', '..', 'uploads', fileName)
  ];
  return candidates.find(c => fs.existsSync(c)) || null;
};

// Always resolves docente_id fresh from DB using usuario_id (always present in JWT).
// This is safer than relying on the JWT's docente_id field which can be stale or missing.
const resolveDocenteId = async (user) => {
  const [[doc]] = await pool.query('SELECT id FROM docentes WHERE usuario_id = ?', [user.id]);
  return doc?.id ?? null;
};

// ===== HELPER: extract slides from PPTX (ES modules) =====
const extractSlidesAsync = async (filePath) => {
  try {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(filePath);
    const slideEntries = zip.getEntries()
      .filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/slide(\d+)/)[1]);
        const numB = parseInt(b.entryName.match(/slide(\d+)/)[1]);
        return numA - numB;
      });

    return slideEntries.map((entry, idx) => {
      const xml = entry.getData().toString('utf8');
      const texts = [];
      const regex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
      let match;
      while ((match = regex.exec(xml)) !== null) {
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
// DOCENTE — TAREAS
// ============================================================

export const listarTareasDocente = async (req, res) => {
  try {
    const docenteId = await resolveDocenteId(req.user);
    if (!docenteId) return res.json([]);
    const { materia_id } = req.query;
    let query = `
      SELECT t.*, m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo,
             (SELECT COUNT(*) FROM entregas_tareas et WHERE et.tarea_id = t.id) as total_entregas,
             (SELECT COUNT(*) FROM inscripciones i WHERE i.materia_id = t.materia_id) as total_inscritos
      FROM tareas t
      JOIN materias m ON t.materia_id = m.id
      WHERE t.docente_id = ?`;
    const params = [docenteId];
    if (materia_id) {
      query += ' AND t.materia_id = ?';
      params.push(materia_id);
    }
    query += ' ORDER BY t.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearTarea = async (req, res) => {
  try {
    const docenteId = await resolveDocenteId(req.user);
    if (!docenteId) return res.status(403).json({ error: 'Perfil de docente no encontrado' });
    const { materia_id, titulo, descripcion, fecha_entrega } = req.body;

    // Verify the materia belongs to this docente
    const [materias] = await pool.query(
      'SELECT id FROM materias WHERE id = ? AND docente_id = ?',
      [materia_id, docenteId]
    );
    if (!materias.length) return res.status(403).json({ error: 'Materia no autorizada' });

    let archivo_nombre = null, archivo_path = null, tipo_archivo = null;
    if (req.file) {
      archivo_nombre = req.file.originalname;
      archivo_path = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      tipo_archivo = ext === '.pdf' ? 'pdf' : 'pptx';
    }

    const [result] = await pool.query(
      `INSERT INTO tareas (materia_id, docente_id, titulo, descripcion, fecha_entrega, archivo_nombre, archivo_path, tipo_archivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [materia_id, docenteId, titulo, descripcion || null, fecha_entrega || null, archivo_nombre, archivo_path, tipo_archivo]
    );
    res.status(201).json({ id: result.insertId, message: 'Tarea creada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarTarea = async (req, res) => {
  try {
    const docenteId = await resolveDocenteId(req.user);
    if (!docenteId) return res.status(403).json({ error: 'Perfil de docente no encontrado' });
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM tareas WHERE id = ? AND docente_id = ?', [id, docenteId]);
    if (!rows.length) return res.status(404).json({ error: 'Tarea no encontrada' });

    if (rows[0].archivo_path) {
      const fp = resolveFilePath(rows[0].archivo_path);
      if (fp) fs.unlink(fp, () => {});
    }
    await pool.query('DELETE FROM tareas WHERE id = ?', [id]);
    res.json({ message: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarEntregasDocente = async (req, res) => {
  try {
    const docenteId = await resolveDocenteId(req.user);
    if (!docenteId) return res.status(403).json({ error: 'Perfil de docente no encontrado' });
    const { id } = req.params;

    const [tareas] = await pool.query('SELECT id FROM tareas WHERE id = ? AND docente_id = ?', [id, docenteId]);
    if (!tareas.length) return res.status(403).json({ error: 'No autorizado' });

    const [rows] = await pool.query(`
      SELECT et.*, u.nombre, u.apellido, e.codigo_estudiante,
             gt.nombre_grupo,
             (SELECT GROUP_CONCAT(u2.nombre, ' ', u2.apellido SEPARATOR ', ')
              FROM miembros_grupo mg2
              JOIN estudiantes e2 ON mg2.estudiante_id = e2.id
              JOIN usuarios u2 ON e2.usuario_id = u2.id
              WHERE mg2.grupo_id = gt.id) as miembros_nombre
      FROM entregas_tareas et
      JOIN estudiantes e ON et.estudiante_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN miembros_grupo mg ON mg.tarea_id = et.tarea_id AND mg.estudiante_id = et.estudiante_id
      LEFT JOIN grupos_tarea gt ON mg.grupo_id = gt.id
      WHERE et.tarea_id = ?
      ORDER BY et.fecha_entrega DESC
    `, [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const calificarEntrega = async (req, res) => {
  try {
    const docenteId = await resolveDocenteId(req.user);
    if (!docenteId) return res.status(403).json({ error: 'Perfil de docente no encontrado' });
    const { id } = req.params;
    const { calificacion, comentario_calificacion } = req.body;

    const [rows] = await pool.query(`
      SELECT et.id FROM entregas_tareas et
      JOIN tareas t ON et.tarea_id = t.id
      WHERE et.id = ? AND t.docente_id = ?
    `, [id, docenteId]);
    if (!rows.length) return res.status(403).json({ error: 'No autorizado' });

    await pool.query(
      `UPDATE entregas_tareas SET calificacion = ?, comentario_calificacion = ?, fecha_calificacion = NOW()
       WHERE id = ?`,
      [calificacion, comentario_calificacion || null, id]
    );
    res.json({ message: 'Calificación registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Stream task material file inline (docente)
export const verArchivoTareaDocente = async (req, res) => {
  try {
    const docenteId = await resolveDocenteId(req.user);
    if (!docenteId) return res.status(403).json({ error: 'Perfil de docente no encontrado' });
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM tareas WHERE id = ? AND docente_id = ?',
      [id, docenteId]
    );
    if (!rows.length || !rows[0].archivo_path) return res.status(404).json({ error: 'Archivo no encontrado' });

    const tarea = rows[0];
    const filePath = resolveFilePath(tarea.archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible en el servidor' });

    const ext = path.extname(tarea.archivo_nombre).toLowerCase();
    const mime = ext === '.pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(tarea.archivo_nombre)}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Extract PPTX slides for docente
export const extractSlidesDocente = async (req, res) => {
  try {
    const docenteId = await resolveDocenteId(req.user);
    if (!docenteId) return res.status(403).json({ error: 'Perfil de docente no encontrado' });
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM tareas WHERE id = ? AND docente_id = ?',
      [id, docenteId]
    );
    if (!rows.length || rows[0].tipo_archivo !== 'pptx') return res.status(404).json({ error: 'Archivo PPTX no encontrado' });

    const filePath = resolveFilePath(rows[0].archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible' });

    const slides = await extractSlidesAsync(filePath);
    res.json({ slides, titulo: rows[0].titulo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Stream student submission Word file (docente view)
export const verEntregaDocente = async (req, res) => {
  try {
    const docenteId = await resolveDocenteId(req.user);
    if (!docenteId) return res.status(403).json({ error: 'Perfil de docente no encontrado' });
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT et.* FROM entregas_tareas et
      JOIN tareas t ON et.tarea_id = t.id
      WHERE et.id = ? AND t.docente_id = ?
    `, [id, docenteId]);
    if (!rows.length) return res.status(403).json({ error: 'No autorizado' });

    const entrega = rows[0];
    const filePath = resolveFilePath(entrega.archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(entrega.archivo_nombre)}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// ESTUDIANTE — TAREAS
// ============================================================

export const listarTareasEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const [rows] = await pool.query(`
      SELECT t.*, m.nombre as materia_nombre, m.codigo as materia_codigo, m.grupo as materia_grupo,
             u.nombre as docente_nombre, u.apellido as docente_apellido,
             et.id as entrega_id, et.calificacion, et.fecha_entrega as fecha_mi_entrega, et.comentario_calificacion
      FROM inscripciones i
      JOIN materias m ON i.materia_id = m.id
      JOIN tareas t ON t.materia_id = m.id
      LEFT JOIN docentes d ON m.docente_id = d.id
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      LEFT JOIN entregas_tareas et ON et.tarea_id = t.id AND et.estudiante_id = ?
      WHERE i.estudiante_id = ?
      ORDER BY t.created_at DESC
    `, [estudianteId, estudianteId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Stream task material inline (estudiante view - verify enrollment)
export const verArchivoTareaEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT t.* FROM tareas t
      JOIN inscripciones i ON i.materia_id = t.materia_id AND i.estudiante_id = ?
      WHERE t.id = ?
    `, [estudianteId, id]);
    if (!rows.length || !rows[0].archivo_path) return res.status(404).json({ error: 'Archivo no encontrado' });

    const tarea = rows[0];
    const filePath = resolveFilePath(tarea.archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible en el servidor' });

    const ext = path.extname(tarea.archivo_nombre).toLowerCase();
    const mime = ext === '.pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(tarea.archivo_nombre)}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Extract PPTX slides (estudiante view)
export const extractSlidesEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT t.* FROM tareas t
      JOIN inscripciones i ON i.materia_id = t.materia_id AND i.estudiante_id = ?
      WHERE t.id = ? AND t.tipo_archivo = 'pptx'
    `, [estudianteId, id]);
    if (!rows.length) return res.status(404).json({ error: 'Archivo PPTX no encontrado' });

    const filePath = resolveFilePath(rows[0].archivo_path);
    if (!filePath) return res.status(404).json({ error: 'Archivo no disponible' });

    const slides = await extractSlidesAsync(filePath);
    res.json({ slides, titulo: rows[0].titulo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const entregarTarea = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { id } = req.params;

    // Verify enrollment
    const [inscr] = await pool.query(`
      SELECT i.id FROM inscripciones i
      JOIN tareas t ON t.materia_id = i.materia_id
      WHERE t.id = ? AND i.estudiante_id = ?
    `, [id, estudianteId]);
    if (!inscr.length) return res.status(403).json({ error: 'No estás inscrito en esta materia' });

    if (!req.file) return res.status(400).json({ error: 'Debe adjuntar un archivo Word (.docx)' });

    const archivo_nombre = req.file.originalname;
    const archivo_path = `/uploads/${req.file.filename}`;

    await pool.query(
      `INSERT INTO entregas_tareas (tarea_id, estudiante_id, archivo_nombre, archivo_path)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE archivo_nombre = VALUES(archivo_nombre), archivo_path = VALUES(archivo_path), fecha_entrega = NOW()`,
      [id, estudianteId, archivo_nombre, archivo_path]
    );
    res.status(201).json({ message: 'Tarea entregada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const miEntrega = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM entregas_tareas WHERE tarea_id = ? AND estudiante_id = ?',
      [id, estudianteId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// ESTUDIANTE — GRUPOS
// ============================================================

export const listarGruposEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { tareaId } = req.params;

    // Verify enrollment for this task
    const [inscr] = await pool.query(`
      SELECT i.id FROM inscripciones i
      JOIN tareas t ON t.materia_id = i.materia_id
      WHERE t.id = ? AND i.estudiante_id = ?
    `, [tareaId, estudianteId]);
    if (!inscr.length) return res.status(403).json({ error: 'No autorizado' });

    const [grupos] = await pool.query(`
      SELECT gt.*, u.nombre as creador_nombre, u.apellido as creador_apellido,
             COUNT(mg.id) as total_miembros
      FROM grupos_tarea gt
      JOIN estudiantes ec ON gt.creado_por = ec.id
      JOIN usuarios u ON ec.usuario_id = u.id
      LEFT JOIN miembros_grupo mg ON mg.grupo_id = gt.id
      WHERE gt.tarea_id = ?
      GROUP BY gt.id
      ORDER BY gt.fecha_creacion ASC
    `, [tareaId]);

    // Get members for each group
    const gruposConMiembros = await Promise.all(grupos.map(async (g) => {
      const [miembros] = await pool.query(`
        SELECT mg.estudiante_id, u.nombre, u.apellido, e.codigo_estudiante
        FROM miembros_grupo mg
        JOIN estudiantes e ON mg.estudiante_id = e.id
        JOIN usuarios u ON e.usuario_id = u.id
        WHERE mg.grupo_id = ?
      `, [g.id]);
      return { ...g, miembros };
    }));

    // Check if current student is in any group for this task
    const [miGrupo] = await pool.query(
      'SELECT grupo_id FROM miembros_grupo WHERE tarea_id = ? AND estudiante_id = ?',
      [tareaId, estudianteId]
    );

    res.json({ grupos: gruposConMiembros, mi_grupo_id: miGrupo[0]?.grupo_id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarCompaneros = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { tareaId } = req.params;

    const [tareaRows] = await pool.query('SELECT materia_id FROM tareas WHERE id = ?', [tareaId]);
    if (!tareaRows.length) return res.status(404).json({ error: 'Tarea no encontrada' });

    const materiaId = tareaRows[0].materia_id;

    // All classmates in the same course (excluding self)
    const [companeros] = await pool.query(`
      SELECT e.id as estudiante_id, u.nombre, u.apellido, e.codigo_estudiante,
             EXISTS(
               SELECT 1 FROM miembros_grupo mg WHERE mg.tarea_id = ? AND mg.estudiante_id = e.id
             ) as ya_en_grupo
      FROM inscripciones i
      JOIN estudiantes e ON i.estudiante_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE i.materia_id = ? AND i.estudiante_id != ?
      ORDER BY u.apellido, u.nombre
    `, [tareaId, materiaId, estudianteId]);

    res.json(companeros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearGrupo = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { tarea_id, nombre_grupo, miembros } = req.body;

    // Verify enrollment
    const [tareaRows] = await pool.query(`
      SELECT t.*, i.id as inscripcion_id FROM tareas t
      JOIN inscripciones i ON i.materia_id = t.materia_id AND i.estudiante_id = ?
      WHERE t.id = ?
    `, [estudianteId, tarea_id]);
    if (!tareaRows.length) return res.status(403).json({ error: 'No estás inscrito en esta materia' });

    const tarea = tareaRows[0];

    // Check creator is not already in a group
    const [yaEnGrupo] = await pool.query(
      'SELECT id FROM miembros_grupo WHERE tarea_id = ? AND estudiante_id = ?',
      [tarea_id, estudianteId]
    );
    if (yaEnGrupo.length) return res.status(400).json({ error: 'Ya perteneces a un grupo en esta tarea' });

    // Validate requested members
    const todosLosMiembros = [estudianteId, ...(miembros || []).filter(id => id !== estudianteId)];

    // Check none of the requested members are already in a group
    if (todosLosMiembros.length > 1) {
      const [ocupados] = await pool.query(
        `SELECT mg.estudiante_id, u.nombre, u.apellido
         FROM miembros_grupo mg
         JOIN estudiantes e ON mg.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         WHERE mg.tarea_id = ? AND mg.estudiante_id IN (?)`,
        [tarea_id, todosLosMiembros.filter(id => id !== estudianteId)]
      );
      if (ocupados.length) {
        const nombres = ocupados.map(o => `${o.nombre} ${o.apellido}`).join(', ');
        return res.status(400).json({ error: `Los siguientes compañeros ya están en un grupo: ${nombres}` });
      }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [grupoResult] = await conn.query(
        'INSERT INTO grupos_tarea (tarea_id, materia_id, nombre_grupo, creado_por) VALUES (?, ?, ?, ?)',
        [tarea_id, tarea.materia_id, nombre_grupo, estudianteId]
      );
      const grupoId = grupoResult.insertId;

      for (const mId of todosLosMiembros) {
        await conn.query(
          'INSERT INTO miembros_grupo (grupo_id, tarea_id, estudiante_id) VALUES (?, ?, ?)',
          [grupoId, tarea_id, mId]
        );
      }

      await conn.commit();
      res.status(201).json({ id: grupoId, message: 'Grupo creado correctamente' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Uno de los miembros ya pertenece a un grupo en esta tarea' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const salirGrupo = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { grupoId } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM miembros_grupo WHERE grupo_id = ? AND estudiante_id = ?',
      [grupoId, estudianteId]
    );
    if (!rows.length) return res.status(404).json({ error: 'No perteneces a este grupo' });

    await pool.query('DELETE FROM miembros_grupo WHERE grupo_id = ? AND estudiante_id = ?', [grupoId, estudianteId]);

    // If group is empty, delete it
    const [restantes] = await pool.query('SELECT COUNT(*) as cnt FROM miembros_grupo WHERE grupo_id = ?', [grupoId]);
    if (restantes[0].cnt === 0) {
      await pool.query('DELETE FROM grupos_tarea WHERE id = ?', [grupoId]);
    }

    res.json({ message: 'Has salido del grupo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarGrupo = async (req, res) => {
  try {
    const estudianteId = req.user.estudiante_id;
    const { grupoId } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM grupos_tarea WHERE id = ? AND creado_por = ?',
      [grupoId, estudianteId]
    );
    if (!rows.length) return res.status(403).json({ error: 'Solo el creador puede eliminar el grupo' });

    await pool.query('DELETE FROM grupos_tarea WHERE id = ?', [grupoId]);
    res.json({ message: 'Grupo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
