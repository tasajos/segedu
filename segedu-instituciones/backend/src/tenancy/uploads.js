// Archivos subidos, separados por institución.
// La URL guardada en la base no cambia (/uploads/<archivo>); lo que cambia es la carpeta física:
//   instalación por defecto → uploads/
//   institución con subdominio → uploads/instituciones/<subdominio>/
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { institucionActual } from './contexto.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');

export const dirUploads = (req = null) => {
  const inst = institucionActual() || req?.institucion || null;
  const dir = inst ? path.join(RAIZ, 'instituciones', inst.subdominio) : RAIZ;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/** Ruta física de un archivo subido de la institución actual (solo el nombre, sin carpetas). */
export const rutaUpload = (nombre) => path.join(dirUploads(), path.basename(String(nombre)));

const estaticos = new Map();
/** Sirve /uploads desde la carpeta de la institución de la petición. */
export const servirUploads = (req, res, next) => {
  const dir = dirUploads(req);
  if (!estaticos.has(dir)) estaticos.set(dir, express.static(dir));
  // Si el archivo no está en la carpeta de esta institución, es 404 (no se busca en otras).
  return estaticos.get(dir)(req, res, () => res.status(404).json({ error: 'Archivo no encontrado' }));
};

/**
 * Rutas donde puede estar un archivo subido. Con institución: solo su carpeta (aislamiento).
 * Sin institución: las ubicaciones históricas de la instalación por defecto.
 */
export const candidatosUpload = (nombre) => {
  const archivo = path.basename(String(nombre));
  if (institucionActual()) return [rutaUpload(archivo)];
  return [
    path.resolve(process.cwd(), 'uploads', archivo),
    path.resolve(process.cwd(), 'backend', 'uploads', archivo),
    path.join(RAIZ, archivo)
  ];
};
