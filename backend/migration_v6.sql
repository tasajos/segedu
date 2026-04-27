-- =====================================================
-- Migration v6: Módulo de Tareas y Grupos de Estudiantes
-- =====================================================
USE uni_tracking;

-- Tareas asignadas por el docente al curso completo
CREATE TABLE IF NOT EXISTS tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  materia_id INT NOT NULL,
  docente_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega DATE,
  archivo_nombre VARCHAR(300),
  archivo_path VARCHAR(500),
  tipo_archivo ENUM('pdf', 'pptx') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
);

-- Entregas de tareas por estudiantes (solo archivos Word .docx)
CREATE TABLE IF NOT EXISTS entregas_tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tarea_id INT NOT NULL,
  estudiante_id INT NOT NULL,
  archivo_nombre VARCHAR(300) NOT NULL,
  archivo_path VARCHAR(500) NOT NULL,
  fecha_entrega DATETIME DEFAULT CURRENT_TIMESTAMP,
  calificacion DECIMAL(4,2) NULL,
  comentario_calificacion TEXT NULL,
  fecha_calificacion DATETIME NULL,
  UNIQUE KEY unique_entrega (tarea_id, estudiante_id),
  FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);

-- Grupos creados por estudiantes para tareas específicas
CREATE TABLE IF NOT EXISTS grupos_tarea (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tarea_id INT NOT NULL,
  materia_id INT NOT NULL,
  nombre_grupo VARCHAR(100) NOT NULL,
  creado_por INT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES estudiantes(id) ON DELETE CASCADE
);

-- Miembros de grupos: un estudiante solo puede estar en 1 grupo por tarea
CREATE TABLE IF NOT EXISTS miembros_grupo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id INT NOT NULL,
  tarea_id INT NOT NULL,
  estudiante_id INT NOT NULL,
  fecha_union DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_per_task (tarea_id, estudiante_id),
  FOREIGN KEY (grupo_id) REFERENCES grupos_tarea(id) ON DELETE CASCADE,
  FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);
