-- ============================================================
-- Migración v12: Unidad de instrucción — Armar una PC
-- Aplicar en producción: mysql -u root -p uni_tracking < v12_unidad_armar_pc.sql
-- ============================================================

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, carrera_id, orden, activo, creado_por)
VALUES (
  'Armar una PC',
  'Simulador interactivo de ensamblaje de computadoras: selecciona procesador, tarjeta madre, RAM, almacenamiento, GPU, fuente, refrigeración, gabinete y más. El sistema verifica compatibilidad, indica si la PC enciende y genera un reporte de gama y precio estimado.',
  'simulador',
  NULL,
  3,
  1,
  NULL
);
