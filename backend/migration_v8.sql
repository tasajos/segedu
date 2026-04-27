-- Migration v8: Módulo Unidades de Instrucción
USE uni_tracking;

CREATE TABLE unidades_instruccion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) DEFAULT 'simulador',
  carrera_id INT NULL,
  orden INT DEFAULT 1,
  activo TINYINT(1) DEFAULT 1,
  creado_por INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, orden)
VALUES (
  'Circuitos Lógicos',
  'Simulador interactivo de circuitos lógicos. Ingresa una tabla de verdad y visualiza el circuito equivalente en tiempo real. Puedes alternar las entradas para ver cómo se propagan las señales.',
  'simulador',
  1
);
