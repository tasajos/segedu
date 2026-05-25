-- ============================================================
-- Migración 005 — Unidad de instrucción: Analizador de mercado
-- Fecha: 2026-05-25
-- Descripción: Agrega la unidad interactiva "Analizador de
--   mercado con IA — Bolivia" que usa la API de Google Gemini.
--   Requiere que GEMINI_API_KEY esté configurada en el .env
--   del servidor backend.
--   carrera_id = NULL → visible para todas las carreras.
-- ============================================================

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, carrera_id, orden, creado_por, activo)
VALUES (
  'Analizador de mercado con IA — Bolivia',
  'Ingresa tu idea de negocio y la IA analiza negocios similares en Bolivia, tendencias del mercado y viabilidad de éxito. Genera un reporte descargable en PDF.',
  'simulador',
  NULL,
  5,
  (SELECT id FROM usuarios WHERE rol IN ('jefe', 'admin') ORDER BY id ASC LIMIT 1),
  1
);
