CREATE TABLE IF NOT EXISTS unidad_html_archivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unidad_id INT NOT NULL,
  docente_id INT NOT NULL,
  titulo VARCHAR(250) NOT NULL,
  descripcion TEXT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tamano BIGINT NOT NULL DEFAULT 0,
  orden INT NOT NULL DEFAULT 1,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_unidad_html (unidad_id, activo, orden),
  INDEX idx_docente_html (docente_id),
  CONSTRAINT fk_unidad_html_unidad FOREIGN KEY (unidad_id) REFERENCES unidades_instruccion(id) ON DELETE CASCADE,
  CONSTRAINT fk_unidad_html_docente FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO unidades_instruccion (nombre, descripcion, tipo, orden, activo)
SELECT 'Programación II', 'Guías prácticas interactivas de Programación II en formato HTML.', 'html',
       COALESCE(MAX(orden), 0) + 1, 1
FROM unidades_instruccion
WHERE NOT EXISTS (SELECT 1 FROM unidades_instruccion WHERE nombre = 'Programación II');
