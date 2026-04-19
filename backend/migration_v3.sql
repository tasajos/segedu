-- =====================================================
-- SEGEDU v3 - Materias: permitir mismo código en distintas carreras
-- Ejecutar en: uni_tracking
-- =====================================================
USE uni_tracking;

-- Eliminar el UNIQUE sobre solo `codigo` y reemplazar por UNIQUE (codigo, carrera_id)
ALTER TABLE materias DROP INDEX codigo;
ALTER TABLE materias ADD UNIQUE KEY unique_codigo_carrera (codigo, carrera_id);

SELECT 'Migración v3 completada: materias pueden repetirse en distintas carreras' AS resultado;
