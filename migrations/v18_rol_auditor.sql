ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('admin','jefe','docente','estudiante','instructor','auditor') NOT NULL;

CREATE TABLE IF NOT EXISTS auditor_career_selections (
  usuario_id INT PRIMARY KEY,
  carrera_id INT NOT NULL,
  docente_id INT NULL,
  estudiante_id INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE
);

ALTER TABLE auditor_career_selections ADD COLUMN IF NOT EXISTS docente_id INT NULL AFTER carrera_id;
ALTER TABLE auditor_career_selections ADD COLUMN IF NOT EXISTS estudiante_id INT NULL AFTER docente_id;
