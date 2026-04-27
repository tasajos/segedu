-- Migration v10: enlaces externos para presentaciones
USE uni_tracking;

ALTER TABLE presentaciones
  MODIFY tipo_archivo ENUM('pdf', 'pptx', 'link') NOT NULL,
  ADD COLUMN enlace_url VARCHAR(1000) NULL AFTER archivo_path;
