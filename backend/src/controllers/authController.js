import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Datos adicionales según rol
    let extra = {};
    if (user.rol === 'estudiante') {
      const [est] = await pool.query(
        `SELECT e.*, c.nombre as carrera_nombre FROM estudiantes e
         LEFT JOIN carreras c ON e.carrera_id = c.id WHERE e.usuario_id = ?`,
        [user.id]
      );
      if (est[0]) extra = { estudiante_id: est[0].id, semestre: est[0].semestre, carrera: est[0].carrera_nombre, codigo_estudiante: est[0].codigo_estudiante };
    } else if (user.rol === 'docente') {
      const [doc] = await pool.query('SELECT * FROM docentes WHERE usuario_id = ?', [user.id]);
      if (doc[0]) extra = { docente_id: doc[0].id, especialidad: doc[0].especialidad };
    }

    const payload = { id: user.id, email: user.email, rol: user.rol, ...extra };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        ci: user.ci,
        telefono: user.telefono,
        ...extra
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol, ci, telefono } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, apellido, email, hash, rol, ci, telefono]
    );
    res.status(201).json({ id: result.insertId, message: 'Usuario creado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, apellido, email, rol, ci, telefono, foto FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nombre, apellido, ci, telefono } = req.body;
    await pool.query(
      'UPDATE usuarios SET nombre = ?, apellido = ?, ci = ?, telefono = ? WHERE id = ?',
      [nombre, apellido, ci, telefono, req.user.id]
    );
    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};
