-- =====================================================
-- Sistema de Seguimiento Universitario
-- Base de datos MySQL
-- =====================================================

DROP DATABASE IF EXISTS uni_tracking;
CREATE DATABASE uni_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE uni_tracking;

-- Usuarios (base para estudiantes, docentes, jefes)
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('estudiante', 'docente', 'jefe', 'admin') NOT NULL,
  ci VARCHAR(20),
  telefono VARCHAR(30),
  foto VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carreras
CREATE TABLE carreras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  jefe_id INT,
  FOREIGN KEY (jefe_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Estudiantes (datos adicionales)
CREATE TABLE estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNIQUE NOT NULL,
  carrera_id INT,
  semestre INT DEFAULT 1,
  codigo_estudiante VARCHAR(30) UNIQUE,
  fecha_ingreso DATE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL
);

-- Docentes
CREATE TABLE docentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNIQUE NOT NULL,
  especialidad VARCHAR(200),
  titulo VARCHAR(150),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Materias (mismo código puede existir en distintas carreras)
CREATE TABLE materias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  codigo VARCHAR(30) NOT NULL,
  carrera_id INT NOT NULL,
  docente_id INT,
  semestre INT NOT NULL,
  creditos INT DEFAULT 4,
  UNIQUE KEY unique_codigo_carrera (codigo, carrera_id),
  FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE SET NULL
);

-- Inscripción de estudiantes a materias
CREATE TABLE inscripciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  materia_id INT NOT NULL,
  fecha_inscripcion DATE DEFAULT (CURRENT_DATE),
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  UNIQUE KEY unique_inscripcion (estudiante_id, materia_id)
);

-- Cursos de capacitación subidos por estudiantes
CREATE TABLE cursos_capacitacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  nombre_curso VARCHAR(200) NOT NULL,
  institucion VARCHAR(200),
  fecha_inicio DATE,
  fecha_fin DATE,
  horas INT,
  certificado_url VARCHAR(500),
  descripcion TEXT,
  estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);

-- Asistencias por materia
CREATE TABLE asistencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  materia_id INT NOT NULL,
  fecha DATE NOT NULL,
  estado ENUM('presente', 'falta', 'permiso', 'tarde') NOT NULL,
  justificacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_asistencia (estudiante_id, materia_id, fecha),
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
);

-- PGO (Plan Global Operativo) subido por docentes
CREATE TABLE pgo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  materia_id INT NOT NULL,
  docente_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  archivo_url VARCHAR(500),
  periodo VARCHAR(50),
  estado ENUM('borrador', 'enviado', 'aprobado', 'rechazado', 'revision') DEFAULT 'enviado',
  observaciones TEXT,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_revision TIMESTAMP NULL,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
);

-- Avance de materia
CREATE TABLE avance_materia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  materia_id INT NOT NULL,
  docente_id INT NOT NULL,
  tema VARCHAR(200) NOT NULL,
  descripcion TEXT,
  porcentaje_avance DECIMAL(5,2) DEFAULT 0,
  fecha DATE NOT NULL,
  validado BOOLEAN DEFAULT FALSE,
  validado_por INT,
  fecha_validacion TIMESTAMP NULL,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
  FOREIGN KEY (validado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Comentarios sobre estudiantes
CREATE TABLE comentarios_estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  docente_id INT NOT NULL,
  materia_id INT,
  tipo ENUM('positivo', 'observacion', 'alerta', 'felicitacion') DEFAULT 'observacion',
  comentario TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL
);

-- Horarios de clases (asignados por jefe de carrera)
CREATE TABLE horarios (
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

-- Disciplina de estudiantes: faltas, sanciones, permisos formales
CREATE TABLE disciplina_estudiantes (
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

-- Disciplina de docentes: faltas, sanciones, permisos (solo jefe puede registrar)
CREATE TABLE disciplina_docentes (
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

-- =====================================================
-- DATOS DE PRUEBA
-- =====================================================

-- Contraseña para todos: "password123" (hasheada con bcrypt)
-- Hash: $2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq

-- Administrador del sistema
INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono) VALUES
('Admin', 'Sistema', 'admin@uni.edu', '$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq', 'admin', '0000001', '70000000');

-- Jefe de carrera
INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono) VALUES
('Carlos', 'Mendoza', 'jefe@uni.edu', '$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq', 'jefe', '1234567', '70000001');

-- Docentes
INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono) VALUES
('María', 'Rodríguez', 'docente@uni.edu', '$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq', 'docente', '2345678', '70000002'),
('Juan', 'Pérez', 'docente2@uni.edu', '$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq', 'docente', '3456789', '70000003');

-- Estudiantes
INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono) VALUES
('Ana', 'García', 'estudiante@uni.edu', '$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq', 'estudiante', '4567890', '70000004'),
('Luis', 'Torres', 'estudiante2@uni.edu', '$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq', 'estudiante', '5678901', '70000005'),
('Sofía', 'Vargas', 'estudiante3@uni.edu', '$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq', 'estudiante', '6789012', '70000006');

-- Carrera (jefe_id=2 porque admin ocupa el id=1 ahora)
INSERT INTO carreras (nombre, codigo, jefe_id) VALUES
('Ingeniería de Sistemas', 'ISI', 2);

-- Registros de docentes (usuario_id 3 y 4 porque admin=1, jefe=2)
INSERT INTO docentes (usuario_id, especialidad, titulo) VALUES
(3, 'Desarrollo de Software', 'MSc. en Ciencias de la Computación'),
(4, 'Bases de Datos', 'Ing. en Sistemas');

-- Registros de estudiantes (usuario_id 5,6,7)
INSERT INTO estudiantes (usuario_id, carrera_id, semestre, codigo_estudiante, fecha_ingreso) VALUES
(5, 1, 5, 'EST-2023-001', '2023-02-01'),
(6, 1, 5, 'EST-2023-002', '2023-02-01'),
(7, 1, 3, 'EST-2024-003', '2024-02-01');

-- Materias
INSERT INTO materias (nombre, codigo, carrera_id, docente_id, semestre, creditos) VALUES
('Programación Web', 'INF-501', 1, 1, 5, 5),
('Base de Datos II', 'INF-502', 1, 2, 5, 4),
('Estructuras de Datos', 'INF-301', 1, 1, 3, 5);

-- Inscripciones
INSERT INTO inscripciones (estudiante_id, materia_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 2),
(3, 3);

-- Horarios de ejemplo
INSERT INTO horarios (materia_id, docente_id, dia_semana, hora_inicio, hora_fin, aula, periodo, created_by) VALUES
(1, 1, 'Lunes', '08:00:00', '10:00:00', 'Aula 101', '2026-I', 2),
(1, 1, 'Miércoles', '08:00:00', '10:00:00', 'Aula 101', '2026-I', 2),
(2, 2, 'Martes', '10:00:00', '12:00:00', 'Lab DB', '2026-I', 2),
(3, 1, 'Jueves', '14:00:00', '16:00:00', 'Aula 203', '2026-I', 2);

-- Asistencias de ejemplo
INSERT INTO asistencias (estudiante_id, materia_id, fecha, estado) VALUES
(1, 1, '2026-04-15', 'presente'),
(1, 1, '2026-04-16', 'presente'),
(1, 1, '2026-04-17', 'falta'),
(1, 2, '2026-04-15', 'presente'),
(2, 1, '2026-04-15', 'presente'),
(2, 1, '2026-04-16', 'tarde'),
(3, 3, '2026-04-15', 'permiso');

-- Disciplina de ejemplo
INSERT INTO disciplina_estudiantes (tipo, estudiante_id, materia_id, fecha, descripcion, registrado_por) VALUES
('sancion', 1, 1, '2026-04-10', 'Uso de celular durante el examen', 2),
('permiso', 3, 3, '2026-04-15', 'Cita médica presentada con justificativo', 2);

INSERT INTO disciplina_docentes (tipo, docente_id, materia_id, fecha, descripcion, registrado_por) VALUES
('permiso', 1, 1, '2026-04-12', 'Permiso por capacitación docente externa', 2);

-- Cursos de capacitación
INSERT INTO cursos_capacitacion (estudiante_id, nombre_curso, institucion, fecha_inicio, fecha_fin, horas, estado) VALUES
(1, 'React Avanzado', 'Platzi', '2026-01-15', '2026-02-28', 40, 'aprobado'),
(2, 'Docker y Kubernetes', 'Udemy', '2026-02-01', '2026-03-15', 60, 'pendiente');

-- Cursos de capacitación
INSERT INTO cursos_capacitacion (estudiante_id, nombre_curso, institucion, fecha_inicio, fecha_fin, horas, estado) VALUES
(1, 'React Avanzado', 'Platzi', '2026-01-15', '2026-02-28', 40, 'aprobado'),
(2, 'Docker y Kubernetes', 'Udemy', '2026-02-01', '2026-03-15', 60, 'pendiente');

-- PGO de ejemplo
INSERT INTO pgo (materia_id, docente_id, titulo, descripcion, periodo, estado) VALUES
(1, 1, 'PGO Programación Web 2026-I', 'Plan global operativo para el semestre I-2026', '2026-I', 'enviado'),
(2, 2, 'PGO Base de Datos II 2026-I', 'Plan operativo de Base de Datos II', '2026-I', 'aprobado');

-- Avance de materia
INSERT INTO avance_materia (materia_id, docente_id, tema, descripcion, porcentaje_avance, fecha) VALUES
(1, 1, 'Introducción a React', 'Componentes, hooks y estado', 25.00, '2026-03-15'),
(1, 1, 'API REST con Node.js', 'Express, middleware y rutas', 50.00, '2026-04-10'),
(2, 2, 'Normalización', 'Formas normales 1FN, 2FN, 3FN', 30.00, '2026-03-20');

-- Comentarios
INSERT INTO comentarios_estudiantes (estudiante_id, docente_id, materia_id, tipo, comentario) VALUES
(1, 1, 1, 'felicitacion', 'Excelente participación en clase y entrega de proyectos.'),
(2, 1, 1, 'observacion', 'Debe mejorar la puntualidad en las entregas.'),
(3, 1, 3, 'alerta', 'Ha faltado varios días consecutivos, requiere seguimiento.');
