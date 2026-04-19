import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  listarCursos, crearCurso, eliminarCurso,
  actualizarInfoPersonal,
  listarMateriasEstudiante, listarAsistenciasEstudiante,
  registrarAsistencia, resumenAsistencias,
  miExpediente
} from '../controllers/estudianteController.js';

const router = Router();
router.use(verifyToken, requireRole('estudiante'));

router.get('/cursos', listarCursos);
router.post('/cursos', upload.single('certificado'), crearCurso);
router.delete('/cursos/:id', eliminarCurso);

router.put('/info-personal', actualizarInfoPersonal);

router.get('/materias', listarMateriasEstudiante);
router.get('/asistencias/resumen', resumenAsistencias);
router.get('/asistencias', listarAsistenciasEstudiante);
router.post('/asistencias', registrarAsistencia);

router.get('/expediente', miExpediente);

export default router;
