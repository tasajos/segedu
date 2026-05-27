-- ============================================================
-- Migración 007 — Unidad de instrucción: Pitch Arena
-- Fecha: 2026-05-26
-- Descripción: Agrega la unidad interactiva "Pitch Arena —
--   Simulador de presentación emprendedora" que usa IA para
--   generar escenarios únicos de pitch y evaluar la presentación
--   del estudiante en 5 dimensiones.
--   Requiere ANTHROPIC_API_KEY en el .env del servidor.
--   carrera_id = NULL → visible para todas las carreras.
-- ============================================================

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, carrera_id, orden, creado_por, activo)
VALUES (
  'Pitch Arena',
  'Responde 6 preguntas de diagnóstico sobre tu idea, recibe un escenario único de pitch generado por IA (tipo de evaluador, condición especial, pregunta crítica) y presenta tu propuesta. Obtén una evaluación en 5 dimensiones con el pitch ideal y lineamientos de éxito y fracaso.',
  'simulador',
  NULL,
  7,
  (SELECT id FROM usuarios WHERE rol IN ('jefe', 'admin') ORDER BY id ASC LIMIT 1),
  1
);
