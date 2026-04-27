-- Migration v9: Módulo Presentaciones dentro de Unidades de Instrucción
USE uni_tracking;

CREATE TABLE presentaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  docente_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  archivo_nombre VARCHAR(300),
  archivo_path VARCHAR(500),
  tipo_archivo ENUM('pdf', 'pptx') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
);
