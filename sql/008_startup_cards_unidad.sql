-- ============================================================
-- Migración 008 — Unidad de instrucción: Startup Cards
-- Fecha: 2026-05-29
-- Descripción: Agrega la unidad interactiva "Startup Cards —
--   Constructor de empresa" donde la IA genera 15 cartas de
--   rubros de negocio tipo juego de cartas. El estudiante elige
--   5, define su marca (nombre, colores, eslogan) y la IA
--   construye: análisis de mercado para Cochabamba, nivel de
--   impacto, 5 personajes clave bolivianos reales como directivos
--   y el organigrama jerárquico.
--   Requiere ANTHROPIC_API_KEY en el .env del servidor.
--   carrera_id = NULL → visible para todas las carreras.
-- ============================================================

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, carrera_id, orden, creado_por, activo)
VALUES (
  'Startup Cards',
  'La IA genera 15 cartas de rubros de negocio. Elige 5 que combinen bien, define el nombre, colores y eslogan de tu empresa, y la IA construye el análisis de mercado para Cochabamba, sugiere personajes clave bolivianos reales como directivos y arma el organigrama jerárquico.',
  'simulador',
  NULL,
  8,
  (SELECT id FROM usuarios WHERE rol IN ('jefe', 'admin') ORDER BY id ASC LIMIT 1),
  1
);
