-- ============================================================
-- Migración 006 — Unidad de instrucción: Sprint de Validación Lean
-- Fecha: 2026-05-26
-- Descripción: Agrega la unidad interactiva "Sprint de
--   Validación Lean" que usa IA para simular respuestas de
--   clientes y emitir veredicto Perseverar/Pivotar.
--   Requiere ANTHROPIC_API_KEY en el .env del servidor.
--   carrera_id = NULL → visible para todas las carreras.
-- ============================================================

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, carrera_id, orden, creado_por, activo)
VALUES (
  'Sprint de Validación Lean',
  'Formula tu hipótesis de negocio, diseña un experimento ágil y deja que la IA simule 8 clientes potenciales para validar tu idea. Obtén un veredicto: Perseverar, Pivotar parcialmente o Pivotar.',
  'simulador',
  NULL,
  6,
  (SELECT id FROM usuarios WHERE rol IN ('jefe', 'admin') ORDER BY id ASC LIMIT 1),
  1
);
