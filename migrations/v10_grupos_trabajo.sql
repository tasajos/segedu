-- ============================================================
-- Migración v10: Grupos de trabajo creados por docente
-- Aplicar en producción: mysql -u root -p uni_tracking < v10_grupos_trabajo.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Grupos de trabajo definidos por el docente por materia
CREATE TABLE IF NOT EXISTS grupos_trabajo (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  materia_id      INT NOT NULL,
  docente_id      INT NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT,
  fecha_creacion  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (materia_id)  REFERENCES materias(id)  ON DELETE CASCADE,
  FOREIGN KEY (docente_id)  REFERENCES docentes(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Estudiantes asignados a cada grupo de trabajo
CREATE TABLE IF NOT EXISTS miembros_grupo_trabajo (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id       INT NOT NULL,
  estudiante_id  INT NOT NULL,
  fecha_union    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_miembro_grupo (grupo_id, estudiante_id),
  FOREIGN KEY (grupo_id)      REFERENCES grupos_trabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tareas asignadas a cada grupo de trabajo
CREATE TABLE IF NOT EXISTS tareas_grupo_trabajo (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id         INT NOT NULL,
  tarea_id         INT NOT NULL,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tarea_grupo (grupo_id, tarea_id),
  FOREIGN KEY (grupo_id) REFERENCES grupos_trabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tarea_id) REFERENCES tareas(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
