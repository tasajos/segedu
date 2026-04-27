-- =====================================================
-- Migration v7: Estado de solicitudes de permiso
-- MySQL 8: ejecutar cada ALTER por separado
-- =====================================================
USE uni_tracking;

-- Agregar columna estado (ignorar si ya existe)
ALTER TABLE student_permission_requests
  ADD COLUMN estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente';

-- Agregar observacion del jefe al aprobar/rechazar
ALTER TABLE student_permission_requests
  ADD COLUMN observacion_jefe TEXT NULL;
