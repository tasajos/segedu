import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { parseStudentImportExcel } from '../utils/studentImportExcel.js';
import { ensureAuditorSchema } from '../utils/auditorAccess.js';

const normalizeText = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toUpperCase();

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [value];
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [value];
};

// ============ DASHBOARD ============
export const dashboard = async (req, res) => {
  try {
    const [[totUsuarios]] = await pool.query('SELECT COUNT(*) as total FROM usuarios WHERE rol != "admin"');
    const [[totEstudiantes]] = await pool.query('SELECT COUNT(*) as total FROM estudiantes');
    const [[totDocentes]] = await pool.query('SELECT COUNT(*) as total FROM docentes');
    const [[totCarreras]] = await pool.query('SELECT COUNT(*) as total FROM carreras');
    const [[totMaterias]] = await pool.query('SELECT COUNT(*) as total FROM materias');

    const [porRol] = await pool.query(
      'SELECT rol, COUNT(*) as total FROM usuarios GROUP BY rol ORDER BY rol'
    );

    const [carreras] = await pool.query(
      `SELECT c.id, c.nombre, c.codigo,
              u.nombre as jefe_nombre, u.apellido as jefe_apellido,
              (SELECT COUNT(*) FROM estudiantes WHERE carrera_id = c.id) as total_estudiantes,
              (SELECT COUNT(*) FROM materias WHERE carrera_id = c.id) as total_materias
       FROM carreras c
       LEFT JOIN usuarios u ON c.jefe_id = u.id
       ORDER BY c.nombre`
    );

    res.json({
      totales: {
        usuarios: totUsuarios.total,
        estudiantes: totEstudiantes.total,
        docentes: totDocentes.total,
        carreras: totCarreras.total,
        materias: totMaterias.total
      },
      porRol,
      carreras
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ CARRERAS ============
export const listarCarreras = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*,
              u.nombre as jefe_nombre, u.apellido as jefe_apellido, u.email as jefe_email,
              (SELECT COUNT(*) FROM estudiantes WHERE carrera_id = c.id) as total_estudiantes,
              (SELECT COUNT(*) FROM materias WHERE carrera_id = c.id) as total_materias
       FROM carreras c
       LEFT JOIN usuarios u ON c.jefe_id = u.id
       ORDER BY c.nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearCarrera = async (req, res) => {
  try {
    const { nombre, codigo, jefe_id } = req.body;
    if (!nombre || !codigo) return res.status(400).json({ error: 'Nombre y código son requeridos' });
    const [result] = await pool.query(
      'INSERT INTO carreras (nombre, codigo, jefe_id) VALUES (?, ?, ?)',
      [nombre, codigo, jefe_id || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Carrera creada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El código de carrera ya existe' });
    res.status(500).json({ error: err.message });
  }
};

export const actualizarCarrera = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, jefe_id } = req.body;
    await pool.query(
      'UPDATE carreras SET nombre = ?, codigo = ?, jefe_id = ? WHERE id = ?',
      [nombre, codigo, jefe_id || null, id]
    );
    res.json({ message: 'Carrera actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarCarrera = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM carreras WHERE id = ?', [id]);
    res.json({ message: 'Carrera eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ USUARIOS ============
export const listarUsuarios = async (req, res) => {
  try {
    const { rol, email, ci, activo, codigo } = req.query;
    let query = `
      SELECT u.id, u.nombre, u.apellido, u.email, u.rol, u.ci, u.telefono, u.activo, u.created_at,
             CASE
               WHEN u.rol = 'estudiante' THEN (
                 SELECT JSON_OBJECT('id', e.id, 'codigo', e.codigo_estudiante, 'semestre', e.semestre,
                                    'carrera_id', e.carrera_id, 'carrera', c.nombre)
                 FROM estudiantes e LEFT JOIN carreras c ON e.carrera_id = c.id WHERE e.usuario_id = u.id
               )
               WHEN u.rol = 'docente' THEN (
                 SELECT JSON_OBJECT('id', d.id, 'especialidad', d.especialidad, 'titulo', d.titulo)
                 FROM docentes d WHERE d.usuario_id = u.id
               )
               ELSE NULL
             END as perfil
      FROM usuarios u WHERE 1=1`;
    const params = [];
    if (rol) { query += ' AND u.rol = ?'; params.push(rol); }
    if (email) { query += ' AND u.email LIKE ?'; params.push(`%${email}%`); }
    if (ci) { query += ' AND u.ci LIKE ?'; params.push(`%${ci}%`); }
    if (activo === '1' || activo === '0') { query += ' AND u.activo = ?'; params.push(Number(activo)); }
    if (codigo) {
      query += ' AND EXISTS (SELECT 1 FROM estudiantes e WHERE e.usuario_id = u.id AND e.codigo_estudiante LIKE ?)';
      params.push(`%${codigo}%`);
    }
    query += ' ORDER BY u.rol, u.apellido';
    const [rows] = await pool.query(query, params);
    res.json(rows.map(r => ({
      ...r,
      perfil: r.perfil ? (typeof r.perfil === 'string' ? JSON.parse(r.perfil) : r.perfil) : null
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const importarCsvUsuarios = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Debe adjuntar un archivo CSV' });

  const conn = await pool.getConnection();
  try {
    const raw = fs.readFileSync(req.file.path, 'utf8').replace(/^﻿/, '');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) return res.status(400).json({ error: 'El CSV no tiene datos' });

    const headers = lines[0].split(';').map((h) => h.trim().toLowerCase());
    const idx = {
      correo:    headers.indexOf('correo'),
      nombre:    headers.indexOf('nombre'),
      apellidos: headers.indexOf('apellidos'),
      telefono:  headers.indexOf('telefono'),
      password:  headers.indexOf('password'),
      codigo:    headers.indexOf('codigo'),
    };

    const { carrera_id, semestre = 1, fecha_ingreso, prefijo = 'CE' } = req.body;
    const fechaIngreso = fecha_ingreso || new Date().toISOString().split('T')[0];

    const [existingCodes] = await conn.query(
      `SELECT codigo_estudiante FROM estudiantes WHERE codigo_estudiante REGEXP ?`,
      [`^${prefijo}-[0-9]+$`]
    );
    let maxN = existingCodes.reduce((acc, { codigo_estudiante }) => {
      const n = parseInt(codigo_estudiante.split('-').pop(), 10);
      return !isNaN(n) && n > acc ? n : acc;
    }, 0);

    await conn.beginTransaction();

    const result = { created: 0, skipped: 0, errores: [], nuevosUsuarios: [] };
    const seenEmails = new Set();
    let codeN = maxN + 1;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(';').map((p) => p.trim());
      const email    = parts[idx.correo]    || '';
      const nombre   = parts[idx.nombre]    || '';
      const apellido = parts[idx.apellidos] || '';
      const telefono = parts[idx.telefono]  || '';
      const password = parts[idx.password]  || 'password123';
      const codigoCSV = idx.codigo >= 0 ? (parts[idx.codigo] || '') : '';

      if (!email || !nombre) continue;
      if (seenEmails.has(email.toLowerCase())) { result.skipped++; continue; }
      seenEmails.add(email.toLowerCase());

      const [[existing]] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existing) { result.skipped++; continue; }

      try {
        const hash = await bcrypt.hash(password, 10);
        const codigo = codigoCSV || `${prefijo}-${codeN++}`;

        const [ur] = await conn.query(
          'INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          [nombre, apellido, email, hash, 'estudiante', telefono, telefono]
        );

        await conn.query(
          'INSERT INTO estudiantes (usuario_id, carrera_id, semestre, codigo_estudiante, fecha_ingreso) VALUES (?, ?, ?, ?, ?)',
          [ur.insertId, carrera_id || null, semestre || 1, codigo, fechaIngreso]
        );

        result.created++;
        result.nuevosUsuarios.push({ nombre, apellido, email, codigo_estudiante: codigo });
      } catch (rowErr) {
        result.errores.push({ email, error: rowErr.message });
      }
    }

    await conn.commit();
    res.status(201).json({ message: 'Importación completada', ...result });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    conn.release();
  }
};

export const toggleUsuarioActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const [[user]] = await pool.query('SELECT rol, activo FROM usuarios WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.rol === 'admin') return res.status(403).json({ error: 'No se puede deshabilitar al administrador' });
    const nuevoEstado = user.activo ? 0 : 1;
    await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [nuevoEstado, id]);
    res.json({ activo: nuevoEstado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleBulkActivo = async (req, res) => {
  try {
    const { ids, activo } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Se requiere una lista de IDs' });
    if (activo !== 0 && activo !== 1) return res.status(400).json({ error: 'El campo activo debe ser 0 o 1' });
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE usuarios SET activo = ? WHERE id IN (${placeholders}) AND rol != 'admin'`,
      [activo, ...ids]
    );
    res.json({ message: 'Usuarios actualizados', activo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearUsuario = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await ensureAuditorSchema();
    await conn.beginTransaction();
    const { nombre, apellido, email, password, rol, ci, telefono,
            especialidad, titulo,
            carrera_id, semestre, codigo_estudiante, fecha_ingreso } = req.body;

    if (!['estudiante', 'docente', 'jefe', 'admin', 'auditor'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const hash = await bcrypt.hash(password || 'password123', 10);
    const [result] = await conn.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, apellido, email, hash, rol, ci, telefono]
    );
    const userId = result.insertId;

    if (rol === 'docente') {
      await conn.query(
        'INSERT INTO docentes (usuario_id, especialidad, titulo) VALUES (?, ?, ?)',
        [userId, especialidad, titulo]
      );
    } else if (rol === 'estudiante') {
      await conn.query(
        'INSERT INTO estudiantes (usuario_id, carrera_id, semestre, codigo_estudiante, fecha_ingreso) VALUES (?, ?, ?, ?, ?)',
        [userId, carrera_id || null, semestre || 1, codigo_estudiante, fecha_ingreso || null]
      );
    }

    await conn.commit();
    res.status(201).json({ id: userId, message: 'Usuario creado' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El email o código ya existe' });
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

export const importarEstudiantesExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Debe adjuntar un archivo Excel' });
  }

  const conn = await pool.getConnection();

  try {
    const importData = parseStudentImportExcel(req.file.path);
    const {
      carrera_id: carreraIdOverride,
      materia_id: materiaIdOverride,
      materia_ids: materiaIdsRaw,
      semestre,
      fecha_ingreso: fechaIngreso,
      password_inicial: passwordInicial,
      email_domain: emailDomain
    } = req.body;

    const [carreras] = await conn.query('SELECT id, nombre FROM carreras ORDER BY nombre');
    const [materias] = await conn.query(
      'SELECT id, nombre, codigo, grupo, carrera_id, semestre FROM materias ORDER BY nombre, grupo'
    );

    let carrera = null;
    if (carreraIdOverride) {
      carrera = carreras.find((item) => String(item.id) === String(carreraIdOverride)) || null;
    } else if (importData.metadata.carreraNombre) {
      const target = normalizeText(importData.metadata.carreraNombre);
      carrera = carreras.find((item) => normalizeText(item.nombre) === target) || null;
    }

    let materiaDetectada = null;
    if (materiaIdOverride) {
      materiaDetectada = materias.find((item) => String(item.id) === String(materiaIdOverride)) || null;
    } else if (importData.metadata.materiaNombre) {
      const targetName = normalizeText(importData.metadata.materiaNombre);
      const targetGroup = normalizeText(importData.metadata.grupo || '');
      materiaDetectada = materias.find((item) => (
        normalizeText(item.nombre) === targetName &&
        (!targetGroup || normalizeText(item.grupo) === targetGroup) &&
        (!carrera || item.carrera_id === carrera.id)
      )) || null;
    }

    const manualMateriaIds = [
      ...toArray(materiaIdsRaw),
      ...toArray(materiaIdOverride)
    ].map((item) => String(item));

    const materiasSeleccionadas = manualMateriaIds.length > 0
      ? materias.filter((item) => manualMateriaIds.includes(String(item.id)))
      : (materiaDetectada ? [materiaDetectada] : []);

    if (materiasSeleccionadas.length === 0) {
      return res.status(400).json({
        error: 'No se pudo identificar ninguna materia del Excel. Seleccione una o varias materias manualmente.',
        detected: importData.metadata
      });
    }

    if (!carrera) {
      carrera = carreras.find((item) => item.id === materiasSeleccionadas[0].carrera_id) || null;
    }

    if (!carrera) {
      return res.status(400).json({ error: 'No se pudo identificar la carrera para los estudiantes importados' });
    }

    const materiasFueraCarrera = materiasSeleccionadas.filter((item) => item.carrera_id !== carrera.id);
    if (materiasFueraCarrera.length > 0) {
      return res.status(400).json({ error: 'Todas las materias seleccionadas deben pertenecer a la misma carrera' });
    }

    await conn.beginTransaction();

    const emailSuffix = (emailDomain || 'est.uni.edu').replace(/^@+/, '').trim() || 'est.uni.edu';
    const rawPassword = passwordInicial || 'password123';
    const hash = await bcrypt.hash(rawPassword, 10);
    const result = {
      createdUsers: 0,
      reusedStudents: 0,
      enrolled: 0,
      alreadyEnrolled: 0,
      students: importData.students.length,
      nuevosUsuarios: [],
      materias: materiasSeleccionadas.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        grupo: item.grupo
      })),
      detected: importData.metadata
    };

    for (const student of importData.students) {
      const studentCode = student.unicodigo.trim();
      const generatedEmail = `${studentCode}@${emailSuffix}`.toLowerCase();

      const [[existingStudent]] = await conn.query(
        `SELECT e.id, e.usuario_id, e.codigo_estudiante, e.carrera_id, u.email
         FROM estudiantes e
         JOIN usuarios u ON u.id = e.usuario_id
         WHERE e.codigo_estudiante = ? OR u.email = ?
         LIMIT 1`,
        [studentCode, generatedEmail]
      );

      let studentId;

      if (existingStudent) {
        studentId = existingStudent.id;
        result.reusedStudents += 1;

        await conn.query(
          'UPDATE estudiantes SET carrera_id = COALESCE(carrera_id, ?), semestre = COALESCE(semestre, ?) WHERE id = ?',
          [carrera.id, semestre || materiasSeleccionadas[0].semestre || 1, studentId]
        );
      } else {
        const [userResult] = await conn.query(
          'INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [student.nombre, student.apellido, generatedEmail, hash, 'estudiante', studentCode, null]
        );

        const [studentResult] = await conn.query(
          'INSERT INTO estudiantes (usuario_id, carrera_id, semestre, codigo_estudiante, fecha_ingreso) VALUES (?, ?, ?, ?, ?)',
          [userResult.insertId, carrera.id, semestre || materiasSeleccionadas[0].semestre || 1, studentCode, fechaIngreso || null]
        );

        studentId = studentResult.insertId;
        result.createdUsers += 1;
        result.nuevosUsuarios.push({
          id: userResult.insertId,
          estudiante_id: studentResult.insertId,
          nombre: student.nombre,
          apellido: student.apellido,
          email: generatedEmail,
          codigo_estudiante: studentCode
        });
      }

      for (const materia of materiasSeleccionadas) {
        const [enrollResult] = await conn.query(
          'INSERT IGNORE INTO inscripciones (estudiante_id, materia_id) VALUES (?, ?)',
          [studentId, materia.id]
        );

        if (enrollResult.affectedRows > 0) {
          result.enrolled += 1;
        } else {
          result.alreadyEnrolled += 1;
        }
      }
    }

    await conn.commit();
    res.status(201).json({
      message: 'Importación completada',
      ...result
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Se encontraron datos duplicados durante la importación' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    conn.release();
  }
};

export const actualizarUsuario = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await ensureAuditorSchema();
    await conn.beginTransaction();
    const { id } = req.params;
    const { nombre, apellido, email, ci, telefono,
            especialidad, titulo,
            carrera_id, semestre, codigo_estudiante, rol } = req.body;

    const [[user]] = await conn.query('SELECT rol FROM usuarios WHERE id = ?', [id]);
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const nuevoRol = rol || user.rol;
    if (!['estudiante', 'docente', 'jefe', 'admin', 'auditor'].includes(nuevoRol)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Rol inválido' });
    }
    if (user.rol === 'admin' && nuevoRol !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ error: 'No se puede cambiar el rol del administrador' });
    }
    await conn.query(
      'UPDATE usuarios SET nombre=?, apellido=?, email=?, ci=?, telefono=?, rol=? WHERE id=?',
      [nombre, apellido, email, ci, telefono, nuevoRol, id]
    );
    if (user.rol === 'jefe' && nuevoRol !== 'jefe') {
      await conn.query('UPDATE carreras SET jefe_id = NULL WHERE jefe_id = ?', [id]);
    }

    if (nuevoRol === 'docente' && user.rol === 'docente') {
      await conn.query(
        'UPDATE docentes SET especialidad=?, titulo=? WHERE usuario_id=?',
        [especialidad, titulo, id]
      );
    } else if (nuevoRol === 'estudiante' && user.rol === 'estudiante') {
      await conn.query(
        'UPDATE estudiantes SET carrera_id=?, semestre=?, codigo_estudiante=? WHERE usuario_id=?',
        [carrera_id || null, semestre || 1, codigo_estudiante, id]
      );
    }

    await conn.commit();
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.rol === 'admin') return res.status(403).json({ error: 'No se puede eliminar al administrador' });
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarJefes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.ci,
              c.id as carrera_id, c.nombre as carrera_nombre
       FROM usuarios u
       LEFT JOIN carreras c ON c.jefe_id = u.id
       WHERE u.rol = 'jefe'
       ORDER BY u.apellido`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const hash = await bcrypt.hash(password || 'password123', 10);
    await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, id]);
    res.json({ message: 'Contraseña restablecida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ MATERIAS ============
export const listarMaterias = async (req, res) => {
  try {
    const { carrera_id } = req.query;
    let query = `
      SELECT m.*, c.nombre as carrera_nombre, c.codigo as carrera_codigo,
             u.nombre as docente_nombre, u.apellido as docente_apellido,
             d.id as docente_id_perfil, d.especialidad,
             (SELECT COUNT(*) FROM inscripciones WHERE materia_id = m.id) as total_estudiantes
      FROM materias m
      JOIN carreras c ON m.carrera_id = c.id
      LEFT JOIN docentes d ON m.docente_id = d.id
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      WHERE 1=1`;
    const params = [];
    if (carrera_id) { query += ' AND m.carrera_id = ?'; params.push(carrera_id); }
    query += ' ORDER BY c.nombre, m.semestre, m.nombre';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const obtenerMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const [[materia]] = await pool.query(
      `SELECT m.*, c.nombre as carrera_nombre, c.codigo as carrera_codigo,
              u.nombre as docente_nombre, u.apellido as docente_apellido
       FROM materias m
       JOIN carreras c ON m.carrera_id = c.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE m.id = ?`,
      [id]
    );

    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    res.json(materia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearMateria = async (req, res) => {
  try {
    const { nombre, codigo, grupo, carrera_id, docente_id, semestre, creditos } = req.body;
    if (!nombre || !codigo || !carrera_id || !semestre) {
      return res.status(400).json({ error: 'Nombre, código, carrera y semestre son requeridos' });
    }
    const [result] = await pool.query(
      'INSERT INTO materias (nombre, codigo, grupo, carrera_id, docente_id, semestre, creditos) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, codigo.toUpperCase(), (grupo || 'A').toUpperCase(), carrera_id, docente_id || null, semestre, creditos || 4]
    );
    res.status(201).json({ id: result.insertId, message: 'Materia creada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe ese código/grupo en esta carrera' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const actualizarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, grupo, carrera_id, docente_id, semestre, creditos } = req.body;
    await pool.query(
      'UPDATE materias SET nombre=?, codigo=?, grupo=?, carrera_id=?, docente_id=?, semestre=?, creditos=? WHERE id=?',
      [nombre, codigo.toUpperCase(), (grupo || 'A').toUpperCase(), carrera_id, docente_id || null, semestre, creditos || 4, id]
    );
    res.json({ message: 'Materia actualizada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe ese código/grupo en esta carrera' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const eliminarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM materias WHERE id = ?', [id]);
    res.json({ message: 'Materia eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listarDocentesAdmin = async (req, res) => {
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

export const listarUsuariosEquipo = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, apellido, email, rol FROM usuarios WHERE activo = 1 ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
