-- ============================================================
-- Migracion v18: Carpeta pedagogica por docente y materia/grupo
-- ============================================================

CREATE TABLE IF NOT EXISTS pedagogical_folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  docente_id INT NOT NULL,
  materia_id INT NOT NULL,
  data LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_pedagogical_folder (docente_id, materia_id),
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
);
