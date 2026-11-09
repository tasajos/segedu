CREATE TABLE IF NOT EXISTS videotutoriales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  materia_id INT NOT NULL,
  docente_id INT NOT NULL,
  titulo VARCHAR(250) NOT NULL,
  descripcion TEXT NULL,
  drive_file_id VARCHAR(128) NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  tamano_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_videotutorial_drive_file (drive_file_id),
  INDEX idx_videotutorial_materia (materia_id, created_at),
  INDEX idx_videotutorial_docente (docente_id),
  CONSTRAINT fk_videotutorial_materia FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  CONSTRAINT fk_videotutorial_docente FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
