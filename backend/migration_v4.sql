-- =====================================================
-- SEGEDU v4 - Materias: agregar campo grupo (A, B, C, ...)
-- Ejecutar en: uni_tracking
-- =====================================================
USE uni_tracking;

-- Agregar columna grupo
ALTER TABLE materias ADD COLUMN grupo VARCHAR(10) NOT NULL DEFAULT 'A' AFTER codigo;

-- Actualizar la clave única: mismo código+carrera puede existir en distintos grupos
ALTER TABLE materias DROP INDEX unique_codigo_carrera;
ALTER TABLE materias ADD UNIQUE KEY unique_codigo_carrera_grupo (codigo, carrera_id, grupo);

SELECT 'Migración v4 completada: materias soportan múltiples grupos (A, B, C...)' AS resultado;
