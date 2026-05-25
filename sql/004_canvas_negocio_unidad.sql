-- ============================================================
-- Migración 004 — Unidad de instrucción: Canvas inteligente
-- Fecha: 2026-05-24
-- Descripción: Agrega la unidad interactiva "Canvas inteligente
--   — Modelo de negocio" a la tabla unidades_instruccion.
--   carrera_id = NULL → visible para todas las carreras.
-- ============================================================

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, carrera_id, orden, creado_por, activo)
VALUES (
  'Canvas inteligente — Modelo de negocio',
  'Construye tu modelo Canvas usando IA como asesor. Selecciona un rol de asesor IA, completa cada bloque del Business Model Canvas y copia prompts generados para usar con ChatGPT, Claude o Gemini.',
  'simulador',
  NULL,
  4,
  (SELECT id FROM usuarios WHERE rol IN ('jefe', 'admin') ORDER BY id ASC LIMIT 1),
  1
);
