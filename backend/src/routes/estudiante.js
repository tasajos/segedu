import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  listarCursos, crearCurso, eliminarCurso,
  actualizarInfoPersonal,
  listarMateriasEstudiante, listarAsistenciasEstudiante,
  registrarAsistencia, resumenAsistencias
} from '../controllers/estudianteController.js';

const router = Router();
router.use(verifyToken, requireRole('estudiante'));

// Cursos de capacitación
router.get('/cursos', listarCursos);
router.post('/cursos', upload.single('certificado'), crearCurso);
router.delete('/cursos/:id', eliminarCurso);

// Información personal
router.put('/info-personal', actualizarInfoPersonal);

// Materias y asistencias
router.get('/materias', listarMateriasEstudiante);
router.get('/asistencias', listarAsistenciasEstudiante);
router.post('/asistencias', registrarAsistencia);
router.get('/asistencias/resumen', resumenAsistencias);

export default router;
