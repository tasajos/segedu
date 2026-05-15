-- ============================================================
-- Migración v14: Extensión de cursos especiales (idempotente)
-- El backend auto-crea las tablas al arrancar; esta migración
-- es equivalente y segura de correr en cualquier estado.
-- ============================================================

-- ── 1. estado en inscripciones (solo si no existe) ────────────────────────
DROP PROCEDURE IF EXISTS _add_col_estado;
DELIMITER $$
CREATE PROCEDURE _add_col_estado()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'inscripciones_cursos_especiales'
      AND COLUMN_NAME  = 'estado'
  ) THEN
    ALTER TABLE inscripciones_cursos_especiales
      ADD COLUMN estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente'
      AFTER estudiante_id;
  END IF;
END$$
DELIMITER ;
CALL _add_col_estado();
DROP PROCEDURE IF EXISTS _add_col_estado;

-- ── 2. Tabla de instructores ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instructores_cursos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100),
  email         VARCHAR(150),
  especialidad  VARCHAR(200),
  carrera_id    INT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL
);

-- ── 3. instructor_id en cursos_especiales (solo si no existe) ─────────────
DROP PROCEDURE IF EXISTS _add_col_instructor;
DELIMITER $$
CREATE PROCEDURE _add_col_instructor()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'cursos_especiales'
      AND COLUMN_NAME  = 'instructor_id'
  ) THEN
    ALTER TABLE cursos_especiales
      ADD COLUMN instructor_id INT NULL AFTER carrera_id,
      ADD FOREIGN KEY (instructor_id) REFERENCES instructores_cursos(id) ON DELETE SET NULL;
  END IF;
END$$
DELIMITER ;
CALL _add_col_instructor();
DROP PROCEDURE IF EXISTS _add_col_instructor;

-- ── 4. Material ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS material_cursos_especiales (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  curso_id     INT NOT NULL,
  titulo       VARCHAR(200) NOT NULL,
  archivo_path VARCHAR(500) NOT NULL,
  tipo_archivo VARCHAR(50),
  creado_por   INT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curso_id)   REFERENCES cursos_especiales(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- ── 5. Asistencia ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asistencia_cursos_especiales (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  curso_id       INT NOT NULL,
  estudiante_id  INT NOT NULL,
  fecha          DATE NOT NULL,
  estado         ENUM('presente','falta','permiso') NOT NULL DEFAULT 'presente',
  registrado_por INT NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asist (curso_id, estudiante_id, fecha),
  FOREIGN KEY (curso_id)       REFERENCES cursos_especiales(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id)  REFERENCES estudiantes(id)       ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- ── 6. Notas ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notas_cursos_especiales (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  curso_id       INT NOT NULL,
  estudiante_id  INT NOT NULL,
  nota           DECIMAL(5,2),
  descripcion    TEXT,
  registrado_por INT NOT NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_nota (curso_id, estudiante_id),
  FOREIGN KEY (curso_id)       REFERENCES cursos_especiales(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id)  REFERENCES estudiantes(id)       ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);
