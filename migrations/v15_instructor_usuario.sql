-- ============================================================
-- Migración v15: Instructor como usuario del sistema
-- ============================================================

-- 1. Agregar 'instructor' al ENUM de roles (idempotente vía modificación)
ALTER TABLE usuarios MODIFY COLUMN rol ENUM('admin','jefe','docente','estudiante','instructor') NOT NULL;

-- 2. Vincular instructores_cursos con usuarios
DROP PROCEDURE IF EXISTS _add_instructor_usuario_id;
DELIMITER $$
CREATE PROCEDURE _add_instructor_usuario_id()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'instructores_cursos'
      AND COLUMN_NAME  = 'usuario_id'
  ) THEN
    ALTER TABLE instructores_cursos
      ADD COLUMN usuario_id INT NULL AFTER id,
      ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
  END IF;
END$$
DELIMITER ;
CALL _add_instructor_usuario_id();
DROP PROCEDURE IF EXISTS _add_instructor_usuario_id;
