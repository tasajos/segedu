import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

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
    const { rol } = req.query;
    let query = `
      SELECT u.id, u.nombre, u.apellido, u.email, u.rol, u.ci, u.telefono, u.created_at,
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
      FROM usuarios u WHERE u.rol != 'admin'`;
    const params = [];
    if (rol) { query += ' AND u.rol = ?'; params.push(rol); }
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

export const crearUsuario = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { nombre, apellido, email, password, rol, ci, telefono,
            especialidad, titulo,
            carrera_id, semestre, codigo_estudiante, fecha_ingreso } = req.body;

    if (!['estudiante', 'docente', 'jefe'].includes(rol)) {
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

export const actualizarUsuario = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { nombre, apellido, email, ci, telefono,
            especialidad, titulo,
            carrera_id, semestre, codigo_estudiante } = req.body;

    const [[user]] = await conn.query('SELECT rol FROM usuarios WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await conn.query(
      'UPDATE usuarios SET nombre=?, apellido=?, email=?, ci=?, telefono=? WHERE id=?',
      [nombre, apellido, email, ci, telefono, id]
    );

    if (user.rol === 'docente') {
      await conn.query(
        'UPDATE docentes SET especialidad=?, titulo=? WHERE usuario_id=?',
        [especialidad, titulo, id]
      );
    } else if (user.rol === 'estudiante') {
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

export const crearMateria = async (req, res) => {
  try {
    const { nombre, codigo, carrera_id, docente_id, semestre, creditos } = req.body;
    if (!nombre || !codigo || !carrera_id || !semestre) {
      return res.status(400).json({ error: 'Nombre, código, carrera y semestre son requeridos' });
    }
    const [result] = await pool.query(
      'INSERT INTO materias (nombre, codigo, carrera_id, docente_id, semestre, creditos) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, codigo.toUpperCase(), carrera_id, docente_id || null, semestre, creditos || 4]
    );
    res.status(201).json({ id: result.insertId, message: 'Materia creada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una materia con ese código en esta carrera' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const actualizarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, carrera_id, docente_id, semestre, creditos } = req.body;
    await pool.query(
      'UPDATE materias SET nombre=?, codigo=?, carrera_id=?, docente_id=?, semestre=?, creditos=? WHERE id=?',
      [nombre, codigo.toUpperCase(), carrera_id, docente_id || null, semestre, creditos || 4, id]
    );
    res.json({ message: 'Materia actualizada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una materia con ese código en esta carrera' });
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
