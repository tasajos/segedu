-- ============================================================
-- Migración v16: Soporte de enlaces (Google Drive, etc.) en material
-- ============================================================

DROP PROCEDURE IF EXISTS _add_material_enlace_cols;
DELIMITER $$
CREATE PROCEDURE _add_material_enlace_cols()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'material_cursos_especiales'
      AND COLUMN_NAME  = 'tipo_material'
  ) THEN
    ALTER TABLE material_cursos_especiales
      ADD COLUMN tipo_material ENUM('archivo','enlace') NOT NULL DEFAULT 'archivo' AFTER titulo,
      ADD COLUMN url VARCHAR(500) NULL AFTER tipo_material;
  END IF;
END$$
DELIMITER ;
CALL _add_material_enlace_cols();
DROP PROCEDURE IF EXISTS _add_material_enlace_cols;
