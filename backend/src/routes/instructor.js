import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { uploadMaterial, uploadTarea, uploadEntrega } from '../middleware/upload.js';
import {
  misCursos, participantes,
  listarMaterial, subirMaterial, agregarEnlace, eliminarMaterial,
  listarFechasAsistencia, listarAsistencia, registrarAsistencia,
  listarNotas, guardarNotas,
  listarTareasInstructor, crearTareaInstructor, eliminarTareaInstructor,
  listarEntregasInstructor, calificarEntregaInstructor,
  verArchivoTareaInstructor, verEntregaInstructor, descargarEntregaInstructor
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

// Tareas del curso especial
router.get('/cursos/:cursoId/tareas', listarTareasInstructor);
router.post('/cursos/:cursoId/tareas', uploadTarea.single('archivo'), crearTareaInstructor);
router.delete('/cursos/:cursoId/tareas/:tareaId', eliminarTareaInstructor);
router.get('/cursos/:cursoId/tareas/:tareaId/entregas', listarEntregasInstructor);
router.put('/entregas-especiales/:entregaId/calificar', calificarEntregaInstructor);
router.get('/cursos/:cursoId/tareas/:tareaId/ver', verArchivoTareaInstructor);
router.get('/entregas-especiales/:entregaId/ver', verEntregaInstructor);
router.get('/entregas-especiales/:entregaId/descargar', descargarEntregaInstructor);

export default router;
