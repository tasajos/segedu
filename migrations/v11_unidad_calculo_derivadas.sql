-- ============================================================
-- Migración v11: Unidad de instrucción — Cálculo / Derivadas
-- Aplicar en producción: mysql -u root -p uni_tracking < v11_unidad_calculo_derivadas.sql
-- ============================================================

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, carrera_id, orden, activo, creado_por)
VALUES (
  'Cálculo — Derivadas',
  'Simulador interactivo: ingresa una función f(x) y un punto P para calcular la derivada, pendiente, recta tangente, recta normal y visualizar la gráfica en tiempo real.',
  'simulador',
  NULL,
  2,
  1,
  NULL
);
