-- ============================================================
-- Migración v12: Carpetas para presentaciones
-- Ejecutar en phpMyAdmin ANTES de subir el código
-- ============================================================

-- 1. Nueva tabla de carpetas (propiedad del docente)
CREATE TABLE IF NOT EXISTS carpetas_presentaciones (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  docente_id INT          NOT NULL,
  nombre     VARCHAR(200) NOT NULL,
  orden      INT          DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
);

-- 2. Agregar carpeta_id y orden a la tabla presentaciones
ALTER TABLE presentaciones
  ADD COLUMN carpeta_id INT NULL AFTER docente_id,
  ADD COLUMN orden      INT DEFAULT 0 AFTER carpeta_id;

-- 3. FK: al borrar una carpeta, sus presentaciones quedan sin carpeta (NULL)
ALTER TABLE presentaciones
  ADD CONSTRAINT fk_presentacion_carpeta
    FOREIGN KEY (carpeta_id)
    REFERENCES carpetas_presentaciones(id)
    ON DELETE SET NULL;
