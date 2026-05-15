import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { uploadMaterial } from '../middleware/upload.js';
import {
  misCursos, participantes,
  listarMaterial, subirMaterial, agregarEnlace, eliminarMaterial,
  listarFechasAsistencia, listarAsistencia, registrarAsistencia,
  listarNotas, guardarNotas
} from '../controllers/instructorController.js';

const router = Router();
router.use(verifyToken, requireRole('instructor'));

router.get('/mis-cursos', misCursos);

router.get('/cursos/:cursoId/participantes', participantes);

router.get('/cursos/:cursoId/material', listarMaterial);
router.post('/cursos/:cursoId/material', uploadMaterial.single('archivo'), subirMaterial);
router.post('/cursos/:cursoId/material/enlace', agregarEnlace);
router.delete('/cursos/:cursoId/material/:materialId', eliminarMaterial);

router.get('/cursos/:cursoId/asistencia/fechas', listarFechasAsistencia);
router.get('/cursos/:cursoId/asistencia', listarAsistencia);
router.post('/cursos/:cursoId/asistencia', registrarAsistencia);

router.get('/cursos/:cursoId/notas', listarNotas);
router.post('/cursos/:cursoId/notas', guardarNotas);

export default router;
