-- ============================================================
-- Migración v13: Cursos especiales (tipo Coursera) por Jefe de Carrera
-- Aplicar: mysql -u root -p uni_tracking < v13_cursos_especiales.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS cursos_especiales (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  requisitos      TEXT,
  max_estudiantes INT         NOT NULL DEFAULT 30,
  carrera_id      INT         NULL,
  activo          TINYINT(1)  NOT NULL DEFAULT 1,
  creado_por      INT         NOT NULL,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS inscripciones_cursos_especiales (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  curso_id          INT      NOT NULL,
  estudiante_id     INT      NOT NULL,
  fecha_inscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curso_id)      REFERENCES cursos_especiales(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)       ON DELETE CASCADE,
  UNIQUE KEY uq_inscripcion (curso_id, estudiante_id)
);
