-- =====================================================
-- SEGEDU v5 - PGO: tareas generadas desde contenidos de unidad
-- Ejecutar en: uni_tracking
-- =====================================================
USE uni_tracking;

CREATE TABLE IF NOT EXISTS pgo_tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pgo_id INT NOT NULL,
  materia_id INT NOT NULL,
  docente_id INT NOT NULL,
  unidad_codigo VARCHAR(30),
  unidad_nombre VARCHAR(255),
  titulo VARCHAR(255) NOT NULL,
  orden INT NOT NULL DEFAULT 1,
  estado ENUM('pendiente', 'completado') DEFAULT 'pendiente',
  fecha_completado DATE NULL,
  avance_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pgo_id) REFERENCES pgo(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
  FOREIGN KEY (avance_id) REFERENCES avance_materia(id) ON DELETE SET NULL
);

SELECT 'Migracion v5 completada: tabla pgo_tareas disponible' AS resultado;
