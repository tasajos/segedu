import pool from '../config/db.js';

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
