import pool from '../config/db.js';

let gradeSchemaEnsured = false;

export const PASSING_GRADE = 51;
export const GRADE_MODALITIES = {
  regular: {
    label: 'Regular',
    passing: 51,
    maxTotal: 100
  },
  segunda_instancia: {
    label: 'Segunda instancia',
    passing: 26,
    maxTotal: 51
  },
  examen_mesa: {
    label: 'Examen de mesa',
    passing: 26,
    maxTotal: 51
  },
  examen_gracia: {
    label: 'Examen de gracia',
    passing: 51,
    maxTotal: 100
  }
};

export const ensureGradeReportSchema = async () => {
  if (gradeSchemaEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS grade_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      materia_id INT NOT NULL UNIQUE,
      periodo VARCHAR(50) NULL,
      observaciones TEXT NULL,
      archivo_url VARCHAR(500) NULL,
      cargado_por INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
      FOREIGN KEY (cargado_por) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS grade_report_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      acta_id INT NOT NULL,
      estudiante_id INT NOT NULL,
      modalidad ENUM('regular', 'segunda_instancia', 'examen_mesa', 'examen_gracia') NOT NULL DEFAULT 'regular',
      primer_parcial DECIMAL(5,2) NULL,
      segundo_parcial DECIMAL(5,2) NULL,
      examen_final DECIMAL(5,2) NULL,
      examen_recuperacion DECIMAL(5,2) NULL,
      nota_final DECIMAL(5,2) NOT NULL DEFAULT 0,
      estado ENUM('aprobado', 'reprobado') NOT NULL,
      UNIQUE KEY unique_grade_report_student (acta_id, estudiante_id),
      FOREIGN KEY (acta_id) REFERENCES grade_reports(id) ON DELETE CASCADE,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
    )
  `);

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grade_report_details'`
  );
  const existing = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existing.has('modalidad')) {
    await pool.query("ALTER TABLE grade_report_details ADD COLUMN modalidad ENUM('regular', 'segunda_instancia', 'examen_mesa', 'examen_gracia') NOT NULL DEFAULT 'regular'");
  }
  if (!existing.has('primer_parcial')) {
    await pool.query('ALTER TABLE grade_report_details ADD COLUMN primer_parcial DECIMAL(5,2) NULL');
  }
  if (!existing.has('segundo_parcial')) {
    await pool.query('ALTER TABLE grade_report_details ADD COLUMN segundo_parcial DECIMAL(5,2) NULL');
  }
  if (!existing.has('examen_final')) {
    await pool.query('ALTER TABLE grade_report_details ADD COLUMN examen_final DECIMAL(5,2) NULL');
  }
  if (!existing.has('examen_recuperacion')) {
    await pool.query('ALTER TABLE grade_report_details ADD COLUMN examen_recuperacion DECIMAL(5,2) NULL');
  }

  gradeSchemaEnsured = true;
};
