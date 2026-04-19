-- =====================================================
-- SEGEDU v2 - Migration script (ejecutar en uni_tracking)
-- =====================================================
USE uni_tracking;

-- 1. Agregar rol admin al ENUM
ALTER TABLE usuarios MODIFY rol ENUM('estudiante', 'docente', 'jefe', 'admin') NOT NULL;

-- 2. Tabla de horarios
CREATE TABLE IF NOT EXISTS horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  materia_id INT NOT NULL,
  docente_id INT NOT NULL,
  dia_semana ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  aula VARCHAR(50),
  periodo VARCHAR(50),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 3. Disciplina de estudiantes
CREATE TABLE IF NOT EXISTS disciplina_estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('falta', 'sancion', 'permiso') NOT NULL,
  estudiante_id INT NOT NULL,
  materia_id INT,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  registrado_por INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Disciplina de docentes
CREATE TABLE IF NOT EXISTS disciplina_docentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('falta', 'sancion', 'permiso') NOT NULL,
  docente_id INT NOT NULL,
  materia_id INT,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  registrado_por INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Unique key en asistencias para llamada de lista
ALTER TABLE asistencias
  ADD CONSTRAINT unique_asistencia UNIQUE (estudiante_id, materia_id, fecha);

-- 6. Usuario administrador del sistema
INSERT IGNORE INTO usuarios (nombre, apellido, email, password, rol, ci, telefono) VALUES
('Admin', 'Sistema', 'admin@uni.edu', '$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq', 'admin', '0000001', '70000000');

-- 7. Horarios de ejemplo (ajusta los IDs según tu DB)
-- INSERT INTO horarios (materia_id, docente_id, dia_semana, hora_inicio, hora_fin, aula, periodo, created_by)
-- VALUES (1, 1, 'Lunes', '08:00:00', '10:00:00', 'Aula 101', '2026-I', 1);

SELECT 'Migración v2 completada exitosamente' as resultado;
