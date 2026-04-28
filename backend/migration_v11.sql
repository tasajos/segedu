-- =====================================================
-- Migration v11: Soporte Word en tareas + notif. entregas
-- =====================================================
USE uni_tracking;

-- Ampliar ENUM para soportar documentos Word
ALTER TABLE tareas MODIFY COLUMN tipo_archivo ENUM('pdf','pptx','word') NULL;

-- Columna para que el docente sepa si hay entregas nuevas sin revisar
ALTER TABLE entregas_tareas
  ADD COLUMN IF NOT EXISTS visto_por_docente TINYINT(1) NOT NULL DEFAULT 0;
