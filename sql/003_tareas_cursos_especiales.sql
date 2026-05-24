-- ============================================================
-- Migración 003 — Tareas de cursos especiales
-- Fecha: 2026-05-24
-- Descripción: Agrega tablas para el sistema de tareas en
--   cursos especiales: creación por instructor, entrega por
--   estudiante y calificación por instructor.
-- ============================================================

-- 1. Agregar columna publico_general en cursos_especiales
--    (permite que estudiantes sin carrera vean el curso)
ALTER TABLE cursos_especiales
  ADD COLUMN IF NOT EXISTS publico_general TINYINT(1) NOT NULL DEFAULT 0 AFTER activo;

-- 2. Tabla de tareas creadas por el instructor del curso
CREATE TABLE IF NOT EXISTS tareas_cursos_especiales (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  curso_id       INT          NOT NULL,
  titulo         VARCHAR(200) NOT NULL,
  descripcion    TEXT,
  fecha_entrega  DATETIME     NULL,
  archivo_nombre VARCHAR(300) NULL,
  archivo_path   VARCHAR(500) NULL,
  tipo_archivo   ENUM('pdf','word') NULL,
  creado_por     INT          NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curso_id)   REFERENCES cursos_especiales(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- 3. Tabla de entregas de los estudiantes inscritos
CREATE TABLE IF NOT EXISTS entregas_tareas_cursos_especiales (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  tarea_id                INT          NOT NULL,
  estudiante_id           INT          NOT NULL,
  archivo_nombre          VARCHAR(300) NOT NULL,
  archivo_path            VARCHAR(500) NOT NULL,
  fecha_entrega           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  calificacion            DECIMAL(4,2) NULL,
  comentario_calificacion TEXT         NULL,
  fecha_calificacion      DATETIME     NULL,
  visto_por_instructor    TINYINT(1)   NOT NULL DEFAULT 0,
  UNIQUE KEY uq_entrega_esp (tarea_id, estudiante_id),
  FOREIGN KEY (tarea_id)      REFERENCES tareas_cursos_especiales(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);
