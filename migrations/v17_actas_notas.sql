-- ============================================================
-- Migracion v17: Actas de notas y detalle de evaluacion
-- ============================================================

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
);

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
);

DROP PROCEDURE IF EXISTS _ensure_grade_report_detail_cols;
DELIMITER $$
CREATE PROCEDURE _ensure_grade_report_detail_cols()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'grade_report_details'
      AND COLUMN_NAME = 'modalidad'
  ) THEN
    ALTER TABLE grade_report_details
      ADD COLUMN modalidad ENUM('regular', 'segunda_instancia', 'examen_mesa', 'examen_gracia') NOT NULL DEFAULT 'regular';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'grade_report_details'
      AND COLUMN_NAME = 'primer_parcial'
  ) THEN
    ALTER TABLE grade_report_details
      ADD COLUMN primer_parcial DECIMAL(5,2) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'grade_report_details'
      AND COLUMN_NAME = 'segundo_parcial'
  ) THEN
    ALTER TABLE grade_report_details
      ADD COLUMN segundo_parcial DECIMAL(5,2) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'grade_report_details'
      AND COLUMN_NAME = 'examen_final'
  ) THEN
    ALTER TABLE grade_report_details
      ADD COLUMN examen_final DECIMAL(5,2) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'grade_report_details'
      AND COLUMN_NAME = 'examen_recuperacion'
  ) THEN
    ALTER TABLE grade_report_details
      ADD COLUMN examen_recuperacion DECIMAL(5,2) NULL;
  END IF;
END$$
DELIMITER ;
CALL _ensure_grade_report_detail_cols();
DROP PROCEDURE IF EXISTS _ensure_grade_report_detail_cols;
