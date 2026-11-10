import pool from '../config/db.js';
import { sendMail } from './mailer.js';

const PERMISSION_EMAIL_TO = 'cazcarraga@chakuy.com';
const TIPO_LABELS = { carta_permiso: 'Carta de permiso', justificacion: 'Justificación' };

let schemaEnsured = false;

export const ensureStudentPermissionSchema = async () => {
  if (schemaEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_permission_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      estudiante_id INT NOT NULL,
      materia_id INT NOT NULL,
      tipo ENUM('carta_permiso', 'justificacion') NOT NULL DEFAULT 'justificacion',
      fecha_desde DATE NOT NULL,
      fecha_hasta DATE NOT NULL,
      horas_detalle VARCHAR(255) NULL,
      detalle TEXT NULL,
      documento_url VARCHAR(500) NULL,
      registrado_por INT NOT NULL,
      estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
      observacion_jefe TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
      FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
      FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

  // Add columns if the table pre-existed without them (MySQL 8 compatible)
  for (const alter of [
    `ALTER TABLE student_permission_requests ADD COLUMN estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente'`,
    `ALTER TABLE student_permission_requests ADD COLUMN observacion_jefe TEXT NULL`
  ]) {
    try { await pool.query(alter); } catch { /* column already exists */ }
  }

  schemaEnsured = true;
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const formatFecha = (fecha) => String(fecha).split('-').reverse().join('/');

// Multer entrega el nombre original en latin1 aunque el navegador lo envíe en UTF-8.
const originalFilename = (file) => Buffer.from(file.originalname, 'latin1').toString('utf8');

// No se espera ni lanza: un fallo de correo no debe afectar a la solicitud ya guardada.
export const notifyPermissionRequest = async ({ id, estudianteId, materiaId, datos, archivo, registradoPorId }) => {
  try {
    const [[info]] = await pool.query(
      `SELECT u.nombre, u.apellido, u.email, e.codigo_estudiante, c.nombre AS carrera,
              m.nombre AS materia, m.codigo AS materia_codigo, m.grupo AS materia_grupo,
              du.nombre AS docente_nombre, du.apellido AS docente_apellido, du.email AS docente_email,
              ru.nombre AS registrado_nombre, ru.apellido AS registrado_apellido, ru.rol AS registrado_rol
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       JOIN materias m ON m.id = ?
       JOIN usuarios ru ON ru.id = ?
       LEFT JOIN carreras c ON e.carrera_id = c.id
       LEFT JOIN docentes d ON m.docente_id = d.id
       LEFT JOIN usuarios du ON d.usuario_id = du.id
       WHERE e.id = ?`,
      [materiaId, registradoPorId, estudianteId]
    );
    if (!info) throw new Error(`Sin datos para la solicitud ${id}`);

    const estudiante = `${info.nombre} ${info.apellido}`;
    const nombreArchivo = archivo ? originalFilename(archivo) : null;
    const campos = [
      ['Estudiante', estudiante],
      ['Código', info.codigo_estudiante || '-'],
      ['Correo', info.email],
      ['Carrera', info.carrera || '-'],
      ['Materia', `${info.materia} (${info.materia_codigo}) - Grupo ${info.materia_grupo}`],
      ['Docente', info.docente_nombre ? `${info.docente_nombre} ${info.docente_apellido}` : 'Sin docente asignado'],
      ['Tipo', TIPO_LABELS[datos.tipo] || datos.tipo],
      ['Desde', formatFecha(datos.fecha_desde)],
      ['Hasta', formatFecha(datos.fecha_hasta)],
      ['Horas', datos.horas_detalle || '-'],
      ['Detalle', datos.detalle || '-'],
      ['Documento adjunto', nombreArchivo || 'Ninguno'],
      ['Registrado por', `${info.registrado_nombre} ${info.registrado_apellido} (${info.registrado_rol})`]
    ];

    const filas = campos.map(([label, value]) => `
      <tr>
        <th align="left" valign="top" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th>
        <td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value)}</td>
      </tr>`).join('');

    await sendMail({
      to: PERMISSION_EMAIL_TO,
      cc: info.docente_email || undefined,
      subject: `Solicitud de permiso #${id} - ${estudiante} - ${info.materia}`,
      text: campos.map(([label, value]) => `${label}: ${value}`).join('\n'),
      html: `<h2>Nueva solicitud de permiso #${id}</h2><table style="border-collapse:collapse">${filas}</table>`,
      attachments: archivo ? [{ filename: nombreArchivo, path: archivo.path }] : []
    });
  } catch (err) {
    console.error(`[Correo] No se pudo notificar la solicitud de permiso ${id}:`, err.message);
  }
};
